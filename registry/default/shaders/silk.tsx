"use client";

import React, { useRef } from "react";
import { CORE_UNIFORMS, effectContainerClass, rgb, useCssColors, useEffectCanvas } from "./effect-canvas";
import { GLSL_NOISE } from "./use-fullscreen-shader";

export interface SilkProps {
  /** Main color of the cloth. Any CSS color. */
  color?: string;
  /** Optional second color blended across the cloth on the fold angle. */
  secondaryColor?: string;
  /** Color of the sheen along the fold crests. */
  sheenColor?: string;
  /** Strength of the sheen, from 0 (matte) to 1 (glossy). */
  sheen?: number;
  /** Size of the folds. Larger values draw more, smaller folds. */
  scale?: number;
  /** How deep the folds look, from 0 (flat) to 1 (deep). */
  depth?: number;
  /** How soft the sheen is, from 0 (tight highlight) to 1 (broad glow). */
  softness?: number;
  /** Direction the folds run, in degrees. */
  angle?: number;
  /** Animation speed. */
  speed?: number;
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform vec4 uColor;
uniform vec4 uSecondary;
uniform vec4 uSheenColor;
uniform float uSheen;
uniform float uScale;
uniform float uDepth;
uniform float uSoftness;
uniform float uAngle;
uniform float uSpeed;
out vec4 fragColor;
${GLSL_NOISE}

// Height of the cloth: long folds running along x. A slow, low-frequency
// noise bends their phase so the crests swing and gather instead of repeating.
float cloth(vec2 p, float t) {
  float bend = gnoise(p * vec2(0.28, 0.4) + vec2(t * 0.04, -t * 0.03)) * 4.0;
  bend += gnoise(p * vec2(0.6, 0.7) + vec2(-t * 0.05, t * 0.04) + 7.3) * 1.2;
  float h = sin(p.y * 2.4 + bend + t * 0.2) * 0.5;
  h += sin(p.y * 1.3 - p.x * 0.35 + bend * 0.7 - t * 0.13) * 0.5;
  return h;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * max(uScale, 0.05) * 3.0;
  p = rot2(radians(uAngle)) * p;
  float t = uTime * uSpeed;

  float e = 0.004 * max(uScale, 0.05);
  float h = cloth(p, t);
  float hx = cloth(p + vec2(e, 0.0), t);
  float hy = cloth(p + vec2(0.0, e), t);
  float depth = mix(0.08, 0.7, clamp(uDepth, 0.0, 1.0));
  vec3 n = normalize(vec3(-(hx - h) / e * depth, -(hy - h) / e * depth, 1.0));

  vec3 light = normalize(vec3(-0.35, 0.55, 0.75));
  float diffuse = clamp(dot(n, light), 0.0, 1.0);
  // Satin catches light in a broad band, so the highlight uses a low,
  // softness-controlled exponent plus a faint rim along the crests.
  vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
  float soft = clamp(uSoftness, 0.0, 1.0);
  float spec = pow(clamp(dot(n, halfVector), 0.0, 1.0), mix(90.0, 10.0, soft));
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 1.5);

  vec2 dir = rot2(radians(uAngle)) * vec2(0.0, 1.0);
  float blend = smoothstep(-0.7, 0.7, dot((uv - 0.5) * vec2(aspect, 1.0), dir) + h * 0.15);
  vec3 base = mix(toLinear(uColor.rgb), toLinear(uSecondary.rgb), blend);
  float alpha = mix(uColor.a, uSecondary.a, blend);

  vec3 shade = base * mix(0.35, 1.25, diffuse * diffuse);
  shade += toLinear(uSheenColor.rgb) * (spec * 0.8 + rim * 0.12) * clamp(uSheen, 0.0, 1.0);
  fragColor = vec4(clamp(toGamma(shade), 0.0, 1.0), alpha);
}
`;

export function Silk({
  color = "#2b3350",
  secondaryColor,
  sheenColor = "#ffffff",
  sheen = 0.45,
  scale = 1,
  depth = 0.5,
  softness = 0.6,
  angle = -18,
  speed = 1,
  paused = false,
  className,
  children,
}: SilkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [base, second, sheenRgba] = useCssColors(containerRef, [color, secondaryColor ?? color, sheenColor]);
  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: speed > 0,
    paused,
    uniforms: {
      uColor: [...rgb(base), base[3] ?? 1],
      uSecondary: [...rgb(second), second[3] ?? 1],
      uSheenColor: [...rgb(sheenRgba), sheenRgba[3] ?? 1],
      uSheen: sheen,
      uScale: scale,
      uDepth: depth,
      uSoftness: softness,
      uAngle: angle,
      uSpeed: speed,
    },
  });

  return (
    <div ref={containerRef} className={effectContainerClass(className)}>
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default Silk;
