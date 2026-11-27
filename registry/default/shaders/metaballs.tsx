"use client";

import React, { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface MetaballsProps {
  /** Number of drifting balls, from 1 to 20. */
  count?: number;
  /** Ball colors, up to 8. Balls take them in turn, and colors blend where balls merge. */
  colors?: string[];
  /** Overall ball size. */
  size?: number;
  /** How far the balls wander, from 0 (clustered in the center) to 1 (the full container). */
  spread?: number;
  /** Softness of the ball edges: 0 is crisp, 1 is a soft glow. */
  softness?: number;
  /** Animation speed. 0 holds the current frame. */
  speed?: number;
  /** Adds one more ball that follows the pointer and merges with the others. */
  followPointer?: boolean;
  /** Background color, or "transparent" to let the container show through. */
  backgroundColor?: string;
  /** Changes the ball paths while keeping the same look. */
  seed?: number;
  /** Renders a static frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_BALLS = 20;
const MAX_COLORS = 8;
const INITIAL_TIME = 12;

function parseColor(color: string): [number, number, number, number] {
  if (color.trim().toLowerCase() === "transparent") return [0, 0, 0, 0];
  const value = color.trim().replace(/^#/, "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [1, 1, 1, 1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return [r, g, b, 1];
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
uniform int uCount;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform float uSize;
uniform float uSpread;
uniform float uSoftness;
uniform vec4 uBackground;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uSeed;

out vec4 fragColor;

float hash(float n) {
  return fract(sin(n * 91.3458 + uSeed * 17.17) * 47453.5453);
}

void main() {
  float minRes = min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / minRes;
  vec2 halfExtent = 0.5 * uResolution / minRes;
  vec2 range = max(halfExtent - 0.08, vec2(0.05)) * uSpread;

  float field = 0.0;
  vec3 colorSum = vec3(0.0);
  float weightSum = 0.0;

  for (int i = 0; i < ${MAX_BALLS}; i++) {
    if (i >= uCount) break;
    float n = float(i) + 1.0;
    // Each ball traces its own slow Lissajous path at its own pace.
    float fx = 0.23 + 0.32 * hash(n);
    float fy = 0.19 + 0.34 * hash(n + 3.1);
    vec2 center = vec2(
      sin(uTime * fx + 6.2831 * hash(n + 7.7)),
      cos(uTime * fy + 6.2831 * hash(n + 11.3))
    ) * range;
    float radius = uSize * (0.075 + 0.055 * hash(n + 19.9));
    vec2 d = p - center;
    float v = radius * radius / max(dot(d, d), 1e-5);
    field += v;
    // Squared weights keep each ball's own color until it is deep inside
    // another, so merges show a short blend instead of a muddy average. The
    // cap stops a small ball's center from poking through as a dot.
    float weight = min(v, 4.0) * min(v, 4.0);
    colorSum += uColors[i % uColorCount] * weight;
    weightSum += weight;
  }

  if (uPointerStrength > 0.001) {
    float radius = uSize * 0.1 * uPointerStrength;
    vec2 d = p - uPointer;
    float v = radius * radius / max(dot(d, d), 1e-5);
    field += v;
    float weight = min(v, 4.0) * min(v, 4.0);
    colorSum += uColors[0] * weight;
    weightSum += weight;
  }

  vec3 color = colorSum / max(weightSum, 1e-6);

  // The surface sits where the summed field crosses 1. Its width is at least
  // one pixel, so edges stay antialiased at any size.
  // The field spikes toward each center, so its screen-space width is taken
  // from a clamped copy; otherwise centers read as huge edges and drop out.
  float bounded = min(field, 2.0);
  float aa = fwidth(bounded);
  float soft = max(aa, uSoftness * 0.9);
  float coverage = smoothstep(1.0 - soft, 1.0 + aa, bounded);

  // A faint lift toward the middle of each blob gives it some body.
  color *= 0.95 + 0.05 * smoothstep(1.0, 3.0, field);

  float alpha = coverage + uBackground.a * (1.0 - coverage);
  vec3 rgb = (color * coverage + uBackground.rgb * uBackground.a * (1.0 - coverage)) / max(alpha, 1e-6);
  fragColor = vec4(rgb, alpha);
}
`;

type Uniforms = {
  uResolution: { value: Float32Array };
  uTime: { value: number };
  uCount: { value: number };
  // A plain array: ogl only uploads uniform arrays (uColors[8]) from Array values.
  uColors: { value: number[] };
  uColorCount: { value: number };
  uSize: { value: number };
  uSpread: { value: number };
  uSoftness: { value: number };
  uBackground: { value: Float32Array };
  uPointer: { value: Float32Array };
  uPointerStrength: { value: number };
  uSeed: { value: number };
};

type ShaderContext = {
  uniforms: Uniforms;
  draw: () => void;
  setRunning: (running: boolean) => void;
};

const DEFAULT_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#38bdf8"];

const Metaballs: React.FC<MetaballsProps> = ({
  count = 9,
  colors = DEFAULT_COLORS,
  size = 1,
  spread = 0.8,
  softness = 0,
  speed = 1,
  followPointer = true,
  backgroundColor = "transparent",
  seed = 1,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPaused = paused || shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<ShaderContext | null>(null);
  const speedRef = useRef(speed);
  const followPointerRef = useRef(followPointer);

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
      uCount: { value: 9 },
      uColors: { value: new Array<number>(MAX_COLORS * 3).fill(1) },
      uColorCount: { value: 1 },
      uSize: { value: 1 },
      uSpread: { value: 0.8 },
      uSoftness: { value: 0 },
      uBackground: { value: new Float32Array([0, 0, 0, 0]) },
      uPointer: { value: new Float32Array([0, 0]) },
      uPointerStrength: { value: 0 },
      uSeed: { value: 1 },
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

    // Pointer, in the shader's units: the shorter side spans -0.5 to 0.5.
    const pointerTarget = [0, 0];
    let pointerInside = false;
    let raf = 0;

    const toShaderSpace = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const unit = Math.max(1, Math.min(rect.width, rect.height));
      pointerTarget[0] = (event.clientX - rect.left - rect.width / 2) / unit;
      pointerTarget[1] = -(event.clientY - rect.top - rect.height / 2) / unit;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!followPointerRef.current) return;
      toShaderSpace(event);
      if (!pointerInside) {
        // Enter where the pointer is instead of sliding in from the last spot.
        uniforms.uPointer.value[0] = pointerTarget[0];
        uniforms.uPointer.value[1] = pointerTarget[1];
      }
      pointerInside = true;
      if (raf === 0) {
        // Not animating (paused or reduced motion): follow without easing.
        uniforms.uPointer.value[0] = pointerTarget[0];
        uniforms.uPointer.value[1] = pointerTarget[1];
        uniforms.uPointerStrength.value = 1;
        draw();
      }
    };
    const onPointerLeave = () => {
      pointerInside = false;
      if (raf === 0) {
        uniforms.uPointerStrength.value = 0;
        draw();
      }
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // Time advances by frame delta times speed, so changing speed never jumps.
    let last = 0;
    let wantsToRun = false;
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const loop = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      uniforms.uTime.value += delta * speedRef.current;
      // Ease the pointer ball toward the pointer and grow or shrink it on
      // enter and leave, independent of the speed prop.
      const follow = 1 - Math.exp(-delta / 0.08);
      const pointer = uniforms.uPointer.value;
      pointer[0] += (pointerTarget[0] - pointer[0]) * follow;
      pointer[1] += (pointerTarget[1] - pointer[1]) * follow;
      const targetStrength = pointerInside && followPointerRef.current ? 1 : 0;
      uniforms.uPointerStrength.value +=
        (targetStrength - uniforms.uPointerStrength.value) * (1 - Math.exp(-delta / 0.15));
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
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
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
  const colorKey = colors.join(",");
  useEffect(() => {
    speedRef.current = speed;
    followPointerRef.current = followPointer;
    const context = contextRef.current;
    if (!context) return;
    const { uniforms } = context;
    const palette = (colorKey ? colorKey.split(",") : DEFAULT_COLORS).slice(0, MAX_COLORS);
    palette.forEach((color, index) => {
      const [r, g, b] = parseColor(color);
      uniforms.uColors.value.splice(index * 3, 3, r, g, b);
    });
    uniforms.uColorCount.value = Math.max(1, palette.length);
    uniforms.uCount.value = Math.round(Math.min(Math.max(count, 1), MAX_BALLS));
    uniforms.uSize.value = Math.max(size, 0.05);
    uniforms.uSpread.value = Math.min(Math.max(spread, 0), 1);
    uniforms.uSoftness.value = Math.min(Math.max(softness, 0), 1);
    uniforms.uBackground.value.set(parseColor(backgroundColor));
    uniforms.uSeed.value = seed;
    if (!followPointer) uniforms.uPointerStrength.value = 0;
    context.draw();
  }, [colorKey, count, size, spread, softness, speed, followPointer, backgroundColor, seed]);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`relative size-full overflow-hidden ${className}`.trim()}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
};

export default Metaballs;
