"use client";

import React, { useRef } from "react";
import { CORE_UNIFORMS, effectContainerClass, rgb, useCssColors, useEffectCanvas } from "./effect-canvas";

export interface PerspectiveGridProps {
  /** Line color. Any CSS color; `currentColor` follows the text color and theme. */
  color?: string;
  /** Line opacity at the front of the floor, from 0 to 1. */
  opacity?: number;
  /** Width of one cell at the bottom edge, in CSS pixels. */
  cellSize?: number;
  /** Line width at the bottom edge, in CSS pixels. Lines thin toward the horizon. */
  lineWidth?: number;
  /** Height of the horizon, from 0 (bottom) to 1 (top). Nothing is drawn above it. */
  horizon?: number;
  /** Camera angle, from 0 (looking down, square cells) to 1 (grazing, flat cells). */
  tilt?: number;
  /** How far the floor fades before the horizon, from 0 (sharp) to 1 (long fade). */
  fade?: number;
  /** Soft band of light along the horizon, from 0 (none) to 1. */
  glow?: number;
  /** Color of the horizon glow. Defaults to `color`. */
  glowColor?: string;
  /** Cells per second the floor moves toward the viewer. 0 keeps it still. */
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
uniform vec4 uGlowColor;
uniform float uOpacity;
uniform float uCellSize;
uniform float uLineWidth;
uniform float uHorizon;
uniform float uTilt;
uniform float uFade;
uniform float uGlow;
uniform float uSpeed;
out vec4 fragColor;

// Coverage of the nearest grid line along one axis, with the line width given
// in device pixels and the cell size in that axis measured by fwidth.
float lineCoverage(float coord, float width, float halfWidthPx) {
  float distPx = abs(fract(coord + 0.5) - 0.5) / max(width, 1e-5);
  return 1.0 - smoothstep(halfWidthPx - 0.6, halfWidthPx + 0.6, distPx);
}

void main() {
  float dpr = uPixelRatio;
  float horizonPx = clamp(uHorizon, 0.02, 1.0) * uResolution.y;
  float below = horizonPx - gl_FragCoord.y;

  float alpha = 0.0;
  float lines = 0.0;

  if (below > 0.5) {
    float cellPx = max(uCellSize * dpr, 2.0);
    // Projective floor: depth grows as 1 / distance below the horizon. At the
    // bottom edge one cell spans cellSize pixels across; tilt stretches depth.
    float depthScale = mix(0.8, 3.2, clamp(uTilt, 0.0, 1.0));
    float ratio = horizonPx / below;
    float x = (gl_FragCoord.x - uResolution.x * 0.5) / cellPx * ratio;
    float z = horizonPx / cellPx * ratio / depthScale + uTime * uSpeed;
    vec2 p = vec2(x, z);
    vec2 w = fwidth(p);

    // Lines are widest at the front and thin toward the horizon.
    float nearness = clamp(below / horizonPx, 0.0, 1.0);
    float halfWidth = max(uLineWidth * dpr * 0.5 * mix(0.45, 1.0, nearness), 0.35);
    float lx = lineCoverage(p.x, w.x, halfWidth);
    float lz = lineCoverage(p.y, w.y, halfWidth);
    // Where cells shrink to a few pixels the lines would alias into moire, so
    // each direction fades out on its own before that happens.
    lx *= smoothstep(3.0, 9.0, 1.0 / max(w.x, 1e-5));
    lz *= smoothstep(3.0, 9.0, 1.0 / max(w.y, 1e-5));
    lines = max(lx, lz);

    float fadeLength = mix(0.04, 0.85, clamp(uFade, 0.0, 1.0));
    float horizonFade = smoothstep(0.0, fadeLength, nearness);
    alpha = lines * uOpacity * uColor.a * horizonFade;
  }

  // A soft band of light that sits on the horizon, strongest just below it.
  float glow = 0.0;
  if (uGlow > 0.0) {
    float spread = uResolution.y * 0.09;
    float d = gl_FragCoord.y - horizonPx;
    float across = (gl_FragCoord.x / uResolution.x - 0.5) * 2.0;
    float sides = 1.0 - 0.55 * across * across;
    glow = exp(-(d * d) / (spread * spread * (d > 0.0 ? 0.3 : 1.0))) * uGlow * uGlowColor.a * sides;
  }

  float total = alpha + glow * (1.0 - alpha);
  vec3 color = total > 0.0 ? (uColor.rgb * alpha + uGlowColor.rgb * glow * (1.0 - alpha)) / total : uColor.rgb;
  fragColor = vec4(color, clamp(total, 0.0, 1.0));
}
`;

export function PerspectiveGrid({
  color = "currentColor",
  opacity = 0.3,
  cellSize = 64,
  lineWidth = 1,
  horizon = 0.55,
  tilt = 0.5,
  fade = 0.6,
  glow = 0,
  glowColor,
  speed = 0.35,
  paused = false,
  className,
  children,
}: PerspectiveGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [line, light] = useCssColors(containerRef, [color, glowColor ?? color]);
  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: speed !== 0,
    paused,
    uniforms: {
      uColor: [...rgb(line), line[3] ?? 1],
      uGlowColor: [...rgb(light), light[3] ?? 1],
      uOpacity: Math.min(Math.max(opacity, 0), 1),
      uCellSize: Math.max(cellSize, 4),
      uLineWidth: Math.max(lineWidth, 0.25),
      uHorizon: Math.min(Math.max(horizon, 0.05), 1),
      uTilt: Math.min(Math.max(tilt, 0), 1),
      uFade: Math.min(Math.max(fade, 0), 1),
      uGlow: Math.min(Math.max(glow, 0), 1),
      uSpeed: speed,
    },
  });

  return (
    <div ref={containerRef} className={effectContainerClass(className)}>
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default PerspectiveGrid;
