"use client";

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type AiGlowBorderState = "idle" | "thinking" | "streaming" | "error";

export interface AiGlowBorderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** The element the light wraps, usually a prompt bar. Its layout is never changed. */
  children?: React.ReactNode;
  /**
   * What the assistant is doing. `idle` fades the light out, `thinking` sends a slow
   * comet around the edge, `streaming` runs a livelier flowing shimmer, and `error`
   * flashes the edge once in the danger color, then fades.
   */
  state?: AiGlowBorderState;
  /**
   * Corner radius in pixels. `"auto"` reads the first child's border radius, so the
   * light hugs any rounded element without configuration.
   */
  radius?: number | "auto";
  /**
   * Colors the light is made of. `"spectrum"` is a soft blue–violet–pink blend,
   * `"mono"` uses the wrapper's text color so it follows light and dark themes, or
   * pass up to 6 hex colors.
   */
  palette?: "spectrum" | "mono" | string[];
  /**
   * How lively the streaming shimmer is, from 0 to 1. Drive it from the token rate to
   * make the edge quicken while text arrives fast.
   */
  intensity?: number;
  /** Reach of the outer glow in pixels. */
  bloom?: number;
  /** Width of the crisp edge line in pixels. */
  thickness?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Classes for the light layer, for example to change its stacking order. */
  glowClassName?: string;
}

const MAX_COLORS = 6;
const SPECTRUM = ["#5b8cff", "#8b6bff", "#d46bff", "#ff6fae"];
const FALLBACK_DANGER = "#e5484d";
/** Seconds a state takes to cross-fade in or out. */
const FADE_SECONDS = 0.45;
/** Seconds the error flash lasts before it has faded away. */
const ERROR_SECONDS = 1.6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Parses #rgb, #rrggbb, rgb() and rgba() strings. Unknown strings become white. */
const parseColor = (input: string): [number, number, number] => {
  const value = input.trim();
  const hex = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(value);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].replace(/(.)/g, "$1$1") : hex[1];
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as [number, number, number];
  }
  const rgb = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return [1, 1, 1];
};

/** Space the canvas needs outside the element so the bloom fades to nothing. */
const glowMargin = (bloom: number, thickness: number) => Math.ceil(Math.max(0, bloom) * 1.4 + thickness + 2);

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

#define MAX_COLORS ${MAX_COLORS}
#define TAU 6.28318530718

uniform vec2 uResolution;
uniform vec2 uBoxHalf;
uniform float uRadius;
uniform float uThickness;
uniform float uBloom;
uniform float uMargin;
uniform float uTime;
uniform float uThinking;
uniform float uStreaming;
uniform float uError;
uniform float uIntensity;
uniform float uStill;
uniform vec3 uColors[MAX_COLORS];
uniform float uColorCount;
uniform vec3 uDanger;
uniform float uLightTheme;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Distance walked clockwise along one quadrant of the outline, from the top
// center to the point's nearest place on it. Walking the real outline keeps the
// light moving at an even pace on long, flat boxes such as prompt bars.
float quadrantArc(vec2 q, vec2 b, float r) {
  vec2 c = b - r;
  vec2 v = q - c;
  float corner = 0.25 * TAU * r;
  if (v.x <= 0.0 && v.y <= 0.0) {
    return (b.y - q.y) <= (b.x - q.x) ? q.x : c.x + corner + (c.y - q.y);
  }
  if (v.x <= 0.0) return q.x;
  if (v.y <= 0.0) return c.x + corner + (c.y - q.y);
  return c.x + atan(v.x, v.y) * r;
}

// A smooth loop through the palette; t is 0..1 around the loop.
vec3 palette(float t) {
  float n = max(uColorCount, 1.0);
  float x = fract(t) * n;
  float i = floor(x);
  float f = smoothstep(0.0, 1.0, fract(x));
  int a = int(mod(i, n));
  int b = int(mod(i + 1.0, n));
  return mix(uColors[a], uColors[b], f);
}

// Brightness of a comet whose head is at "head", at position u (both 0..1
// around the edge). x is the signed distance behind the head.
float cometAt(float u, float head, float decay) {
  float x = fract(head - u);
  if (x > 0.5) x -= 1.0;
  if (x < 0.0) return exp(-(x * x) / (0.022 * 0.022));
  // The tail reaches exactly zero half way round, where it meets the next head.
  float floorValue = exp(-0.5 * decay);
  return (exp(-x * decay) - floorValue) / (1.0 - floorValue);
}

void main() {
  vec2 p = gl_FragCoord.xy - uResolution * 0.5;
  vec2 b = max(uBoxHalf, vec2(1.0));
  float r = clamp(uRadius, 0.0, min(b.x, b.y));
  float d = roundedBox(p, b, r);

  float quarter = (b.x - r) + 0.25 * TAU * r + (b.y - r);
  float perimeter = 4.0 * quarter;
  vec2 q = abs(p);
  float s = quadrantArc(q, b, r);
  float arc;
  if (p.x >= 0.0 && p.y >= 0.0) arc = s;
  else if (p.x >= 0.0) arc = 2.0 * quarter - s;
  else if (p.y < 0.0) arc = 2.0 * quarter + s;
  else arc = 4.0 * quarter - s;
  float u = arc / perimeter;
  float t = uTime;

  // Thinking: one comet and a fainter partner opposite it, circling slowly.
  // Behind the head the light decays slowly into a tail; ahead of it, it falls
  // off over a short, smooth distance, so the head has no hard edge.
  float head = fract(t * 0.11);
  float comet = cometAt(u, head, 6.5) + 0.35 * cometAt(u, fract(head + 0.5), 9.0);
  comet = mix(comet, 0.55, uStill);
  vec3 cometColor = palette(u + t * 0.03);

  // Streaming: the palette flows around the whole edge, with ripples whose
  // speed and depth follow the intensity. Every term repeats a whole number of
  // times around the edge, so there is no seam where the loop closes.
  float pace = 0.35 + uIntensity * 0.9;
  float ripple = 0.5 + 0.5 * sin((u * 5.0 - t * pace * 0.9) * TAU);
  float ripple2 = 0.5 + 0.5 * sin((u * 2.0 + t * pace * 0.37) * TAU + 1.3);
  float flow = 0.42 + (0.28 + 0.3 * uIntensity) * (0.6 * ripple + 0.4 * ripple2);
  flow = mix(flow, 0.6, uStill);
  vec3 flowColor = palette(u * 2.0 - t * pace * 0.12);

  float energy = comet * uThinking + flow * uStreaming + 0.9 * uError;
  vec3 color = (cometColor * comet * uThinking + flowColor * flow * uStreaming + uDanger * 0.9 * uError)
    / max(energy, 1e-4);
  energy = clamp(energy, 0.0, 1.2);

  // A crisp edge line, a short glow inward and a long, soft bloom outward. Both
  // glows equal 1 on the edge, so the ring has no seam.
  float halfLine = max(uThickness, 0.5) * 0.5;
  float line = 1.0 - smoothstep(halfLine, halfLine + 1.2, abs(d));
  float outside = max(d, 0.0);
  float inside = max(-d, 0.0);
  float outer = exp(-outside / max(uBloom * 0.4, 0.5)) * (1.0 - smoothstep(uMargin * 0.7, uMargin, outside));
  float inner = exp(-inside / max(uBloom * 0.12, 0.5));
  float glow = (d > 0.0 ? outer : inner) * 0.55;

  // On a light page, light that whitens toward its core disappears into the
  // background, so a light theme keeps the full color and draws a little denser.
  float density = mix(1.0, 1.35, uLightTheme);
  float alpha = clamp((line * 0.85 + glow) * energy * density, 0.0, 1.0);
  vec3 tint = mix(color, vec3(1.0), 0.22 * line * clamp(energy, 0.0, 1.0) * (1.0 - uLightTheme));
  fragColor = vec4(tint * alpha, alpha);
}
`;

let webglSupport: boolean | null = null;
const probeWebGL = () => {
  if (webglSupport !== null) return webglSupport;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    webglSupport = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
};
const subscribeNoop = () => () => {};

type Uniforms = Record<string, { value: number | number[] | Float32Array }>;

type GlowContext = {
  renderer: Renderer;
  program: Program;
  render: () => void;
  setSize: () => void;
};

/** Reads the colors the light is made of. "mono" follows the wrapper's text color. */
const resolvePalette = (palette: AiGlowBorderProps["palette"], element: HTMLElement | null) => {
  if (Array.isArray(palette) && palette.length) return palette.slice(0, MAX_COLORS).map(parseColor);
  if (palette === "mono" && element) {
    const color = parseColor(getComputedStyle(element).color);
    return [color, color.map((c) => c * 0.55 + 0.45 * (1 - c) * 0.35) as [number, number, number], color];
  }
  return SPECTRUM.map(parseColor);
};

const readDanger = (element: HTMLElement | null) => {
  if (!element) return parseColor(FALLBACK_DANGER);
  const token = getComputedStyle(element).getPropertyValue("--hui-color-foreground-danger-primary").trim();
  return parseColor(token || FALLBACK_DANGER);
};

/** Watches the theme so "mono" and the danger color follow a light/dark switch. */
const useThemeVersion = () => {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const observer = new MutationObserver(bump);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", bump);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", bump);
    };
  }, []);
  return version;
};

const AiGlowBorder = React.forwardRef<HTMLDivElement, AiGlowBorderProps>(function AiGlowBorder(
  {
    children,
    state = "idle",
    radius = "auto",
    palette = "spectrum",
    intensity = 0.6,
    bloom = 18,
    thickness = 1.25,
    speed = 1,
    className = "",
    glowClassName = "",
    style,
    ...rest
  },
  forwardedRef,
) {
  const reducedMotion = usePrefersReducedMotion();
  const fallback = !useSyncExternalStore(subscribeNoop, probeWebGL, () => true);
  const themeVersion = useThemeVersion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<GlowContext | null>(null);
  useImperativeHandle(forwardedRef, () => rootRef.current as HTMLDivElement);

  const [measuredRadius, setMeasuredRadius] = useState(16);
  const resolvedRadius = radius === "auto" ? measuredRadius : Math.max(0, radius);
  const margin = glowMargin(bloom, thickness);

  // Animation state lives in refs so the render loop never waits on React.
  const timeRef = useRef(0);
  const weightsRef = useRef({ thinking: 0, streaming: 0, error: 0 });
  const errorAgeRef = useRef(Infinity);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const startLoopRef = useRef<() => void>(() => {});

  // Reads the child's corner radius for radius="auto". A wrapper such as a form
  // often has no radius while the element that fills it does, so it looks a few
  // levels down for the first rounded element that covers the child's box.
  const measureRadius = useCallback(() => {
    const child = rootRef.current?.firstElementChild as HTMLElement | null;
    if (!child || child === glowRef.current) return;
    const box = child.getBoundingClientRect();
    const queue: Array<[Element, number]> = [[child, 0]];
    while (queue.length) {
      const [element, depth] = queue.shift()!;
      const rect = element.getBoundingClientRect();
      const covers = Math.abs(rect.width - box.width) <= 1 && Math.abs(rect.height - box.height) <= 1;
      if (covers) {
        const value = parseFloat(getComputedStyle(element).borderTopLeftRadius);
        if (Number.isFinite(value) && value > 0) {
          setMeasuredRadius(value);
          return;
        }
      }
      if (depth < 3) for (const next of Array.from(element.children)) queue.push([next, depth + 1]);
    }
    setMeasuredRadius(0);
  }, []);

  useEffect(() => {
    if (radius !== "auto") return;
    measureRadius();
    const child = rootRef.current?.firstElementChild;
    if (!child) return;
    const observer = new ResizeObserver(measureRadius);
    observer.observe(child);
    return () => observer.disconnect();
  }, [radius, measureRadius, themeVersion]);

  // Effect 1: the WebGL context lives as long as the component.
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || fallback) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    glow.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Float32Array([1, 1]) },
        uBoxHalf: { value: new Float32Array([1, 1]) },
        uRadius: { value: 16 },
        uThickness: { value: 1.25 },
        uBloom: { value: 18 },
        uMargin: { value: 28 },
        uTime: { value: 0 },
        uThinking: { value: 0 },
        uStreaming: { value: 0 },
        uError: { value: 0 },
        uIntensity: { value: 0.6 },
        uStill: { value: 0 },
        uColors: { value: new Array(MAX_COLORS * 3).fill(1) },
        uColorCount: { value: 1 },
        uDanger: { value: [0.9, 0.28, 0.3] },
        uLightTheme: { value: 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const render = () => renderer.render({ scene: mesh });

    const setSize = () => {
      const rect = glow.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height);
      const uniforms = program.uniforms as Uniforms;
      const dpr = renderer.dpr;
      const currentMargin = (uniforms.uMargin.value as number) / dpr;
      (uniforms.uResolution.value as Float32Array).set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      (uniforms.uBoxHalf.value as Float32Array).set([
        Math.max(1, (width / 2 - currentMargin) * dpr),
        Math.max(1, (height / 2 - currentMargin) * dpr),
      ]);
      render();
    };
    ctxRef.current = { renderer, program, render, setSize };
    const ro = new ResizeObserver(setSize);
    ro.observe(glow);
    setSize();

    return () => {
      ro.disconnect();
      ctxRef.current = null;
      program.remove();
      geometry.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      try {
        glow.removeChild(canvas);
      } catch {
        /* already gone */
      }
    };
  }, [fallback]);

  // Effect 2: props and theme to uniforms. Pixel sizes become device pixels.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const uniforms = ctx.program.uniforms as Uniforms;
    const dpr = ctx.renderer.dpr;
    const colors = resolvePalette(palette, rootRef.current);
    const packed: number[] = [];
    for (let i = 0; i < MAX_COLORS; i += 1) packed.push(...colors[i % colors.length]);
    uniforms.uColors.value = packed;
    uniforms.uColorCount.value = colors.length;
    uniforms.uDanger.value = readDanger(rootRef.current);
    // Dark text means a light page.
    const [r, g, b] = rootRef.current ? parseColor(getComputedStyle(rootRef.current).color) : [1, 1, 1];
    uniforms.uLightTheme.value = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5 ? 1 : 0;
    uniforms.uRadius.value = resolvedRadius * dpr;
    uniforms.uThickness.value = Math.max(0.5, thickness) * dpr;
    uniforms.uBloom.value = Math.max(0, bloom) * dpr;
    uniforms.uMargin.value = margin * dpr;
    uniforms.uIntensity.value = clamp(intensity, 0, 1);
    uniforms.uStill.value = reducedMotion ? 1 : 0;
    ctx.setSize();
  }, [palette, resolvedRadius, thickness, bloom, margin, intensity, reducedMotion, themeVersion]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Effect 3: the render loop. It runs while any state is visible, on screen and in
  // a visible tab, and stops once the light has faded out completely.
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || fallback) return;

    let raf = 0;
    let onScreen = true;
    let last = performance.now();

    const targets = () => {
      const current = stateRef.current;
      return { thinking: current === "thinking" ? 1 : 0, streaming: current === "streaming" ? 1 : 0 };
    };

    const errorEnvelope = (age: number) => {
      if (age >= ERROR_SECONDS) return 0;
      const rise = clamp(age / 0.12, 0, 1);
      const fall = 1 - clamp((age - 0.35) / (ERROR_SECONDS - 0.35), 0, 1);
      return rise * fall * fall;
    };

    const draw = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const uniforms = ctx.program.uniforms as Uniforms;
      const w = weightsRef.current;
      uniforms.uTime.value = timeRef.current;
      uniforms.uThinking.value = w.thinking;
      uniforms.uStreaming.value = w.streaming;
      uniforms.uError.value = w.error;
      ctx.render();
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      timeRef.current += dt * speedRef.current;
      errorAgeRef.current += dt;
      const target = targets();
      const w = weightsRef.current;
      const k = clamp(dt / FADE_SECONDS, 0, 1);
      w.thinking += (target.thinking - w.thinking) * Math.min(1, k * 2.2);
      w.streaming += (target.streaming - w.streaming) * Math.min(1, k * 2.2);
      w.error = errorEnvelope(errorAgeRef.current);
      draw();
      const settled =
        target.thinking === 0 &&
        target.streaming === 0 &&
        w.thinking < 0.002 &&
        w.streaming < 0.002 &&
        w.error === 0;
      if (settled) {
        w.thinking = 0;
        w.streaming = 0;
        draw();
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (raf !== 0 || !onScreen || document.hidden) return;
      if (reducedMotion) {
        // One still frame per change: the target state at full strength, and the
        // error flash shown, then cleared after the same time it would take to fade.
        const target = targets();
        weightsRef.current.thinking = target.thinking;
        weightsRef.current.streaming = target.streaming;
        weightsRef.current.error = errorAgeRef.current < ERROR_SECONDS ? 0.7 : 0;
        draw();
        return;
      }
      last = performance.now();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
    };
    startLoopRef.current = start;

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(glow);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      startLoopRef.current = () => {};
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fallback, reducedMotion]);

  // State changes restart the loop. An error starts a fresh flash.
  useEffect(() => {
    stateRef.current = state;
    if (state === "error") errorAgeRef.current = 0;
    startLoopRef.current();
    if (reducedMotion && state === "error") {
      const timer = window.setTimeout(() => {
        errorAgeRef.current = Infinity;
        startLoopRef.current();
      }, ERROR_SECONDS * 1000);
      return () => window.clearTimeout(timer);
    }
  }, [state, reducedMotion]);

  // Without WebGL: a still CSS ring in the palette, faded in for thinking and
  // streaming and shown briefly in the danger color for an error.
  const [fallbackError, setFallbackError] = useState(false);
  useEffect(() => {
    if (!fallback || state !== "error") return;
    const on = window.setTimeout(() => setFallbackError(true), 0);
    const off = window.setTimeout(() => setFallbackError(false), ERROR_SECONDS * 1000);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
    };
  }, [fallback, state]);
  const fallbackColors =
    Array.isArray(palette) && palette.length ? palette : palette === "mono" ? ["currentColor"] : SPECTRUM;
  const ringBackground =
    fallbackColors.length > 1 ? `conic-gradient(from 0deg, ${fallbackColors.join(", ")})` : fallbackColors[0];
  const fallbackVisible = state === "thinking" || state === "streaming" || fallbackError;
  const ringMask = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)";

  return (
    <div
      ref={rootRef}
      data-slot="ai-glow-border"
      data-state={state}
      className={`relative ${className}`.trim()}
      style={{ position: "relative", borderRadius: resolvedRadius, ...style }}
      {...rest}
    >
      {children}
      <div
        ref={glowRef}
        aria-hidden="true"
        data-slot="ai-glow-border-glow"
        className={glowClassName}
        style={{ position: "absolute", inset: -margin, pointerEvents: "none", zIndex: 1 }}
      >
        {fallback ? (
          <div
            style={{
              position: "absolute",
              inset: margin,
              borderRadius: resolvedRadius,
              padding: Math.max(1, thickness),
              background: fallbackError ? "var(--hui-color-foreground-danger-primary, #e5484d)" : ringBackground,
              WebkitMask: ringMask,
              mask: ringMask,
              boxShadow: `0 0 ${bloom * 0.6}px color-mix(in oklch, currentColor 18%, transparent)`,
              opacity: fallbackVisible ? 0.8 : 0,
              transition: reducedMotion ? "none" : `opacity ${FADE_SECONDS * 1000}ms ease`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
});

export default AiGlowBorder;
