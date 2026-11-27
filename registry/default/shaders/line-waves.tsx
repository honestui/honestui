"use client";

import React, { useRef } from "react";
import { CORE_UNIFORMS, effectContainerClass, rgb, useCssColors, useEffectCanvas } from "./effect-canvas";
import { GLSL_NOISE } from "./use-fullscreen-shader";

export interface LineWavesProps {
  /** Number of lines, from 4 to 120. */
  lineCount?: number;
  /** Line width in CSS pixels. */
  lineWidth?: number;
  /** Height of the tallest peaks as a share of the line spacing, from 0 to 8. */
  amplitude?: number;
  /** How many peaks fit across the width. */
  frequency?: number;
  /** Line color. Any CSS color; `currentColor` follows the text color and theme. */
  color?: string;
  /** Line opacity, from 0 to 1. */
  opacity?: number;
  /** Hide the parts of each line that sit behind the line in front, like a ridgeline. */
  occlude?: boolean;
  /** Raise the lines near the pointer. */
  interactive?: boolean;
  /** Fade the lines out toward the edges so they sit softly behind content. */
  fade?: "none" | "radial" | "edges" | "top" | "bottom";
  /** Animation speed. */
  speed?: number;
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MAX_LINES = 120;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform vec4 uColor;
uniform float uOpacity;
uniform float uLineCount;
uniform float uLineWidth;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uOcclude;
uniform float uFade;
uniform float uSpeed;
out vec4 fragColor;
${GLSL_NOISE}

float fadeMask(vec2 uv) {
  if (uFade < 0.5) return 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  if (uFade < 1.5) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / max(aspect, 1.0);
    return 1.0 - smoothstep(0.12, 0.52, length(p));
  }
  if (uFade < 2.5) {
    vec2 edge = min(uv, 1.0 - uv);
    return smoothstep(0.0, 0.14, edge.x) * smoothstep(0.0, 0.14, edge.y);
  }
  if (uFade < 3.5) return smoothstep(1.0, 0.25, uv.y);
  return smoothstep(0.0, 0.75, uv.y);
}

// Height of line i at horizontal position x (0..1), in units of line spacing.
// Peaks gather toward the middle and stay flat near the sides.
float lineHeight(float i, float x, float t, vec2 pointer, float pointerStrength) {
  float envelope = smoothstep(0.08, 0.45, x) * smoothstep(0.92, 0.55, x);
  envelope = 0.06 + 0.94 * envelope;
  float f = max(uFrequency, 0.2);
  float n = gnoise(vec2(x * f * 2.4 + t * 0.12, i * 0.17 + t * 0.05)) * 1.3;
  n += gnoise(vec2(x * f * 7.0 - t * 0.2, i * 0.37 + 9.0)) * 0.35;
  float peaks = max(n + 0.05, 0.0);
  float h = pow(peaks, 1.3) * 11.0 * envelope * uAmplitude;
  // A soft swell under the pointer.
  vec2 d = vec2((x - pointer.x) * 2.4, (i - pointer.y) * 0.16);
  h += exp(-dot(d, d) * 6.0) * pointerStrength * 2.4;
  return h;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * uSpeed;
  float count = clamp(uLineCount, 4.0, ${MAX_LINES}.0);

  // Lines span the middle of the canvas with room above for the peaks.
  float top = uResolution.y * 0.78;
  float bottom = uResolution.y * 0.1;
  float spacing = (top - bottom) / max(count - 1.0, 1.0);
  float halfWidth = uLineWidth * uPixelRatio * 0.5;
  float x = uv.x;
  float dx = 1.0 / uResolution.x;

  // Pointer in line space: x as 0..1, y as a fractional line index.
  vec2 pointer = vec2(uPointer.x / uResolution.x, (top - uPointer.y) / max(spacing, 1.0));
  float strength = uPointerStrength;

  float coverage = 0.0;
  float horizon = -1e6;
  // Walk from the front line (lowest on screen) to the back, so each line
  // knows the highest edge drawn in front of it.
  for (int k = ${MAX_LINES} - 1; k >= 0; k--) {
    float i = float(k);
    if (i >= count) continue;
    float base = top - i * spacing;
    float h = lineHeight(i, x, t, pointer, strength) * spacing;
    float y = base + h;
    if (abs(gl_FragCoord.y - y) < spacing * 10.0 + halfWidth + 2.0) {
      float slope = (lineHeight(i, x + dx, t, pointer, strength) * spacing - h);
      float dist = abs(gl_FragCoord.y - y) / sqrt(1.0 + slope * slope);
      float line = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, dist);
      // Behind a nearer line: hidden when occluding.
      float hidden = uOcclude > 0.5 ? smoothstep(-0.5, 0.5, horizon - gl_FragCoord.y) : 0.0;
      coverage = max(coverage, line * (1.0 - hidden));
    }
    horizon = max(horizon, y + halfWidth);
  }

  float alpha = coverage * clamp(uOpacity, 0.0, 1.0) * uColor.a * fadeMask(uv);
  fragColor = vec4(uColor.rgb, clamp(alpha, 0.0, 1.0));
}
`;

const FADES = { none: 0, radial: 1, edges: 2, top: 3, bottom: 4 } as const;

export function LineWaves({
  lineCount = 48,
  lineWidth = 1,
  amplitude = 1,
  frequency = 1,
  color = "currentColor",
  opacity = 0.7,
  occlude = true,
  interactive = true,
  fade = "edges",
  speed = 1,
  paused = false,
  className,
  children,
}: LineWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [line] = useCssColors(containerRef, [color]);
  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: speed > 0,
    paused,
    pointer: interactive,
    uniforms: {
      uColor: [...rgb(line), line[3] ?? 1],
      uOpacity: opacity,
      uLineCount: Math.min(Math.max(Math.round(lineCount), 4), MAX_LINES),
      uLineWidth: Math.max(lineWidth, 0.25),
      uAmplitude: Math.min(Math.max(amplitude, 0), 8),
      uFrequency: frequency,
      uOcclude: occlude ? 1 : 0,
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

export default LineWaves;
