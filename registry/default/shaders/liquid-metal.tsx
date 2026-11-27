"use client";

import React, { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type LiquidMetalShape = "none" | "circle" | "rounded-rect";

export interface LiquidMetalProps {
  /** Color multiplied into the reflections. A near-white tint keeps the surface chrome. */
  colorTint?: string;
  /** Number of reflected light bands across the surface. */
  repetition?: number;
  /** Softness of the band edges: 0 is mirror sharp, 1 is brushed. */
  softness?: number;
  /** How strongly the surface ripples and flows. */
  distortion?: number;
  /** Color separation along band edges, like light through a thin lens. */
  dispersion?: number;
  /** Direction of the reflected bands, in degrees. */
  angle?: number;
  /** Animation speed. 0 holds the current frame. */
  speed?: number;
  /** Fill the container, or pour the metal into a shape with a transparent outside. */
  shape?: LiquidMetalShape;
  /** Size of the shape relative to the container, from 0 to 1. */
  shapeScale?: number;
  /** Renders a static frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const SHAPES: Record<LiquidMetalShape, number> = { none: 0, circle: 1, "rounded-rect": 2 };

// A static frame and the first animated frame start here, where the flow
// already has some movement, instead of at the symmetric t = 0.
const INITIAL_TIME = 7.5;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [1, 1, 1];
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uTint;
uniform float uRepetition;
uniform float uSoftness;
uniform float uDistortion;
uniform float uDispersion;
uniform float uAngle;
uniform int uShape;
uniform float uShapeScale;

out vec4 fragColor;

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float sdRoundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// What the metal reflects, one period per band: a bright sky fading
// toward a sharp dark horizon, then a dim ground that brightens again,
// with a softbox highlight high in the sky. Chrome reads as chrome
// because of that hard horizon line between light and dark.
float environment(float x, float soft) {
  float f = fract(x);
  float w = mix(0.004, 0.16, soft);
  float sky = mix(1.0, 0.46, smoothstep(0.0, 0.46, f));
  float ground = mix(0.07, 0.36, smoothstep(0.48, 0.97, f));
  float value = mix(sky, ground, smoothstep(0.46, 0.46 + w, f));
  value += (smoothstep(0.07, 0.07 + w, f) - smoothstep(0.17, 0.17 + w, f)) * 0.35;
  // Wrap smoothly into the next period's sky.
  return mix(value, 1.0, smoothstep(0.97 - w, 1.0, f));
}

void main() {
  float minRes = min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / minRes;
  vec2 halfExtent = 0.5 * uResolution / minRes;
  float pixel = 1.0 / minRes;

  // Signed distance to the shape: negative inside.
  float dist = -1.0;
  if (uShape == 1) {
    dist = length(p) - 0.5 * uShapeScale;
  } else if (uShape == 2) {
    vec2 halfSize = halfExtent * uShapeScale;
    dist = sdRoundedBox(p, halfSize, min(halfSize.x, halfSize.y) * 0.28);
  }

  float alpha = 1.0;
  float bevel = 0.0;
  if (uShape > 0) {
    alpha = 1.0 - smoothstep(-pixel, pixel, dist);
    if (alpha <= 0.0) {
      fragColor = vec4(0.0);
      return;
    }
    // 1 at the rim, easing to 0 a short way inside: the surface rolls over
    // the edge here, so the reflections bend to follow the outline.
    bevel = 1.0 - smoothstep(0.0, 0.14 * max(uShapeScale, 0.2), -dist);
  }

  float t = uTime;
  float k = uDistortion;
  vec2 q = rotate(radians(uAngle)) * p;

  // Two octaves of flowing domain warp give the slow, heavy liquid motion.
  vec2 w = q;
  w += k * 0.17 * vec2(
    sin(q.y * 3.1 + t * 0.8) + 0.55 * sin(q.y * 6.7 + q.x * 2.3 - t * 1.2),
    sin(q.x * 2.6 - t * 0.65) + 0.55 * sin(q.x * 5.9 - q.y * 1.7 + t * 1.05)
  );
  w += k * 0.06 * vec2(sin(w.y * 9.0 + t * 1.6), cos(w.x * 8.3 - t * 1.4));
  float height = sin(w.x * 3.7 + t * 0.55) * cos(w.y * 2.9 - t * 0.45);

  float x = w.y * uRepetition * 0.5 + height * 0.14 * k;
  x += bevel * bevel * 0.85 + bevel * 0.12 * sin(atan(p.y, p.x) * 3.0 + t * 0.4);

  float spread = uDispersion * 0.035 * (0.5 + 0.5 * bevel);
  vec3 color = vec3(
    environment(x - spread, uSoftness),
    environment(x, uSoftness),
    environment(x + spread, uSoftness)
  );

  // Light from above, a darker lip right at the rim, then the tint.
  color *= 0.8 + 0.28 * smoothstep(-halfExtent.y, halfExtent.y, p.y);
  color *= mix(1.0, 0.62, smoothstep(0.82, 1.0, bevel));
  color *= uTint;

  fragColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`;

type Uniforms = {
  uResolution: { value: Float32Array };
  uTime: { value: number };
  uTint: { value: Float32Array };
  uRepetition: { value: number };
  uSoftness: { value: number };
  uDistortion: { value: number };
  uDispersion: { value: number };
  uAngle: { value: number };
  uShape: { value: number };
  uShapeScale: { value: number };
};

type ShaderContext = {
  uniforms: Uniforms;
  draw: () => void;
  setRunning: (running: boolean) => void;
};

const LiquidMetal: React.FC<LiquidMetalProps> = ({
  colorTint = "#f4f5f7",
  repetition = 4,
  softness = 0.25,
  distortion = 1,
  dispersion = 0.35,
  angle = 70,
  speed = 0.6,
  shape = "none",
  shapeScale = 0.72,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPaused = paused || shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<ShaderContext | null>(null);
  const speedRef = useRef(speed);

  // Effect 1: build the WebGL context once and own the render loop.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return; // No WebGL: the container's own background shows instead.
    }
    const gl = renderer.gl;
    if (!gl) return;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const uniforms: Uniforms = {
      uResolution: { value: new Float32Array([1, 1]) },
      uTime: { value: INITIAL_TIME },
      uTint: { value: new Float32Array([1, 1, 1]) },
      uRepetition: { value: 4 },
      uSoftness: { value: 0.25 },
      uDistortion: { value: 1 },
      uDispersion: { value: 0.35 },
      uAngle: { value: 70 },
      uShape: { value: 0 },
      uShapeScale: { value: 0.72 },
    };
    const program = new Program(gl, { vertex, fragment, uniforms, transparent: true });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const draw = () => renderer.render({ scene: mesh });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      uniforms.uResolution.value[0] = gl.drawingBufferWidth;
      uniforms.uResolution.value[1] = gl.drawingBufferHeight;
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Time advances by frame delta times speed, so changing speed never jumps.
    let raf = 0;
    let last = 0;
    let wantsToRun = false;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const loop = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      uniforms.uTime.value += delta * speedRef.current;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      const shouldRun = wantsToRun && isVisible && isPageVisible;
      if (shouldRun && raf === 0) {
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!shouldRun && raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      sync();
    });
    intersectionObserver.observe(container);
    const onVisibilityChange = () => {
      isPageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    contextRef.current = {
      uniforms,
      draw,
      setRunning: (running) => {
        wantsToRun = running;
        sync();
        if (!running) draw();
      },
    };

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      contextRef.current = null;
      if (canvas.parentElement === container) container.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  // Effect 2: start or stop animating.
  useEffect(() => {
    contextRef.current?.setRunning(!isPaused);
  }, [isPaused]);

  // Effect 3: sync props to uniforms and draw, so a paused frame updates too.
  useEffect(() => {
    speedRef.current = speed;
    const context = contextRef.current;
    if (!context) return;
    const { uniforms } = context;
    uniforms.uTint.value.set(hexToRgb(colorTint));
    uniforms.uRepetition.value = repetition;
    uniforms.uSoftness.value = Math.min(Math.max(softness, 0), 1);
    uniforms.uDistortion.value = distortion;
    uniforms.uDispersion.value = dispersion;
    uniforms.uAngle.value = angle;
    uniforms.uShape.value = SHAPES[shape] ?? 0;
    uniforms.uShapeScale.value = Math.min(Math.max(shapeScale, 0.05), 1);
    context.draw();
  }, [colorTint, repetition, softness, distortion, dispersion, angle, speed, shape, shapeScale]);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`relative size-full overflow-hidden ${className}`.trim()}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
};

export default LiquidMetal;
