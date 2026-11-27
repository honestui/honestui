"use client";

import React, { useMemo } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import { GLSL_NOISE, prepareColorList, useFullscreenShader } from "./use-fullscreen-shader";

export interface MeshGradientProps {
  /** Two to six colors. Each one is a soft point of color that drifts across the surface. */
  colors?: string[];
  /** Animation speed. 0 holds the current frame. */
  speed?: number;
  /** Noise displacement of the color field, from 0 (smooth blends) to 1 (wavy, organic edges). */
  distortion?: number;
  /** Rotational twist around the center, from 0 to 1. */
  swirl?: number;
  /** How far apart the color points stay: lower values blend more, higher values keep distinct areas. */
  sharpness?: number;
  /** Film grain over the result, from 0 (none) to 1. */
  grain?: number;
  /** Renders a still frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_COLORS = 6;
const DEFAULT_COLORS = ["#f3ebe2", "#e5b9a4", "#9aa9cf", "#3e4a70"];

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uCount;
uniform float uSpeed;
uniform float uDistortion;
uniform float uSwirl;
uniform float uSharpness;
uniform float uGrain;
out vec4 fragColor;
${GLSL_NOISE}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float aspect = iResolution.x / iResolution.y;
  vec2 p = uv - 0.5;
  p.x *= aspect;
  float t = iTime * uSpeed;

  // Twist strongest near the center, easing out toward the edges.
  float radius = length(p);
  float twist = uSwirl * 3.2 * exp(-radius * 2.2) * (0.75 + 0.25 * sin(t * 0.35));
  p = rot2(twist) * p;

  // Two independent noise fields displace the lookup point.
  vec2 warp = vec2(
    gnoise(p * 1.8 + vec2(t * 0.21, 0.0)),
    gnoise(p * 1.8 + vec2(4.7, 1.9) - vec2(0.0, t * 0.18))
  );
  p += warp * uDistortion * 0.42;

  vec3 sum = vec3(0.0);
  float weightSum = 0.0;
  float power = mix(1.1, 3.2, clamp(uSharpness, 0.0, 1.0));
  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (i >= uCount) break;
    float fi = float(i);
    // Each point follows its own slow Lissajous path inside the frame.
    vec2 center = vec2(
      0.42 * aspect * sin(t * (0.31 + 0.053 * fi) + fi * 2.39),
      0.38 * cos(t * (0.27 + 0.041 * fi) + fi * 1.71)
    );
    float d = length(p - center);
    float w = 1.0 / pow(d * d + 0.015, power);
    sum += toLinear(uColors[i]) * w;
    weightSum += w;
  }
  vec3 color = toGamma(sum / max(weightSum, 1e-5));

  float noise = hash12(gl_FragCoord.xy + fract(iTime) * 113.0) - 0.5;
  color += noise * uGrain * 0.18;

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const MeshGradient: React.FC<MeshGradientProps> = ({
  colors = DEFAULT_COLORS,
  speed = 0.5,
  distortion = 0.6,
  swirl = 0.25,
  sharpness = 0.5,
  grain = 0,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const colorsKey = colors.join(",");

  const uniforms = useMemo(() => {
    const { list, count } = prepareColorList(colorsKey ? colorsKey.split(",") : [], MAX_COLORS, DEFAULT_COLORS);
    return {
      uColors: list,
      uCount: Math.max(1, count),
      uSpeed: speed,
      uDistortion: distortion,
      uSwirl: swirl,
      uSharpness: sharpness,
      uGrain: grain,
    };
  }, [colorsKey, speed, distortion, swirl, sharpness, grain]);

  const containerRef = useFullscreenShader({
    fragment,
    uniforms,
    paused: paused || shouldReduceMotion,
    startTime: 12,
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

export default MeshGradient;
