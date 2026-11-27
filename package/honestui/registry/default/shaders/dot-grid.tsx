"use client";

import React, { useRef } from "react";
import {
  CORE_UNIFORMS,
  NOISE_GLSL,
  effectContainerClass,
  rgb,
  useCssColors,
  useEffectCanvas,
} from "./effect-canvas";

export type DotGridShape = "circle" | "square" | "diamond" | "cross";
export type DotGridFade = "none" | "radial" | "edges" | "top" | "bottom";

export interface DotGridProps {
  /** Distance between dot centers in CSS pixels. */
  gap?: number;
  /** Dot diameter in CSS pixels. */
  dotSize?: number;
  /** Dot shape. */
  shape?: DotGridShape;
  /** Dot color. Any CSS color; `currentColor` follows the text color and theme. */
  color?: string;
  /** Dot opacity from 0 to 1. */
  opacity?: number;
  /** How far a slow wave swells and shrinks the dots, from 0 to 1. */
  wave?: number;
  /** How much dots twinkle independently, from 0 to 1. */
  twinkle?: number;
  /** Animation speed. */
  speed?: number;
  /** Grow and brighten dots near the pointer. */
  interactive?: boolean;
  /** Color of dots near the pointer. Defaults to `color`. */
  highlightColor?: string;
  /** Radius of the pointer highlight in CSS pixels. */
  highlightRadius?: number;
  /** Dot scale at the center of the highlight. */
  highlightScale?: number;
  /** Fade the grid out toward the edges so it sits softly behind content. */
  fade?: DotGridFade;
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform float uGap;
uniform float uDotSize;
uniform float uShape;
uniform vec4 uColor;
uniform vec4 uHighlight;
uniform float uOpacity;
uniform float uWave;
uniform float uTwinkle;
uniform float uSpeed;
uniform float uHighlightRadius;
uniform float uHighlightScale;
uniform float uFade;
out vec4 fragColor;
${NOISE_GLSL}

float shapeDistance(vec2 p, float radius) {
  if (uShape < 0.5) return length(p) - radius;
  if (uShape < 1.5) {
    vec2 d = abs(p) - vec2(radius * 0.88);
    return max(d.x, d.y);
  }
  if (uShape < 2.5) return (abs(p.x) + abs(p.y)) * 0.7071 - radius * 0.82;
  vec2 d = abs(p);
  float arm = radius * 0.32;
  return min(max(d.x - radius, d.y - arm), max(d.y - radius, d.x - arm));
}

float fadeMask(vec2 uv) {
  if (uFade < 0.5) return 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  if (uFade < 1.5) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / max(aspect, 1.0);
    return 1.0 - smoothstep(0.18, 0.62, length(p));
  }
  if (uFade < 2.5) {
    vec2 edge = min(uv, 1.0 - uv);
    return smoothstep(0.0, 0.18, edge.x) * smoothstep(0.0, 0.18, edge.y);
  }
  if (uFade < 3.5) return smoothstep(1.0, 0.25, uv.y);
  return smoothstep(0.0, 0.75, uv.y);
}

void main() {
  float dpr = uPixelRatio;
  float gap = max(uGap * dpr, 2.0);
  // Center the lattice so the outer dots sit the same distance from each edge.
  vec2 origin = mod(uResolution, gap) * 0.5;
  vec2 grid = (gl_FragCoord.xy - origin) / gap;
  vec2 id = floor(grid);
  vec2 center = (id + 0.5) * gap + origin;
  vec2 local = gl_FragCoord.xy - center;

  float t = uTime * uSpeed;
  float scale = 1.0;
  float alpha = 1.0;
  if (uWave > 0.0) {
    float phase = dot(id, vec2(0.21, 0.13)) - t * 1.4;
    float swell = 0.5 + 0.5 * sin(phase + valueNoise(id * 0.08 + t * 0.2) * 3.0);
    scale *= mix(1.0, 0.45 + 0.85 * swell, uWave);
    alpha *= mix(1.0, 0.55 + 0.45 * swell, uWave);
  }
  if (uTwinkle > 0.0) {
    float seed = hash12(id);
    float glow = 0.5 + 0.5 * sin(t * (1.5 + seed * 2.5) + seed * 6.2831);
    alpha *= mix(1.0, 0.25 + 0.75 * glow * glow, uTwinkle);
  }

  float near = 0.0;
  if (uPointerStrength > 0.001) {
    float radius = max(uHighlightRadius * dpr, 1.0);
    near = 1.0 - smoothstep(0.0, radius, distance(center, uPointer));
    near = near * near * (3.0 - 2.0 * near) * uPointerStrength;
  }

  float radius = uDotSize * 0.5 * dpr * scale * mix(1.0, uHighlightScale, near);
  radius = min(radius, gap * 0.5);
  float d = shapeDistance(local, radius);
  float coverage = 1.0 - smoothstep(-0.6, 0.6, d);

  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 color = mix(uColor.rgb, uHighlight.rgb, near);
  float opacity = mix(uOpacity * uColor.a, max(uOpacity, 0.9) * uHighlight.a, near);
  fragColor = vec4(color, coverage * alpha * opacity * fadeMask(uv));
}
`;

const SHAPES: Record<DotGridShape, number> = { circle: 0, square: 1, diamond: 2, cross: 3 };
const FADES: Record<DotGridFade, number> = { none: 0, radial: 1, edges: 2, top: 3, bottom: 4 };

export function DotGrid({
  gap = 20,
  dotSize = 2,
  shape = "circle",
  color = "currentColor",
  opacity = 0.35,
  wave = 0,
  twinkle = 0,
  speed = 1,
  interactive = true,
  highlightColor,
  highlightRadius = 140,
  highlightScale = 2.2,
  fade = "none",
  paused = false,
  className,
  children,
}: DotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dot, highlight] = useCssColors(containerRef, [color, highlightColor ?? color]);
  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: wave > 0 || twinkle > 0,
    paused,
    pointer: interactive,
    uniforms: {
      uGap: gap,
      uDotSize: dotSize,
      uShape: SHAPES[shape],
      uColor: [...rgb(dot), dot[3] ?? 1],
      uHighlight: [...rgb(highlight), highlight[3] ?? 1],
      uOpacity: Math.min(Math.max(opacity, 0), 1),
      uWave: Math.min(Math.max(wave, 0), 1),
      uTwinkle: Math.min(Math.max(twinkle, 0), 1),
      uSpeed: speed,
      uHighlightRadius: highlightRadius,
      uHighlightScale: highlightScale,
      uFade: FADES[fade],
    },
  });

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className)}
    >
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default DotGrid;
