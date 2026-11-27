"use client";

import React, { useMemo } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import { GLSL_NOISE, prepareColorList, useFullscreenShader } from "./use-fullscreen-shader";

export interface AuroraProps {
  /** Two to five colors spread left to right across the curtains. */
  colorStops?: string[];
  /** How far the curtains sway up and down, from 0 (flat) to 2. */
  amplitude?: number;
  /** Softness of the bright lower edge, from 0 (crisp) to 1 (diffuse). */
  blend?: number;
  /** Peak opacity of the light, from 0 to 1. The background stays transparent. */
  intensity?: number;
  /** Vertical position of the curtains' lower edge, from 0 (bottom) to 1 (top). */
  height?: number;
  /** Animation speed. */
  speed?: number;
  /** Renders a still frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_COLORS = 5;
const DEFAULT_COLORS = ["#7ee0c3", "#6aa8f0", "#a58cf0"];

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uCount;
uniform float uAmplitude;
uniform float uBlend;
uniform float uIntensity;
uniform float uHeight;
uniform float uSpeed;
out vec4 fragColor;
${GLSL_NOISE}

vec3 gradient(float x) {
  float scaled = clamp(x, 0.0, 1.0) * float(uCount - 1);
  int index = int(floor(scaled));
  vec3 a = uColors[0];
  vec3 b = uColors[0];
  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (i == index) a = uColors[i];
    if (i == min(index + 1, uCount - 1)) b = uColors[i];
  }
  return mix(a, b, smoothstep(0.0, 1.0, fract(scaled)));
}

float fbm1(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * gnoise(p);
    p = p * 2.03 + vec2(3.1, 1.7);
    amp *= 0.5;
  }
  return sum;
}

// One curtain: a bright lower edge that fades slowly upward, with soft
// vertical rays drifting along it.
float curtain(vec2 uv, float aspect, float seed, float t) {
  float x = uv.x * aspect;
  float sway = fbm1(vec2(x * 0.8 + seed * 7.3 + t * 0.05, seed * 3.1 + t * 0.035));
  float edge = uHeight + 0.06 * sin(x * 1.1 + seed * 4.0 + t * 0.18) + sway * 0.3 * uAmplitude;
  float dy = uv.y - edge;

  float softness = mix(0.008, 0.05, clamp(uBlend, 0.0, 1.0));
  // The lower edge is the brightest part of a real curtain.
  float line = exp(-(dy * dy) / (softness * softness));
  float tail = smoothstep(-softness, softness, dy) * exp(-max(dy, 0.0) / mix(0.16, 0.36, uBlend));
  // A faint glow also spills just below the edge.
  float spill = exp(-max(-dy, 0.0) / mix(0.03, 0.08, uBlend)) * (1.0 - step(0.0, dy));
  float body = line + tail * 0.75 + spill * 0.22;

  float rays = 0.62 + 0.38 * gnoise(vec2(x * 4.5 + sway * 3.0 + seed * 11.0, t * 0.22 + seed));
  rays *= 0.86 + 0.14 * gnoise(vec2(x * 15.0 - t * 0.4, seed * 5.0 + t * 0.1));
  return body * rays;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float aspect = iResolution.x / iResolution.y;
  float t = iTime * uSpeed;

  vec3 light = vec3(0.0);
  float glow = 0.0;
  for (int layer = 0; layer < 3; layer++) {
    float fl = float(layer);
    float c = curtain(uv + vec2(0.0, fl * 0.045), aspect, fl * 1.37 + 0.4, t * (1.0 - fl * 0.18));
    float hueShift = gnoise(vec2(uv.x * 1.6 + fl * 2.3, t * 0.05)) * 0.18;
    vec3 tint = toLinear(gradient(uv.x + hueShift));
    float weight = 1.0 - fl * 0.28;
    light += tint * c * weight;
    glow += c * weight;
  }

  // Tone-map the summed light, then fade the top edge so the curtains
  // dissolve into whatever sits behind the canvas.
  float alpha = (1.0 - exp(-glow * 2.2)) * clamp(uIntensity, 0.0, 1.0);
  alpha *= smoothstep(1.02, 0.72, uv.y);
  vec3 color = toGamma(light / max(glow, 1e-4));
  fragColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`;

const Aurora: React.FC<AuroraProps> = ({
  colorStops = DEFAULT_COLORS,
  amplitude = 1,
  blend = 0.5,
  intensity = 0.85,
  height = 0.55,
  speed = 1,
  paused = false,
  className = "",
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const colorsKey = colorStops.join(",");

  const uniforms = useMemo(() => {
    const { list, count } = prepareColorList(colorsKey ? colorsKey.split(",") : [], MAX_COLORS, DEFAULT_COLORS);
    return {
      uColors: list,
      uCount: Math.max(2, count),
      uAmplitude: amplitude,
      uBlend: blend,
      uIntensity: intensity,
      uHeight: height,
      uSpeed: speed,
    };
  }, [colorsKey, amplitude, blend, intensity, height, speed]);

  const containerRef = useFullscreenShader({
    fragment,
    uniforms,
    paused: paused || shouldReduceMotion,
    startTime: 8,
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

export default Aurora;
