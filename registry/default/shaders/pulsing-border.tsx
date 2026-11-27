"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface PulsingBorderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** Content the glow wraps. The glow never changes its layout. */
  children?: React.ReactNode;
  /** Show the glow. Changing it fades the ring in or out. */
  active?: boolean;
  /** Freeze the animation on its current frame. */
  paused?: boolean;
  /** Colors carried around the ring as soft light spots. Up to 8. */
  colors?: string[];
  /** Corner radius in pixels. Match the border radius of the wrapped element. */
  radius?: number;
  /** Width of the bright core line in pixels. */
  thickness?: number;
  /** Blur of the core line, from 0 (crisp) to 1 (soft). */
  softness?: number;
  /** Overall brightness, from 0 to 2. */
  intensity?: number;
  /** How far the outer glow reaches, in pixels. */
  bloom?: number;
  /** How far the glow reaches into the element, in pixels. */
  innerGlow?: number;
  /** Number of light spots travelling around the ring, from 1 to 8. */
  spots?: number;
  /** Length of each spot as a share of the space between spots, from 0.1 to 1.5. */
  spotSize?: number;
  /** Breathing strength, from 0 (steady) to 1. */
  pulse?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Wispy noise in the glow, from 0 (clean) to 1. */
  smoke?: number;
  /** Size of the smoke wisps. */
  smokeScale?: number;
  /** Classes for the glow layer, for example to change its stacking order. */
  glowClassName?: string;
}

const MAX_COLORS = 8;
const MAX_SPOTS = 8;

const DEFAULT_COLORS = ["#4f8bff", "#a35bff", "#ff5fb4", "#ffa53d"];

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const packColors = (colors: string[]) => {
  const list = (colors.length ? colors : DEFAULT_COLORS).slice(0, MAX_COLORS);
  // A plain array: ogl only uploads uniform arrays (uColors[0]) from Array
  // values, not typed arrays.
  const packed: number[] = [];
  for (let i = 0; i < MAX_COLORS; i += 1) {
    packed.push(...hexToRgb(list[i % list.length]));
  }
  return { packed, count: list.length };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Space the canvas needs outside the element so the bloom fades to nothing. */
const glowMargin = (bloom: number, thickness: number) => Math.ceil(Math.max(0, bloom) * 1.35 + thickness + 2);

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

#define MAX_COLORS ${MAX_COLORS}
#define MAX_SPOTS ${MAX_SPOTS}
#define TAU 6.28318530718

uniform vec2 uResolution;
uniform vec2 uBoxHalf;
uniform float uRadius;
uniform float uThickness;
uniform float uSoftness;
uniform float uIntensity;
uniform float uBloom;
uniform float uInner;
uniform float uMargin;
uniform float uSpots;
uniform float uSpotSize;
uniform float uPulse;
uniform float uSmoke;
uniform float uSmokeScale;
uniform float uTime;
uniform vec3 uColors[MAX_COLORS];
uniform float uColorCount;
out vec4 fragColor;

// Signed distance to a rounded rectangle centered on the origin.
float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Arc length from the top center of one quadrant's outline to the point's
// nearest place on it, walking clockwise. Measuring along the real outline
// keeps spots moving at an even pace on wide or tall boxes.
float quadrantArc(vec2 q, vec2 b, float r) {
  vec2 c = b - r;
  vec2 v = q - c;
  float top = c.x;
  float corner = 0.25 * TAU * r;
  if (v.x <= 0.0 && v.y <= 0.0) {
    // Inside the straight part of the box: use whichever edge is nearer.
    return (b.y - q.y) <= (b.x - q.x) ? q.x : top + corner + (c.y - q.y);
  }
  if (v.x <= 0.0) return q.x;
  if (v.y <= 0.0) return top + corner + (c.y - q.y);
  return top + atan(v.x, v.y) * r;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 p = gl_FragCoord.xy - uResolution * 0.5;
  vec2 b = max(uBoxHalf, vec2(1.0));
  float r = clamp(uRadius, 0.0, min(b.x, b.y));
  float d = roundedBox(p, b, r);

  // Position around the outline, 0..1 clockwise from the top center.
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
  float breath = 0.5 + 0.5 * sin(t * 1.9);
  float pulse = 1.0 + uPulse * (breath - 0.5) * 0.9;

  // Light spots: each drifts around the ring at its own pace and wobbles a
  // little, so the colors keep reshuffling instead of rotating as one wheel.
  vec3 colorSum = vec3(0.0);
  float weightSum = 0.0;
  float spotCount = clamp(uSpots, 1.0, float(MAX_SPOTS));
  float spacing = 1.0 / spotCount;
  float width = max(uSpotSize, 0.05) * spacing * 0.6;
  for (int i = 0; i < MAX_SPOTS; i++) {
    if (float(i) >= spotCount) break;
    float fi = float(i);
    float rate = 0.045 * (1.0 + 0.35 * sin(fi * 2.37 + 0.6));
    float center = fract(fi * spacing + t * rate + 0.04 * sin(t * 0.7 + fi * 1.9));
    float gap = abs(u - center);
    gap = min(gap, 1.0 - gap);
    float weight = exp(-(gap * gap) / (width * width));
    weight *= 0.75 + 0.25 * sin(t * 1.3 + fi * 2.1);
    int index = int(mod(fi, max(uColorCount, 1.0)));
    colorSum += uColors[index] * weight;
    weightSum += weight;
  }
  // A faint floor of the average color keeps the ring continuous between spots.
  vec3 average = vec3(0.0);
  for (int i = 0; i < MAX_COLORS; i++) {
    if (float(i) >= uColorCount) break;
    average += uColors[i];
  }
  average /= max(uColorCount, 1.0);
  vec3 color = (colorSum + average * 0.04) / (weightSum + 0.04);
  float energy = clamp(weightSum, 0.0, 1.0);

  // Smoke: noise that flows along the outline and outwards, breaking the
  // glow into wisps.
  float wisps = 1.0;
  if (uSmoke > 0.001) {
    vec2 flow = vec2(arc / (36.0 * uSmokeScale), d / (22.0 * uSmokeScale));
    float n = fbm(flow + vec2(-t * 0.35, t * 0.22));
    wisps = mix(1.0, 0.25 + 1.5 * n, uSmoke);
  }

  // Core line, then the outer bloom and the shorter inner glow.
  float half_ = max(uThickness, 0.25) * 0.5;
  float soft = 0.6 + uSoftness * (uThickness + 1.5);
  float core = 1.0 - smoothstep(half_, half_ + soft, abs(d));

  float outside = max(d, 0.0);
  float inside = max(-d, 0.0);
  float bloomSize = max(uBloom, 0.5) * 0.42 * pulse;
  // Outside the edge the bloom decays over its reach; inside, the same glow
  // decays much faster. Both equal 1 at the edge, so the ring has no seam.
  float outer = exp(-outside / bloomSize) * (1.0 - smoothstep(uMargin * 0.7, uMargin, outside));
  float inner = exp(-inside / max(uInner * 0.45, 0.5));
  float glow = (d > 0.0 ? outer : inner) * 0.62 * wisps;

  float coreAlpha = core * (0.5 + 0.5 * energy);
  float glowAlpha = glow * (0.25 + 0.75 * energy) * pulse;
  float alpha = clamp((coreAlpha + glowAlpha) * uIntensity, 0.0, 1.0);

  // The core runs a little hotter than its glow, like a lit filament.
  vec3 tint = mix(color, vec3(1.0), 0.28 * core * energy);
  fragColor = vec4(tint * alpha, alpha);
}
`;

// Probed once per page on the client. The server and the first client render
// assume WebGL2 so markup matches; browsers without it get the CSS ring.
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

type PulsingBorderCtx = {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
  render: () => void;
  setSize: () => void;
};

const PulsingBorder = React.forwardRef<HTMLDivElement, PulsingBorderProps>(function PulsingBorder(
  {
    children,
    active = true,
    paused = false,
    colors = DEFAULT_COLORS,
    radius = 16,
    thickness = 1.5,
    softness = 0.35,
    intensity = 1,
    bloom = 22,
    innerGlow = 8,
    spots = 4,
    spotSize = 0.7,
    pulse = 0.35,
    speed = 1,
    smoke = 0.25,
    smokeScale = 1,
    className = "",
    glowClassName = "",
    style,
    ...rest
  },
  forwardedRef,
) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isAnimated = !paused && !shouldReduceMotion && active;
  const glowRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<PulsingBorderCtx | null>(null);
  const timeRef = useRef(0);
  const speedRef = useRef(speed);
  const fallback = !useSyncExternalStore(subscribeNoop, probeWebGL, () => true);

  const margin = glowMargin(bloom, thickness);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

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
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Float32Array([1, 1]) },
        uBoxHalf: { value: new Float32Array([1, 1]) },
        uRadius: { value: 16 },
        uThickness: { value: 1.5 },
        uSoftness: { value: 0.35 },
        uIntensity: { value: 1 },
        uBloom: { value: 22 },
        uInner: { value: 8 },
        uMargin: { value: 30 },
        uSpots: { value: 4 },
        uSpotSize: { value: 0.7 },
        uPulse: { value: 0.35 },
        uSmoke: { value: 0.25 },
        uSmokeScale: { value: 1 },
        uTime: { value: 0 },
        uColors: { value: packColors(DEFAULT_COLORS).packed },
        uColorCount: { value: DEFAULT_COLORS.length },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const render = () => renderer.render({ scene: mesh });

    const setSize = () => {
      const rect = glow.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height);
      const uniforms = program.uniforms as Record<string, { value: number | Float32Array }>;
      const dpr = renderer.dpr;
      const currentMargin = (uniforms.uMargin.value as number) / dpr;
      (uniforms.uResolution.value as Float32Array).set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      (uniforms.uBoxHalf.value as Float32Array).set([
        Math.max(1, (width / 2 - currentMargin) * dpr),
        Math.max(1, (height / 2 - currentMargin) * dpr),
      ]);
      render();
    };
    ctxRef.current = { renderer, program, mesh, render, setSize };
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
        /* ignore */
      }
    };
  }, [fallback]);

  // Effect 2: props to uniforms. Pixel sizes are scaled to device pixels.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const uniforms = ctx.program.uniforms as Record<string, { value: number | number[] | Float32Array }>;
    const dpr = ctx.renderer.dpr;
    const { packed, count } = packColors(colors);
    uniforms.uRadius.value = Math.max(0, radius) * dpr;
    uniforms.uThickness.value = Math.max(0.25, thickness) * dpr;
    uniforms.uSoftness.value = clamp(softness, 0, 1);
    uniforms.uIntensity.value = clamp(intensity, 0, 2);
    uniforms.uBloom.value = Math.max(0, bloom) * dpr;
    uniforms.uInner.value = Math.max(0, innerGlow) * dpr;
    uniforms.uMargin.value = margin * dpr;
    uniforms.uSpots.value = clamp(Math.round(spots), 1, MAX_SPOTS);
    uniforms.uSpotSize.value = clamp(spotSize, 0.1, 1.5);
    uniforms.uPulse.value = clamp(pulse, 0, 1);
    uniforms.uSmoke.value = clamp(smoke, 0, 1);
    uniforms.uSmokeScale.value = Math.max(0.1, smokeScale);
    uniforms.uColors.value = packed;
    uniforms.uColorCount.value = count;
    ctx.setSize();
  }, [colors, radius, thickness, softness, intensity, bloom, innerGlow, margin, spots, spotSize, pulse, smoke, smokeScale]);

  // Effect 3: the render loop. It only runs while the glow is shown,
  // on screen, and the tab is visible; otherwise the last frame stays.
  useEffect(() => {
    const glow = glowRef.current;
    const ctx = ctxRef.current;
    if (!glow || !ctx || !isAnimated) return;

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    let last = performance.now();
    const uniforms = ctx.program.uniforms as Record<string, { value: number }>;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      timeRef.current += dt * speedRef.current;
      uniforms.uTime.value = timeRef.current;
      ctx.render();
      raf = requestAnimationFrame(loop);
    };
    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) tryStart();
        else tryStop();
      },
      { threshold: 0 },
    );
    io.observe(glow);
    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    tryStart();

    return () => {
      tryStop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAnimated]);

  const fallbackColors = (colors.length ? colors : DEFAULT_COLORS).slice(0, MAX_COLORS);
  const conic = `conic-gradient(from 0deg, ${[...fallbackColors, fallbackColors[0]].join(", ")})`;

  return (
    <div
      ref={forwardedRef}
      data-slot="pulsing-border"
      data-active={active ? "" : undefined}
      className={`relative ${className}`.trim()}
      style={{ position: "relative", borderRadius: radius, ...style }}
      {...rest}
    >
      {children}
      <div
        ref={glowRef}
        aria-hidden="true"
        data-slot="pulsing-border-glow"
        className={glowClassName}
        style={{
          position: "absolute",
          inset: -margin,
          pointerEvents: "none",
          zIndex: 1,
          opacity: active ? 1 : 0,
          transition: "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {fallback ? (
          // Without WebGL: a still conic ring with a blurred copy for bloom.
          <>
            <div
              style={{
                position: "absolute",
                inset: margin - bloom * 0.35,
                borderRadius: radius + bloom * 0.35,
                background: conic,
                filter: `blur(${Math.max(2, bloom * 0.45)}px)`,
                opacity: 0.45 * clamp(intensity, 0, 2),
                WebkitMask: `linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)`,
                mask: `linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)`,
                padding: Math.max(thickness, bloom * 0.35),
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: margin,
                borderRadius: radius,
                padding: Math.max(1, thickness),
                background: conic,
                WebkitMask: `linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)`,
                mask: `linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)`,
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
});

export default PulsingBorder;
