"use client";

import React, { useRef } from "react";
import {
  CORE_UNIFORMS,
  NOISE_GLSL,
  SOURCE_GLSL,
  rgb,
  useCssColors,
  effectContainerClass,
  useEffectCanvas,
} from "./effect-canvas";

export type HalftoneMode = "mono" | "color" | "cmyk";
export type HalftoneShape = "circle" | "square" | "line";

interface HalftoneBaseProps {
  /** `mono` prints one ink, `color` prints each dot in the source color, `cmyk` separates four screens. */
  mode?: HalftoneMode;
  /** Dot pitch in CSS pixels. */
  cellSize?: number;
  /** Screen angle in degrees. In CMYK mode the four screens are offset from it. */
  angle?: number;
  /** Shape of each dot. `line` prints an engraving-style line screen. */
  shape?: HalftoneShape;
  /** Ink color for mono mode. Any CSS color. */
  inkColor?: string;
  /** Paper color behind the dots. Any CSS color. */
  paperColor?: string;
  /** Scales every dot; 1 lets the darkest areas print solid. */
  dotScale?: number;
  /** Tone contrast applied to the source before screening. */
  contrast?: number;
  /** Brightness offset applied to the source, from -1 to 1. */
  brightness?: number;
  /** Small random variation in dot size, like ink on uncoated paper. */
  roughness?: number;
  /** Animate the procedural source. Images stay still. */
  animated?: boolean;
  /** Speed of the procedural source. */
  speed?: number;
  /** Colors of the procedural source used when there is no image. */
  sourceColors?: [string, string, string];
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface HalftoneImageProps {
  /** Image to screen. It must allow cross-origin use. */
  src: string;
  /** Alternative text for the image; an empty string for decorative images. */
  alt: string;
}

interface HalftoneProceduralProps {
  src?: undefined;
  alt?: undefined;
}

export type HalftoneProps = HalftoneBaseProps & (HalftoneImageProps | HalftoneProceduralProps);

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform float uCellSize;
uniform float uAngle;
uniform float uMode;
uniform float uShape;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uDotScale;
uniform float uContrast;
uniform float uBrightness;
uniform float uRoughness;
uniform float uSpeed;
out vec4 fragColor;
${NOISE_GLSL}
${SOURCE_GLSL}

mat2 rotation(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec3 tone(vec3 color) {
  color = (color - 0.5) * uContrast + 0.5 + uBrightness;
  return clamp(color, 0.0, 1.0);
}

// Coverage of one screen at this pixel: the source is sampled once at the
// center of the rotated cell, and the dot grows with ink amount.
float screen(vec2 frag, float angle, int channel, out vec3 cellColor) {
  float cell = max(uCellSize * uPixelRatio, 2.0);
  mat2 toScreen = rotation(angle);
  vec2 p = toScreen * frag / cell;
  vec2 id = floor(p) + 0.5;
  vec2 local = p - id;
  vec2 center = transpose(toScreen) * (id * cell);
  vec3 color = tone(sampleSource(center / uResolution, uTime * uSpeed).rgb);
  cellColor = color;

  float ink;
  if (channel == 0) {
    ink = 1.0 - luminance(color);
  } else {
    float k = 1.0 - max(max(color.r, color.g), color.b);
    float denominator = max(1.0 - k, 1e-4);
    if (channel == 1) ink = (1.0 - color.r - k) / denominator;
    else if (channel == 2) ink = (1.0 - color.g - k) / denominator;
    else if (channel == 3) ink = (1.0 - color.b - k) / denominator;
    else ink = k;
  }
  ink = clamp(ink * uDotScale, 0.0, 1.0);
  ink *= 1.0 + (hash12(id + float(channel) * 17.0) - 0.5) * uRoughness;

  // Distance to the dot edge in cell units, antialiased over one pixel.
  float aa = 1.0 / cell;
  if (uShape < 0.5) {
    float radius = sqrt(ink) * 0.7071;
    return 1.0 - smoothstep(radius - aa, radius + aa, length(local));
  }
  if (uShape < 1.5) {
    float half_ = sqrt(ink) * 0.5;
    vec2 d = abs(local);
    return 1.0 - smoothstep(half_ - aa, half_ + aa, max(d.x, d.y));
  }
  float thickness = ink * 0.5;
  return 1.0 - smoothstep(thickness - aa, thickness + aa, abs(local.y));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float angle = radians(uAngle);
  vec3 cellColor;

  if (uMode < 0.5) {
    float coverage = screen(frag, angle, 0, cellColor);
    fragColor = vec4(mix(uPaper, uInk, coverage), 1.0);
    return;
  }
  if (uMode < 1.5) {
    float coverage = screen(frag, angle, 0, cellColor);
    // Lift the dot color slightly so dark-but-colored areas keep their hue.
    vec3 dot_ = clamp(cellColor * 1.08, 0.0, 1.0);
    fragColor = vec4(mix(uPaper, dot_, coverage), 1.0);
    return;
  }

  // CMYK: four screens at the classic offsets, each ink multiplying the
  // paper like transparent printing ink.
  vec3 ignored;
  float c = screen(frag, angle + radians(15.0), 1, ignored);
  float m = screen(frag, angle + radians(75.0), 2, ignored);
  float y = screen(frag, angle, 3, ignored);
  float k = screen(frag, angle + radians(45.0), 4, ignored);
  vec3 color = uPaper;
  color *= mix(vec3(1.0), vec3(0.0, 0.68, 0.94), c);
  color *= mix(vec3(1.0), vec3(0.93, 0.0, 0.55), m);
  color *= mix(vec3(1.0), vec3(1.0, 0.92, 0.0), y);
  color *= mix(vec3(1.0), vec3(0.12, 0.12, 0.13), k);
  fragColor = vec4(color, 1.0);
}
`;

const MODES: Record<HalftoneMode, number> = { mono: 0, color: 1, cmyk: 2 };
const SHAPES: Record<HalftoneShape, number> = { circle: 0, square: 1, line: 2 };

export function Halftone({
  src,
  alt,
  mode = "mono",
  cellSize = 8,
  angle = 45,
  shape = "circle",
  inkColor = "#16181d",
  paperColor = "#f4f1ea",
  dotScale = 1,
  contrast = 1.1,
  brightness = 0,
  roughness = 0.15,
  animated = true,
  speed = 0.6,
  sourceColors = ["#1e2a44", "#f2b880", "#e8ecf4"],
  paused = false,
  className,
  children,
}: HalftoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ink, paper, sourceA, sourceB, sourceC] = useCssColors(containerRef, [
    inkColor,
    paperColor,
    ...sourceColors,
  ]);
  const { imageReady } = useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    imageSrc: src,
    animated: animated && !src,
    paused,
    uniforms: {
      uCellSize: cellSize,
      uAngle: angle,
      uMode: MODES[mode],
      uShape: SHAPES[shape],
      uInk: rgb(ink),
      uPaper: rgb(paper),
      uDotScale: dotScale,
      uContrast: contrast,
      uBrightness: brightness,
      uRoughness: roughness,
      uSpeed: speed,
      uSourceA: rgb(sourceA),
      uSourceB: rgb(sourceB),
      uSourceC: rgb(sourceC),
    },
  });

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className)}
      style={{ backgroundColor: paperColor }}
    >
      {src ? (
        // The image is the accessible content and the fallback until the
        // canvas has the pixels; it stays in the accessibility tree after.
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${imageReady ? "opacity-0" : "opacity-100"}`}
        />
      ) : null}
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default Halftone;
