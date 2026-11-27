"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

/**
 * Shared WebGL plumbing for the image and pattern effects (Halftone, Ascii,
 * Pixelate, Dot Grid, Fluted Glass). One full-screen triangle, one fragment
 * shader, and a render loop that only runs while something moves: animation
 * that is visible and allowed, or the pointer easing in or out. Everything
 * else renders a single frame on demand.
 */

export type UniformValue = number | readonly number[] | Float32Array;

export interface EffectCanvasOptions {
  /** WebGL2 fragment shader. It must declare the core uniforms it reads. */
  fragment: string;
  /** Current uniform values, read on every render. */
  uniforms: Record<string, UniformValue>;
  /** Extra textures by uniform name. A new object identity uploads again. */
  textures?: Record<string, TexImageSource | null | undefined>;
  /** Image drawn into `uImage`. Without it `uHasImage` is 0. */
  imageSrc?: string;
  /** Whether the effect changes over time. */
  animated: boolean;
  /** Stop time, render one frame. */
  paused?: boolean;
  /** Track the pointer into `uPointer` and `uPointerStrength`. */
  pointer?: boolean;
}

/**
 * Core uniforms every effect shader can read:
 * - `uResolution` drawing-buffer size in device pixels
 * - `uPixelRatio` device pixels per CSS pixel
 * - `uTime` seconds of animation (frozen while paused)
 * - `uPointer` pointer position in device pixels, origin bottom-left
 * - `uPointerStrength` 0..1, eases in on hover and out on leave
 * - `uImage`, `uImageSize`, `uHasImage` the optional source image
 */
export const CORE_UNIFORMS = /* glsl */ `
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform float uHasImage;
`;

/** Value noise, fbm, and hashing shared by the effects. */
export const NOISE_GLSL = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * valueNoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    amplitude *= 0.5;
  }
  return value;
}
`;

/**
 * The source field: the image fitted with object-fit: cover, or, without an
 * image, a slow procedural field of three colors so the effect still has
 * something with light, shade, and color to work on. `uv` is 0..1 with the
 * origin bottom-left.
 */
export const SOURCE_GLSL = /* glsl */ `
uniform vec3 uSourceA;
uniform vec3 uSourceB;
uniform vec3 uSourceC;

vec2 coverUv(vec2 uv) {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);
  if (imageAspect > canvasAspect) {
    uv.x = (uv.x - 0.5) * canvasAspect / imageAspect + 0.5;
  } else {
    uv.y = (uv.y - 0.5) * imageAspect / canvasAspect + 0.5;
  }
  return uv;
}

vec3 proceduralSource(vec2 uv, float t) {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t * 0.08)), fbm(p * 1.6 + vec2(5.2, 1.3) - t * 0.06));
  float field = fbm(p * 1.8 + q * 1.7 + t * 0.04);
  vec2 c1 = vec2(aspect * (0.3 + 0.12 * sin(t * 0.23)), 0.62 + 0.14 * cos(t * 0.19));
  vec2 c2 = vec2(aspect * (0.72 + 0.1 * cos(t * 0.17)), 0.34 + 0.16 * sin(t * 0.21));
  float g1 = exp(-dot(p - c1, p - c1) * 5.5);
  float g2 = exp(-dot(p - c2, p - c2) * 4.5);
  vec3 color = mix(uSourceA, uSourceB, smoothstep(0.2, 0.8, field + g2 * 0.45));
  color = mix(color, uSourceC, clamp(g1 * 1.15 - field * 0.25, 0.0, 1.0));
  return color;
}

vec4 sampleSource(vec2 uv, float t) {
  if (uHasImage > 0.5) {
    return texture(uImage, clamp(coverUv(uv), 0.0, 1.0));
  }
  return vec4(proceduralSource(uv, t), 1.0);
}

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}
`;

export const VERTEX_GLSL = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

type EffectContext = {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
  image: Texture;
  uploaded: Map<string, { source: TexImageSource; texture: Texture }>;
  requestRender: () => void;
  syncLoop: () => void;
  setCanvasVisible: (visible: boolean) => void;
};

function setUniform(program: Program, name: string, value: UniformValue) {
  const uniforms = program.uniforms as Record<string, { value: unknown }>;
  const next = typeof value === "number" ? value : Array.from(value);
  if (uniforms[name]) uniforms[name].value = next;
  else uniforms[name] = { value: next };
}

export function useEffectCanvas(
  containerRef: RefObject<HTMLDivElement | null>,
  options: EffectCanvasOptions,
) {
  const reduceMotion = usePrefersReducedMotion();
  // Which source finished loading or failed. Comparing with the current src
  // means a new src reads as loading without resetting state in an effect.
  const [imageResult, setImageResult] = useState<{ src: string; ok: boolean } | null>(null);
  const contextRef = useRef<EffectContext | null>(null);
  const optionsRef = useRef(options);
  const motionRef = useRef({ reduceMotion, paused: Boolean(options.paused) });

  useEffect(() => {
    optionsRef.current = options;
    motionRef.current = { reduceMotion, paused: Boolean(options.paused) };
  });

  const { fragment, pointer = false } = options;

  // Build the WebGL context once per shader program.
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
    const gl = renderer.gl;
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.transition = "opacity 300ms ease-out";
    // While an image loads (or if it fails) the fallback <img> shows, so the
    // canvas stays hidden until it has the pixels.
    canvas.style.opacity = optionsRef.current.imageSrc ? "0" : "1";
    container.appendChild(canvas);

    const image = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      width: 1,
      height: 1,
    });

    const uniforms: Record<string, { value: unknown }> = {
      uResolution: { value: [1, 1] },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uPointer: { value: [-1e4, -1e4] },
      uPointerStrength: { value: 0 },
      uImage: { value: image },
      uImageSize: { value: [1, 1] },
      uHasImage: { value: 0 },
    };

    let program: Program;
    try {
      program = new Program(gl, {
        vertex: VERTEX_GLSL,
        fragment,
        uniforms,
        // No blending: the shader writes straight (unpremultiplied) RGBA into
        // a cleared canvas, which the page composites correctly.
        transparent: false,
        depthTest: false,
        depthWrite: false,
      });
    } catch {
      container.removeChild(canvas);
      return;
    }
    for (const [name, value] of Object.entries(optionsRef.current.uniforms)) {
      setUniform(program, name, value);
    }
    // Every declared texture starts as an empty 1px texture so the program
    // never draws with an unbound sampler while a source is still loading.
    for (const name of Object.keys(optionsRef.current.textures ?? {})) {
      (program.uniforms as Record<string, { value: unknown }>)[name] = {
        value: new Texture(gl, { generateMipmaps: false, width: 1, height: 1 }),
      };
    }

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let raf = 0;
    let time = 0;
    let lastFrame = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const pointerState = { x: -1e4, y: -1e4, targetX: -1e4, targetY: -1e4, strength: 0, target: 0 };

    const timeRuns = () => {
      const { reduceMotion: reduced, paused } = motionRef.current;
      return optionsRef.current.animated && !paused && !reduced;
    };
    const pointerMoving = () =>
      Math.abs(pointerState.strength - pointerState.target) > 0.002 ||
      Math.abs(pointerState.x - pointerState.targetX) > 0.5 ||
      Math.abs(pointerState.y - pointerState.targetY) > 0.5;

    const draw = () => {
      setUniform(program, "uTime", time);
      setUniform(program, "uPointer", [pointerState.x, pointerState.y]);
      setUniform(program, "uPointerStrength", pointerState.strength);
      renderer.render({ scene: mesh });
    };

    const frame = (now: number) => {
      raf = 0;
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now;
      if (timeRuns()) time += delta;
      const ease = 1 - Math.exp(-delta * 9);
      pointerState.strength += (pointerState.target - pointerState.strength) * ease;
      if (pointerState.x < -9e3) {
        pointerState.x = pointerState.targetX;
        pointerState.y = pointerState.targetY;
      } else {
        const follow = 1 - Math.exp(-delta * 18);
        pointerState.x += (pointerState.targetX - pointerState.x) * follow;
        pointerState.y += (pointerState.targetY - pointerState.y) * follow;
      }
      draw();
      if (isVisible && isPageVisible && (timeRuns() || pointerMoving())) {
        raf = requestAnimationFrame(frame);
      } else {
        lastFrame = 0;
      }
    };

    const syncLoop = () => {
      if (raf !== 0) return;
      if (isVisible && isPageVisible && (timeRuns() || pointerMoving())) {
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    let pendingRender = 0;
    const requestRender = () => {
      if (raf !== 0 || pendingRender !== 0) return;
      pendingRender = requestAnimationFrame(() => {
        pendingRender = 0;
        if (raf === 0) draw();
        syncLoop();
      });
    };

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      setUniform(program, "uResolution", [gl.drawingBufferWidth, gl.drawingBufferHeight]);
      setUniform(program, "uPixelRatio", gl.drawingBufferWidth / width);
      draw();
    };
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) requestRender();
      else if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastFrame = 0;
      }
    });
    intersectionObserver.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) requestRender();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const toBufferSpace = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const scale = gl.drawingBufferWidth / Math.max(rect.width, 1);
      return [(event.clientX - rect.left) * scale, (rect.bottom - event.clientY) * scale] as const;
    };
    const onPointerMove = (event: PointerEvent) => {
      const [x, y] = toBufferSpace(event);
      pointerState.targetX = x;
      pointerState.targetY = y;
      pointerState.target = 1;
      syncLoop();
    };
    const onPointerLeave = () => {
      pointerState.target = 0;
      syncLoop();
    };
    if (pointer) {
      container.addEventListener("pointermove", onPointerMove, { passive: true });
      container.addEventListener("pointerdown", onPointerMove, { passive: true });
      container.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    contextRef.current = {
      renderer,
      program,
      mesh,
      image,
      uploaded: new Map(),
      requestRender,
      syncLoop,
      setCanvasVisible: (visible) => {
        canvas.style.opacity = visible ? "1" : "0";
      },
    };
    requestRender();

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      if (pendingRender !== 0) cancelAnimationFrame(pendingRender);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      contextRef.current = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [containerRef, fragment, pointer]);

  // Push the latest uniforms and textures on every render. This is cheap: no
  // GPU work happens until the next frame draws.
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const { program, renderer, uploaded } = context;
    for (const [name, value] of Object.entries(options.uniforms)) {
      setUniform(program, name, value);
    }
    for (const [name, source] of Object.entries(options.textures ?? {})) {
      if (!source) continue;
      const current = uploaded.get(name);
      if (current?.source === source) continue;
      const gl = renderer.gl;
      const texture =
        current?.texture ??
        new Texture(gl, {
          generateMipmaps: false,
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
          flipY: false,
        });
      texture.image = source as unknown as Texture["image"];
      texture.needsUpdate = true;
      uploaded.set(name, { source, texture });
      (program.uniforms as Record<string, { value: unknown }>)[name] = { value: texture };
    }
    context.syncLoop();
    context.requestRender();
  });

  // Load the source image into `uImage`.
  const { imageSrc } = options;
  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const { program, image } = context;
    if (!imageSrc) {
      setUniform(program, "uHasImage", 0);
      context.setCanvasVisible(true);
      context.requestRender();
      return;
    }
    let cancelled = false;
    // Hide the canvas until the new image is on the GPU; the fallback <img>
    // shows meanwhile.
    context.setCanvasVisible(false);
    const element = new Image();
    element.crossOrigin = "anonymous";
    element.decoding = "async";
    element.onload = () => {
      const current = contextRef.current;
      if (cancelled || !current) return;
      image.image = element;
      image.needsUpdate = true;
      setUniform(program, "uImageSize", [element.naturalWidth, element.naturalHeight]);
      setUniform(program, "uHasImage", 1);
      current.setCanvasVisible(true);
      current.requestRender();
      setImageResult({ src: imageSrc, ok: true });
    };
    element.onerror = () => {
      if (cancelled) return;
      setUniform(program, "uHasImage", 0);
      setImageResult({ src: imageSrc, ok: false });
    };
    element.src = imageSrc;
    return () => {
      cancelled = true;
      element.onload = null;
      element.onerror = null;
    };
  }, [imageSrc, fragment]);

  const settled = imageSrc != null && imageResult?.src === imageSrc ? imageResult : null;
  return { imageReady: settled?.ok === true, imageFailed: settled?.ok === false };
}

let colorProbe: CanvasRenderingContext2D | null = null;

/**
 * Resolve any CSS color (hex, rgb, oklch, a custom property, currentColor) to
 * linear 0..1 RGBA by letting the browser compute it in the container's
 * context, then painting it into a 1px canvas.
 */
export function resolveCssColor(container: HTMLElement, value: string): [number, number, number, number] {
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  container.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  container.removeChild(probe);
  if (!colorProbe) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    colorProbe = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!colorProbe) return [0, 0, 0, 1];
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = "#000";
  colorProbe.fillStyle = computed;
  colorProbe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorProbe.getImageData(0, 0, 1, 1).data;
  const alpha = a / 255;
  if (alpha === 0) return [0, 0, 0, 0];
  return [r / 255 / alpha, g / 255 / alpha, b / 255 / alpha, alpha].map((channel) =>
    Math.min(1, channel),
  ) as [number, number, number, number];
}

/**
 * Resolve a list of CSS colors against a container, and again whenever the
 * page theme changes (class or style on <html>), so `currentColor` and custom
 * properties follow light and dark mode.
 */
export function useCssColors(
  containerRef: RefObject<HTMLDivElement | null>,
  colors: readonly string[],
): [number, number, number, number][] {
  const key = colors.join("\u0000");
  const [resolved, setResolved] = useState<[number, number, number, number][]>(() =>
    colors.map(() => [0, 0, 0, 1]),
  );

  // Layout effect: colors resolve before the first paint, so the canvas never
  // shows a frame drawn with the placeholder black.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const list = key.split("\u0000");
    const update = () => setResolved(list.map((color) => resolveCssColor(container, color)));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    return () => observer.disconnect();
  }, [containerRef, key]);

  return resolved;
}

export function rgb(color: readonly number[]): [number, number, number] {
  return [color[0] ?? 0, color[1] ?? 0, color[2] ?? 0];
}

/**
 * Container classes for an effect. The container must be positioned so the
 * canvas can fill it, but a caller placing it with `absolute`, `fixed`, or
 * `sticky` must win over the default `relative`.
 */
export function effectContainerClass(className: string | undefined, extra = "") {
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className ?? "");
  return [positioned ? "" : "relative", "isolate overflow-hidden", extra, className ?? ""]
    .filter(Boolean)
    .join(" ");
}
