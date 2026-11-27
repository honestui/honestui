"use client";

import React, { useMemo } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import { GLSL_NOISE, prepareColorList, useFullscreenShader } from "./use-fullscreen-shader";

export type WarpPattern = "fbm" | "ridged" | "marble";

export interface WarpProps {
  /** Two to six colors, mapped from the lowest to the highest noise value. */
  colors?: string[];
  /** Shape of the noise: soft clouds, sharp ridges, or veined marble. */
  pattern?: WarpPattern;
  /** Size of the features. Higher values zoom out and show more detail. */
  scale?: number;
  /** Layers of noise detail, from 1 (smooth) to 8 (fine). */
  octaves?: number;
  /** How strongly the noise folds back on itself, from 0 (plain noise) to 2. */
  warp?: number;
  /** Rotation applied between warp passes, from 0 to 1. Adds curling eddies. */
  swirl?: number;
  /** Separation between the darkest and lightest colors, from 0.5 to 3. */
  contrast?: number;
  /** Animation speed. */
  speed?: number;
  /** Renders a still frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_COLORS = 6;
const DEFAULT_COLORS = ["#14161f", "#2c3552", "#6f7fa8", "#d9c8b4", "#f6efe6"];
const PATTERNS: Record<WarpPattern, number> = { fbm: 0, ridged: 1, marble: 2 };

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uCount;
uniform int uPattern;
uniform int uOctaves;
uniform float uScale;
uniform float uWarp;
uniform float uSwirl;
uniform float uContrast;
uniform float uSpeed;
out vec4 fragColor;
${GLSL_NOISE}

vec3 palette(float x) {
  float scaled = clamp(x, 0.0, 1.0) * float(uCount - 1);
  int index = int(floor(scaled));
  vec3 a = uColors[0];
  vec3 b = uColors[0];
  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (i == index) a = uColors[i];
    if (i == min(index + 1, uCount - 1)) b = uColors[i];
  }
  return mix(toLinear(a), toLinear(b), smoothstep(0.0, 1.0, fract(scaled)));
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  mat2 turn = rot2(0.6);
  for (int i = 0; i < 8; i++) {
    if (i >= uOctaves) break;
    float n = gnoise(p);
    // Ridged noise folds each octave at zero and squares it, leaving
    // sharp bright creases on a dark field (roughly 0 to 1).
    if (uPattern == 1) {
      n = 1.0 - abs(n) * 1.7;
      n = n * n;
    }
    sum += amp * n;
    norm += amp;
    p = turn * p * 2.02 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return sum / max(norm, 1e-4);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float aspect = iResolution.x / iResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * uScale * 1.5;
  float t = iTime * uSpeed;
  // Ridges pack detail into every octave, so they read best larger and
  // folded less.
  float warpAmount = uWarp;
  if (uPattern == 1) {
    p *= 0.6;
    warpAmount *= 0.55;
  }

  // Two passes of domain warping: noise displaces the input of more noise.
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t * 0.07),
    fbm(p + vec2(5.2, 1.3) - t * 0.06)
  );
  q = rot2(uSwirl * 3.1416 * (0.5 + q.x)) * q;
  vec2 r = vec2(
    fbm(p + 2.6 * warpAmount * q + vec2(1.7, 9.2) + t * 0.09),
    fbm(p + 2.6 * warpAmount * q + vec2(8.3, 2.8) - t * 0.05)
  );
  float v = fbm(p + 2.6 * warpAmount * r);

  float value;
  if (uPattern == 2) {
    // Marble: pale stone crossed by thin veins that follow the warped field.
    float bands = sin((p.x * 0.7 + p.y) * 2.6 + v * 7.0 + t * 0.15);
    value = 1.0 - pow(1.0 - abs(bands), 5.0) * 0.9;
    value = mix(value, value * (0.85 + 0.3 * (v + 0.5)), 0.5);
  } else if (uPattern == 1) {
    value = v * 1.5 - 0.35;
  } else {
    value = v * 1.25 + 0.5;
  }
  value = clamp((value - 0.5) * uContrast + 0.5, 0.0, 1.0);

  vec3 color = palette(value);
  // A faint lift where the first warp pass is strong gives the folds depth.
  color *= 0.9 + 0.25 * clamp(length(q) * 1.6, 0.0, 1.0);
  fragColor = vec4(clamp(toGamma(color), 0.0, 1.0), 1.0);
}
`;

const Warp: React.FC<WarpProps> = ({
  colors = DEFAULT_COLORS,
  pattern = "fbm",
  scale = 1,
  octaves = 5,
  warp = 1,
  swirl = 0.3,
  contrast = 1.1,
  speed = 0.4,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const colorsKey = colors.join(",");

  const uniforms = useMemo(() => {
    const { list, count } = prepareColorList(colorsKey ? colorsKey.split(",") : [], MAX_COLORS, DEFAULT_COLORS);
    return {
      uColors: list,
      uCount: Math.max(2, count),
      uPattern: PATTERNS[pattern] ?? 0,
      uOctaves: Math.round(Math.min(8, Math.max(1, octaves))),
      uScale: Math.max(0.05, scale),
      uWarp: warp,
      uSwirl: swirl,
      uContrast: contrast,
      uSpeed: speed,
    };
  }, [colorsKey, pattern, octaves, scale, warp, swirl, contrast, speed]);

  const containerRef = useFullscreenShader({
    fragment,
    uniforms,
    paused: paused || shouldReduceMotion,
    startTime: 20,
  });

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`relative size-full overflow-hidden ${className}`.trim()}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
};

export default Warp;
