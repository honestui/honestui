"use client";

import React, { useMemo } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import { GLSL_NOISE, parseHexColor, prepareColorList, useFullscreenShader } from "./use-fullscreen-shader";

export interface SmokeRingProps {
  /** One to five colors, from the dense core of the smoke to its thin edges. */
  colors?: string[];
  /** Background color. Leave unset for a transparent background. */
  colorBack?: string;
  /** Ring radius as a fraction of the shorter side, from 0.1 to 0.45. */
  radius?: number;
  /** Width of the ring, from 0 (thin) to 1 (thick). */
  thickness?: number;
  /** Size of the smoke detail. Higher values give finer wisps. */
  noiseScale?: number;
  /** How far the smoke drifts away from the ring, from 0 to 1. */
  turbulence?: number;
  /** Soft light filling the inside of the ring, from 0 to 1. */
  innerGlow?: number;
  /** Animation speed. */
  speed?: number;
  /** Renders a still frame instead of animating. */
  paused?: boolean;
  className?: string;
}

const MAX_COLORS = 5;
const DEFAULT_COLORS = ["#ffffff", "#b4bcfa", "#5560cf"];

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uCount;
uniform vec4 uBack;
uniform float uRadius;
uniform float uThickness;
uniform float uNoiseScale;
uniform float uTurbulence;
uniform float uInnerGlow;
uniform float uSpeed;
out vec4 fragColor;
${GLSL_NOISE}

vec3 ramp(float x) {
  // x = 1 is the dense core (first color), x = 0 the thin edge (last color).
  float scaled = clamp(1.0 - x, 0.0, 1.0) * float(uCount - 1);
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
  for (int i = 0; i < 5; i++) {
    sum += amp * gnoise(p);
    p = rot2(0.7) * p * 2.07 + vec2(2.3, 7.1);
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
  float t = iTime * uSpeed;
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);

  // Noise sampled on the circle's direction (not its angle) has no seam.
  float shape = fbm(dir * uNoiseScale * 0.9 + vec2(t * 0.15, -t * 0.11));
  // Wisps live in a slowly turning frame, so they curl instead of streaking
  // out from the center.
  vec2 swirled = rot2(t * 0.07 + r * 1.5) * p;
  float wisps = fbm(swirled * uNoiseScale * 1.7 + vec2(t * 0.12, -t * 0.09));
  float w = clamp(wisps * 1.3 + 0.5, 0.0, 1.0);

  float ringRadius = uRadius * (1.0 + 0.28 * shape * uTurbulence);
  float width = mix(0.02, 0.13, clamp(uThickness, 0.0, 1.0)) * (1.0 + 0.5 * (w - 0.5) * uTurbulence);
  float d = (r - ringRadius) / max(width, 1e-3);

  // Dense along the ring, breaking into wisps on both sides.
  float core = exp(-d * d * 1.1) * (0.45 + 0.75 * w);
  float drift = exp(-abs(d) * 0.7) * smoothstep(0.45, 0.9, w) * uTurbulence * 0.55;
  float density = clamp((core + drift) * 0.9, 0.0, 1.0);

  float glow = uInnerGlow * 0.4 * smoothstep(ringRadius, ringRadius * 0.15, r) * (0.75 + 0.25 * w);

  // Color follows density: thin smoke takes the last color, the densest the first.
  vec3 smoke = ramp(pow(density, 1.8));
  vec3 glowColor = ramp(0.3);
  vec3 lit = smoke * density + glowColor * glow;
  float alpha = clamp(density + glow, 0.0, 1.0);

  vec3 back = toLinear(uBack.rgb);
  vec3 color = lit + back * (1.0 - alpha) * uBack.a;
  float outAlpha = mix(alpha, 1.0, uBack.a);
  // Straight alpha: undo the coverage weighting for the transparent case.
  vec3 straight = outAlpha > 0.0 ? color / outAlpha : vec3(0.0);
  fragColor = vec4(clamp(toGamma(straight), 0.0, 1.0), clamp(outAlpha, 0.0, 1.0));
}
`;

const SmokeRing: React.FC<SmokeRingProps> = ({
  colors = DEFAULT_COLORS,
  colorBack,
  radius = 0.26,
  thickness = 0.45,
  noiseScale = 3,
  turbulence = 0.6,
  innerGlow = 0.35,
  speed = 0.6,
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
      uBack: colorBack ? parseHexColor(colorBack) : [0, 0, 0, 0],
      uRadius: Math.min(0.45, Math.max(0.1, radius)),
      uThickness: thickness,
      uNoiseScale: Math.max(0.1, noiseScale),
      uTurbulence: turbulence,
      uInnerGlow: innerGlow,
      uSpeed: speed,
    };
  }, [colorsKey, colorBack, radius, thickness, noiseScale, turbulence, innerGlow, speed]);

  const containerRef = useFullscreenShader({
    fragment,
    uniforms,
    paused: paused || shouldReduceMotion,
    startTime: 6,
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

export default SmokeRing;
