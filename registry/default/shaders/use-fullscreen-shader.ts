"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

/**
 * Shared runtime for full-surface fragment shaders.
 *
 * It builds one WebGL2 context per mount and keeps it alive while props
 * change: new uniform values are written in place and, when the effect is
 * paused, one fresh frame is drawn so the still image follows the props.
 * Animation stops while the element is offscreen or the tab is hidden, and
 * time resumes where it stopped instead of jumping.
 */

export type ShaderUniformValue = number | readonly number[] | readonly (readonly number[])[];
export type ShaderUniformValues = Record<string, ShaderUniformValue>;

export const FULLSCREEN_VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Gradient noise, a sine-free hash, fbm, and helpers shared by the shaders.
 * Noise output is roughly in [-0.7, 0.7].
 */
export const GLSL_NOISE = `
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
mat2 rot2(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toGamma(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
`;

/** Parses #rgb, #rrggbb, or #rrggbbaa into 0–1 channels. Unknown input is white. */
export function parseHexColor(hex: string): [number, number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3 || value.length === 4
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  if (!/^[\da-f]{6}([\da-f]{2})?$/i.test(full)) return [1, 1, 1, 1];
  const channel = (index: number) => parseInt(full.slice(index, index + 2), 16) / 255;
  return [channel(0), channel(2), channel(4), full.length === 8 ? channel(6) : 1];
}

/**
 * Pads a color list to a fixed-size uniform array and reports how many
 * entries are real. The shader reads only the first `count` entries.
 */
export function prepareColorList(
  colors: readonly string[],
  maxColors: number,
  fallback: readonly string[],
): { list: [number, number, number][]; count: number } {
  const source = (colors.length ? colors : fallback).slice(0, maxColors);
  const list = source.map((color) => parseHexColor(color).slice(0, 3) as [number, number, number]);
  const count = list.length;
  while (list.length < maxColors) list.push(list[list.length - 1] ?? [1, 1, 1]);
  return { list, count };
}

interface UseFullscreenShaderOptions {
  fragment: string;
  /** Current uniform values. Pass a memoized object so unchanged props skip work. */
  uniforms: ShaderUniformValues;
  paused: boolean;
  /** Seconds of shader time to start from, so the first still frame is not t = 0. */
  startTime?: number;
}

type ShaderControl = {
  setUniforms: (values: ShaderUniformValues) => void;
  setPaused: (paused: boolean) => void;
};

function toUniformValue(value: ShaderUniformValue) {
  // ogl flattens arrays of vectors itself; copy so later prop mutations do not leak in.
  return typeof value === "number" ? value : value.map((item) => (typeof item === "number" ? item : [...item]));
}

export function useFullscreenShader({ fragment, uniforms, paused, startTime = 0 }: UseFullscreenShaderOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<ShaderControl | null>(null);
  const latestRef = useRef({ uniforms, paused, startTime });

  // Runs after every render, before the effects below, so the context is
  // always built from current values.
  useEffect(() => {
    latestRef.current = { uniforms, paused, startTime };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return;
    }
    // The shaders are GLSL ES 3.0; without WebGL2 the container keeps its CSS background.
    if (!renderer.isWebgl2) return;

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const initial = latestRef.current;
    const programUniforms: Record<string, { value: unknown }> = {
      iTime: { value: initial.startTime },
      iResolution: { value: [1, 1] },
    };
    for (const [name, value] of Object.entries(initial.uniforms)) {
      programUniforms[name] = { value: toUniformValue(value) };
    }

    let program: Program;
    try {
      program = new Program(gl, {
        vertex: FULLSCREEN_VERTEX,
        fragment,
        uniforms: programUniforms,
        // No blending: the shader writes straight (unpremultiplied) alpha into
        // a cleared buffer, which matches premultipliedAlpha: false above.
        transparent: false,
        depthTest: false,
      });
    } catch {
      try {
        container.removeChild(canvas);
      } catch {
        /* ignore */
      }
      return;
    }
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let time = initial.startTime;
    let raf = 0;
    let lastFrame = 0;
    let isPaused = initial.paused;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const draw = () => {
      programUniforms.iTime.value = time;
      renderer.render({ scene: mesh });
    };

    const frame = (now: number) => {
      // Clamp the step so a long frame (tab switch, debugger) does not jump.
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      lastFrame = now;
      time += delta;
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (isPaused || !isVisible || !isPageVisible || raf !== 0) return;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      programUniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      draw();
    };

    controlRef.current = {
      setUniforms: (values) => {
        for (const [name, value] of Object.entries(values)) {
          if (programUniforms[name]) programUniforms[name].value = toUniformValue(value);
        }
        if (raf === 0) draw();
      },
      setPaused: (next) => {
        isPaused = next;
        if (next) {
          stop();
          draw();
        } else {
          start();
        }
      },
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return () => {
      stop();
      controlRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      program.remove();
      try {
        container.removeChild(canvas);
      } catch {
        /* ignore */
      }
      // Release the context now rather than waiting for garbage collection;
      // browsers cap the number of live WebGL contexts per page.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [fragment]);

  useEffect(() => {
    controlRef.current?.setUniforms(uniforms);
  }, [uniforms]);

  useEffect(() => {
    controlRef.current?.setPaused(paused);
  }, [paused]);

  return containerRef;
}
