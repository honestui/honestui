"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mesh, Program, RenderTarget, Renderer, Triangle } from "ogl";
import { effectContainerClass, useCssColors } from "./effect-canvas";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type ReactionDiffusionPattern = "coral" | "spots" | "maze" | "drift";
export type ReactionDiffusionFade = "none" | "radial" | "edges" | "top" | "bottom";

export interface ReactionDiffusionProps {
  /** The pattern the simulation grows toward. Changing it morphs the current pattern. */
  pattern?: ReactionDiffusionPattern;
  /** Pattern color. Any CSS color; `currentColor` follows the text color and theme. */
  color?: string;
  /** Color between the pattern. Defaults to transparent so the page shows through. */
  background?: string;
  /** Opacity of the pattern, from 0 to 1. */
  opacity?: number;
  /** Fade the pattern out toward the edges so it sits softly behind content. */
  fade?: ReactionDiffusionFade;
  /** Size of one simulation cell in CSS pixels. Larger cells give a larger, coarser pattern. */
  scale?: number;
  /** How fast the pattern grows. 0 holds it still. */
  speed?: number;
  /** Paint new growth under the pointer. */
  interactive?: boolean;
  /** Seed for the starting spots. A new seed starts the pattern again. */
  seed?: number;
  /** Render one still frame of a settled pattern. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Feed and kill rates for the Gray-Scott model. Small changes give very
// different patterns; these are tuned for the diffusion rates below.
const PATTERNS: Record<ReactionDiffusionPattern, [feed: number, kill: number]> = {
  coral: [0.0545, 0.062],
  spots: [0.0367, 0.0649],
  maze: [0.029, 0.057],
  drift: [0.018, 0.051],
};

const FADES: Record<ReactionDiffusionFade, number> = { none: 0, radial: 1, edges: 2, top: 3, bottom: 4 };

const STEPS_PER_FRAME = 8;
const WARM_UP_STEPS = 400;
const SETTLED_STEPS = 3200;

const VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const SHARED = /* glsl */ `
float hash11(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}
`;

// Starting state: chemical A everywhere, with soft drops of B scattered
// across the field. The pattern grows outward from the drops.
const SEED_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uSeed;
uniform float uAspect;
out vec4 fragColor;
${SHARED}
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float b = 0.0;
  for (int i = 0; i < 28; i++) {
    float fi = float(i) + uSeed * 31.7;
    vec2 center = vec2(hash11(fi * 1.31 + 0.17) * uAspect, hash11(fi * 2.17 + 0.71));
    float radius = mix(0.012, 0.035, hash11(fi * 3.73 + 0.43));
    float d = length(p - center);
    b = max(b, 1.0 - smoothstep(radius * 0.6, radius, d));
  }
  fragColor = vec4(1.0 - b * 0.5, b * 0.25 + b * hash11(dot(vUv, vec2(91.7, 13.3)) + uSeed) * 0.05, 0.0, 1.0);
}
`;

// One Gray-Scott step. A diffuses twice as fast as B; B feeds on A and is
// removed at the kill rate. The edges wrap so the pattern tiles seamlessly.
const STEP_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uState;
uniform vec2 uSize;
uniform float uFeed;
uniform float uKill;
uniform vec4 uBrush;
uniform float uBrushRadius;
uniform float uAspect;
out vec4 fragColor;

vec2 cell(ivec2 p) {
  ivec2 size = ivec2(uSize);
  p = (p % size + size) % size;
  return texelFetch(uState, p, 0).xy;
}

void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec2 c = cell(p);
  vec2 lap = -c;
  lap += 0.2 * (cell(p + ivec2(1, 0)) + cell(p - ivec2(1, 0)) + cell(p + ivec2(0, 1)) + cell(p - ivec2(0, 1)));
  lap += 0.05 * (cell(p + ivec2(1, 1)) + cell(p + ivec2(-1, 1)) + cell(p + ivec2(1, -1)) + cell(p - ivec2(1, 1)));
  float a = c.x;
  float b = c.y;
  float reaction = a * b * b;
  float nextA = a + (1.0 * lap.x - reaction + uFeed * (1.0 - a));
  float nextB = b + (0.5 * lap.y + reaction - (uKill + uFeed) * b);
  if (uBrushRadius > 0.0) {
    // The pointer's path since the last frame, as a capsule, so fast strokes leave no gaps.
    vec2 scale = vec2(uAspect, 1.0);
    vec2 a0 = uBrush.xy * scale;
    vec2 a1 = uBrush.zw * scale;
    vec2 p = vUv * scale;
    vec2 ab = a1 - a0;
    float h = clamp(dot(p - a0, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
    float d = length(p - a0 - ab * h);
    float paint = 1.0 - smoothstep(uBrushRadius * 0.5, uBrushRadius, d);
    // The same mix the starting drops use, which every preset can grow from.
    nextA = min(nextA, 1.0 - paint * 0.5);
    nextB = max(nextB, paint * 0.5);
  }
  fragColor = vec4(clamp(nextA, 0.0, 1.0), clamp(nextB, 0.0, 1.0), 0.0, 1.0);
}
`;

// Display: smooth the coarse simulation with a manual bilinear sample (float
// textures cannot always be filtered), then draw a soft-edged two-tone
// pattern from the concentration of B.
const DISPLAY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uState;
uniform vec2 uSize;
uniform vec4 uColor;
uniform vec4 uBackground;
uniform float uOpacity;
uniform float uFade;
uniform float uAspect;
out vec4 fragColor;

float fadeMask(vec2 uv) {
  if (uFade < 0.5) return 1.0;
  if (uFade < 1.5) {
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
    return 1.0 - smoothstep(0.12, 0.6, length(p));
  }
  if (uFade < 2.5) {
    vec2 edge = min(uv, 1.0 - uv);
    return smoothstep(0.0, 0.2, edge.x) * smoothstep(0.0, 0.2, edge.y);
  }
  if (uFade < 3.5) return smoothstep(1.0, 0.2, uv.y);
  return smoothstep(0.0, 0.8, uv.y);
}

float sampleB(vec2 uv) {
  vec2 pos = uv * uSize - 0.5;
  vec2 base = floor(pos);
  vec2 f = fract(pos);
  ivec2 size = ivec2(uSize);
  ivec2 p0 = (ivec2(base) % size + size) % size;
  ivec2 p1 = (p0 + 1) % size;
  float a = texelFetch(uState, p0, 0).y;
  float b = texelFetch(uState, ivec2(p1.x, p0.y), 0).y;
  float c = texelFetch(uState, ivec2(p0.x, p1.y), 0).y;
  float d = texelFetch(uState, p1, 0).y;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  float b = sampleB(vUv);
  float edge = max(fwidth(b), 1e-4);
  float threshold = 0.2;
  float inside = smoothstep(threshold - edge, threshold + edge, b);
  // A faint glow just outside the edge keeps the shapes from looking cut out.
  float halo = smoothstep(0.04, threshold, b) * 0.12;
  float coverage = clamp(max(inside, halo) * uOpacity * uColor.a * fadeMask(vUv), 0.0, 1.0);
  vec3 color = mix(uBackground.rgb, uColor.rgb, uBackground.a > 0.0 ? coverage : 1.0);
  float alpha = uBackground.a > 0.0 ? max(uBackground.a, coverage) : coverage;
  fragColor = vec4(color, alpha);
}
`;

type Pair = { read: RenderTarget; write: RenderTarget; swap: () => void };

function canRenderFloat(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    const ok = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export function ReactionDiffusion({
  pattern = "coral",
  color = "currentColor",
  background = "transparent",
  opacity = 0.35,
  fade = "none",
  scale = 2,
  speed = 1,
  interactive = true,
  seed = 1,
  paused = false,
  className,
  children,
}: ReactionDiffusionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [unsupported, setUnsupported] = useState(false);
  const [ink, paper] = useCssColors(containerRef, [color, background]);

  const settingsRef = useRef({ pattern, opacity, fade, speed, interactive, ink, paper, still: paused || reduceMotion });
  const controlRef = useRef<{ render: () => void; sync: () => void; reseed: () => void } | null>(null);
  const seededPatternRef = useRef(pattern);

  useEffect(() => {
    settingsRef.current = { pattern, opacity, fade, speed, interactive, ink, paper, still: paused || reduceMotion };
    // Each preset grows from fresh seeds; most cannot grow from another preset's pattern.
    if (seededPatternRef.current !== pattern) {
      seededPatternRef.current = pattern;
      controlRef.current?.reseed();
    }
    controlRef.current?.sync();
    controlRef.current?.render();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!canRenderFloat()) {
      // Deferred so the fallback is not set synchronously inside the effect.
      const id = requestAnimationFrame(() => setUnsupported(true));
      return () => cancelAnimationFrame(id);
    }

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return;
    }
    const gl = renderer.gl as unknown as WebGL2RenderingContext;
    const fullFloat = !!gl.getExtension("EXT_color_buffer_float");
    if (!fullFloat && !gl.getExtension("EXT_color_buffer_half_float")) return;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    container.prepend(canvas);

    const geometry = new Triangle(renderer.gl);
    const make = (fragment: string, uniforms: Record<string, { value: unknown }>) =>
      new Program(renderer.gl, { vertex: VERTEX, fragment, uniforms, depthTest: false, depthWrite: false, cullFace: false });
    const seedProgram = make(SEED_FRAGMENT, { uSeed: { value: seed }, uAspect: { value: 1 } });
    const stepProgram = make(STEP_FRAGMENT, {
      uState: { value: null },
      uSize: { value: [1, 1] },
      uFeed: { value: 0 },
      uKill: { value: 0 },
      uBrush: { value: [0, 0, 0, 0] },
      uBrushRadius: { value: 0 },
      uAspect: { value: 1 },
    });
    const displayProgram = make(DISPLAY_FRAGMENT, {
      uState: { value: null },
      uSize: { value: [1, 1] },
      uColor: { value: [0, 0, 0, 1] },
      uBackground: { value: [0, 0, 0, 0] },
      uOpacity: { value: 1 },
      uFade: { value: 0 },
      uAspect: { value: 1 },
    });
    const seedMesh = new Mesh(renderer.gl, { geometry, program: seedProgram });
    const stepMesh = new Mesh(renderer.gl, { geometry, program: stepProgram });
    const displayMesh = new Mesh(renderer.gl, { geometry, program: displayProgram });

    const createTarget = (width: number, height: number) =>
      new RenderTarget(renderer.gl, {
        width,
        height,
        depth: false,
        type: fullFloat ? gl.FLOAT : gl.HALF_FLOAT,
        format: gl.RGBA,
        internalFormat: fullFloat ? gl.RGBA32F : gl.RGBA16F,
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
      });
    const deleteTarget = (target: RenderTarget) => {
      gl.deleteFramebuffer(target.buffer);
      for (const texture of target.textures) gl.deleteTexture(texture.texture);
    };

    let state: Pair | null = null;
    let size = { width: 0, height: 0 };
    // Segment from the pointer's position at the last frame to its position now.
    let brush: [number, number, number, number] = [0, 0, 0, 0];
    let brushRadius = 0;
    let lastPoint: [number, number] | null = null;
    let stepsDone = 0;

    const step = (count: number) => {
      if (!state) return;
      const [feed, kill] = PATTERNS[settingsRef.current.pattern] ?? PATTERNS.coral;
      stepProgram.uniforms.uFeed.value = feed;
      stepProgram.uniforms.uKill.value = kill;
      stepProgram.uniforms.uSize.value = [size.width, size.height];
      stepProgram.uniforms.uAspect.value = size.width / Math.max(1, size.height);
      for (let i = 0; i < count; i++) {
        stepProgram.uniforms.uState.value = state.read.texture;
        stepProgram.uniforms.uBrush.value = brush;
        stepProgram.uniforms.uBrushRadius.value = brushRadius;
        renderer.render({ scene: stepMesh, target: state.write, clear: false });
        state.swap();
      }
      stepsDone += count;
    };

    const draw = () => {
      if (!state) return;
      const { ink: inkColor, paper: paperColor, opacity: alpha } = settingsRef.current;
      displayProgram.uniforms.uState.value = state.read.texture;
      displayProgram.uniforms.uSize.value = [size.width, size.height];
      displayProgram.uniforms.uColor.value = inkColor;
      displayProgram.uniforms.uBackground.value = paperColor;
      displayProgram.uniforms.uOpacity.value = Math.min(Math.max(alpha, 0), 1);
      displayProgram.uniforms.uFade.value = FADES[settingsRef.current.fade] ?? 0;
      displayProgram.uniforms.uAspect.value = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight);
      renderer.render({ scene: displayMesh });
    };

    const build = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const cell = Math.max(1, scale);
      const next = { width: Math.max(8, Math.round(width / cell)), height: Math.max(8, Math.round(height / cell)) };
      if (state && next.width === size.width && next.height === size.height) {
        draw();
        return;
      }
      if (state) {
        deleteTarget(state.read);
        deleteTarget(state.write);
      }
      size = next;
      const pair = { read: createTarget(size.width, size.height), write: createTarget(size.width, size.height) };
      state = {
        ...pair,
        swap() {
          const read = this.read;
          this.read = this.write;
          this.write = read;
        },
      };
      reseed();
    };

    function reseed() {
      if (!state) return;
      seedProgram.uniforms.uAspect.value = size.width / Math.max(1, size.height);
      renderer.render({ scene: seedMesh, target: state.read, clear: false });
      stepsDone = 0;
      // Grow the pattern before the first frame so it never starts as bare dots.
      step(settingsRef.current.still ? SETTLED_STEPS : WARM_UP_STEPS);
      draw();
    }

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const running = () => !settingsRef.current.still && settingsRef.current.speed > 0 && isVisible && isPageVisible;

    const frame = () => {
      raf = 0;
      if (!running()) return;
      step(Math.max(1, Math.round(STEPS_PER_FRAME * Math.min(settingsRef.current.speed, 4))));
      // The brush paints only where the pointer moved since the last frame.
      brushRadius = 0;
      draw();
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      // Turning still after mount (reduced motion resolves late) still shows a settled pattern.
      if (settingsRef.current.still && state && stepsDone < SETTLED_STEPS) {
        step(SETTLED_STEPS - stepsDone);
        draw();
      }
      if (raf === 0 && running()) raf = requestAnimationFrame(frame);
      if (raf !== 0 && !running()) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    controlRef.current = { render: draw, sync, reseed };

    const resizeObserver = new ResizeObserver(build);
    resizeObserver.observe(container);
    build();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      sync();
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      isPageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPointerMove = (event: PointerEvent) => {
      if (!settingsRef.current.interactive || settingsRef.current.still) return;
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
      // Brush radius: about 14 CSS pixels, as a share of the height.
      const from = lastPoint ?? [x, y];
      // Extend the current segment when several moves arrive in one frame.
      brush = brushRadius > 0 ? [brush[0], brush[1], x, y] : [from[0], from[1], x, y];
      brushRadius = 12 / Math.max(1, rect.height);
      lastPoint = [x, y];
    };
    const onPointerLeave = () => {
      brushRadius = 0;
      lastPoint = null;
    };
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerdown", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave, { passive: true });

    sync();

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      controlRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      if (state) {
        deleteTarget(state.read);
        deleteTarget(state.write);
      }
      seedProgram.remove();
      stepProgram.remove();
      displayProgram.remove();
      geometry.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // A new seed or cell size starts the simulation again; everything else is read live.
  }, [seed, scale]);

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className)}
      // Without float render targets the container shows only its background.
      style={unsupported && background !== "transparent" ? { background } : undefined}
    >
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default ReactionDiffusion;
