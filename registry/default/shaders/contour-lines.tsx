"use client";

import React, { useRef } from "react";
import { CORE_UNIFORMS, effectContainerClass, rgb, useCssColors, useEffectCanvas } from "./effect-canvas";
import { GLSL_NOISE } from "./use-fullscreen-shader";

export interface ContourLinesProps {
  /** Line color. Any CSS color; `currentColor` follows the text color and theme. */
  color?: string;
  /** Line opacity, from 0 to 1. */
  opacity?: number;
  /** Line width in CSS pixels. */
  lineWidth?: number;
  /** Number of contour levels across the field. */
  levels?: number;
  /** Draw every Nth line thicker and brighter, like an index contour. 0 turns it off. */
  majorEvery?: number;
  /** Size of the terrain. Larger values draw more, smaller hills. */
  scale?: number;
  /** Fade the lines out toward the edges so they sit softly behind content. */
  fade?: "none" | "radial" | "edges" | "top" | "bottom";
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
uniform float uOpacity;
uniform float uLineWidth;
uniform float uLevels;
uniform float uMajorEvery;
uniform float uScale;
uniform float uFade;
uniform float uSpeed;
out vec4 fragColor;
${GLSL_NOISE}

// Terrain height. Each octave drifts in its own direction, so the hills
// reshape slowly instead of sliding across the surface as one sheet.
float terrain(vec2 p, float t) {
  vec2 warp = vec2(gnoise(p * 0.7 + vec2(t * 0.05, 0.0)), gnoise(p * 0.7 + vec2(4.1, -t * 0.04)));
  p += warp * 0.8;
  float sum = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    sum += amp * gnoise(p + vec2(cos(fi * 2.1), sin(fi * 1.7)) * t * 0.06);
    p = rot2(0.7) * p * 1.9 + vec2(3.3, 1.9);
    amp *= 0.48;
  }
  return sum;
}

float fadeMask(vec2 uv) {
  if (uFade < 0.5) return 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  if (uFade < 1.5) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / max(aspect, 1.0);
    return 1.0 - smoothstep(0.12, 0.52, length(p));
  }
  if (uFade < 2.5) {
    vec2 edge = min(uv, 1.0 - uv);
    return smoothstep(0.0, 0.2, edge.x) * smoothstep(0.0, 0.2, edge.y);
  }
  if (uFade < 3.5) return smoothstep(1.0, 0.25, uv.y);
  return smoothstep(0.0, 0.75, uv.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  // Scale by the shorter side so hills keep their shape at any aspect ratio.
  vec2 p = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y);
  p *= max(uScale, 0.05) * 1.7;
  float t = uTime * uSpeed;

  float v = terrain(p, t) * max(uLevels, 1.0);
  float width = fwidth(v);
  float distToLine = abs(fract(v - 0.5) - 0.5);

  float index = floor(v + 0.5);
  float major = uMajorEvery >= 1.0 && abs(mod(index, max(uMajorEvery, 1.0))) < 0.5 ? 1.0 : 0.0;
  float lineWidth = uLineWidth * uPixelRatio * mix(1.0, 1.9, major);
  // Distance to the nearest level in device pixels, antialiased over one pixel.
  float px = distToLine / max(width, 1e-5);
  float line = 1.0 - smoothstep(lineWidth * 0.5 - 0.5, lineWidth * 0.5 + 0.5, px);

  float alpha = line * clamp(uOpacity, 0.0, 1.0) * mix(0.75, 1.0, major) * uColor.a * fadeMask(uv);
  fragColor = vec4(uColor.rgb, clamp(alpha, 0.0, 1.0));
}
`;

const FADES = { none: 0, radial: 1, edges: 2, top: 3, bottom: 4 } as const;

export function ContourLines({
  color = "currentColor",
  opacity = 0.35,
  lineWidth = 1,
  levels = 14,
  majorEvery = 5,
  scale = 1,
  fade = "none",
  speed = 1,
  paused = false,
  className,
  children,
}: ContourLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [line] = useCssColors(containerRef, [color]);
  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: speed > 0,
    paused,
    uniforms: {
      uColor: [...rgb(line), line[3] ?? 1],
      uOpacity: opacity,
      uLineWidth: Math.max(lineWidth, 0.25),
      uLevels: Math.max(levels, 1),
      uMajorEvery: Math.max(0, Math.round(majorEvery)),
      uScale: scale,
      uFade: FADES[fade],
      uSpeed: speed,
    },
  });

  return (
    <div ref={containerRef} className={effectContainerClass(className)}>
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default ContourLines;
