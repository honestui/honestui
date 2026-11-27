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

interface PixelateBaseProps {
  /** Size of each block in CSS pixels. 1 leaves the source sharp. */
  pixelSize?: number;
  /** Glitch intensity from 0 to 1: bursts of row displacement, channel split, and block noise. */
  glitch?: number;
  /** Bursts per second at full intensity. */
  glitchRate?: number;
  /** Constant red/blue channel offset in CSS pixels. */
  colorSplit?: number;
  /** Scanline darkness from 0 to 1. */
  scanlines?: number;
  /** Number of color levels per channel; 0 keeps full color. */
  colorLevels?: number;
  /** Sharpen the area around the pointer. */
  reveal?: boolean;
  /** Radius of the sharp area in CSS pixels. */
  revealRadius?: number;
  /** Animate the procedural source. Images stay still apart from glitches. */
  animated?: boolean;
  /** Speed of the procedural source. */
  speed?: number;
  /** Colors of the procedural source used when there is no image. */
  sourceColors?: [string, string, string];
  /** Render one still frame without glitches. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface PixelateImageProps {
  /** Image to pixelate. It must allow cross-origin use. */
  src: string;
  /** Alternative text for the image; an empty string for decorative images. */
  alt: string;
}

interface PixelateProceduralProps {
  src?: undefined;
  alt?: undefined;
}

export type PixelateProps = PixelateBaseProps & (PixelateImageProps | PixelateProceduralProps);

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform float uPixelSize;
uniform float uGlitch;
uniform float uGlitchRate;
uniform float uColorSplit;
uniform float uScanlines;
uniform float uColorLevels;
uniform float uReveal;
uniform float uRevealRadius;
uniform float uSpeed;
out vec4 fragColor;
${NOISE_GLSL}
${SOURCE_GLSL}

vec3 sampleBlock(vec2 frag, float size, float split) {
  vec2 block = (floor(frag / size) + 0.5) * size;
  vec2 uv = block / uResolution;
  vec2 offset = vec2(split / uResolution.x, 0.0);
  float t = uTime * uSpeed;
  float r = sampleSource(uv + offset, t).r;
  float g = sampleSource(uv, t).g;
  float b = sampleSource(uv - offset, t).b;
  return vec3(r, g, b);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float dpr = uPixelRatio;

  // A burst switches on for a short tick at random; its strength scales
  // every glitch layer so intensity 0 is perfectly still.
  float tick = floor(uTime * max(uGlitchRate, 0.1) * 6.0);
  float burst = step(1.0 - 0.22 * uGlitch, hash12(vec2(tick, 4.7))) * uGlitch;
  float jitter = uGlitch * 0.15;

  // Row bands shift sideways during a burst.
  float bands = 6.0 + floor(hash12(vec2(tick, 9.1)) * 22.0);
  float band = floor(frag.y / uResolution.y * bands);
  float bandOn = step(0.55, hash12(vec2(band, tick + 1.3)));
  float shift = (hash12(vec2(band * 3.1, tick)) - 0.5) * bandOn * burst * 0.18 * uResolution.x;
  shift += (hash12(vec2(floor(frag.y / (3.0 * dpr)), floor(uTime * 24.0))) - 0.5) * jitter * 6.0 * dpr;
  vec2 p = frag + vec2(shift, 0.0);

  float size = max(uPixelSize * dpr, 1.0);
  float split = (uColorSplit + burst * 10.0) * dpr;
  vec3 color = sampleBlock(p, size, split);

  // Pointer reveal: a sharp lens that eases in around the cursor.
  if (uReveal > 0.5 && uPointerStrength > 0.001) {
    float radius = uRevealRadius * dpr;
    float d = distance(frag, uPointer);
    float lens = uPointerStrength * (1.0 - smoothstep(radius * 0.55, radius, d));
    if (lens > 0.0) {
      vec3 sharp = sampleBlock(p, 1.0, split * 0.5);
      color = mix(color, sharp, lens);
    }
  }

  if (uColorLevels > 1.5) {
    color = floor(color * (uColorLevels - 1.0) + 0.5) / (uColorLevels - 1.0);
  }

  // Block noise: a few cells invert or drop to a flat channel during a burst.
  vec2 noiseCell = floor(frag / (size * 4.0 + 18.0 * dpr));
  float noise = step(0.985 - 0.05 * burst, hash12(noiseCell + tick * 1.7)) * step(0.001, burst);
  color = mix(color, vec3(1.0) - color.gbr, noise * 0.85);

  float scan = 0.5 + 0.5 * cos(frag.y / dpr * 3.14159 / 1.5);
  color *= 1.0 - uScanlines * 0.4 * scan;

  fragColor = vec4(color, 1.0);
}
`;

export function Pixelate({
  src,
  alt,
  pixelSize = 10,
  glitch = 0,
  glitchRate = 1,
  colorSplit = 0,
  scanlines = 0,
  colorLevels = 0,
  reveal = false,
  revealRadius = 120,
  animated = true,
  speed = 0.6,
  sourceColors = ["#101522", "#ff7a59", "#7aa2ff"],
  paused = false,
  className,
  children,
}: PixelateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sourceA, sourceB, sourceC] = useCssColors(containerRef, sourceColors);
  const { imageReady } = useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    imageSrc: src,
    animated: glitch > 0 || (animated && !src),
    paused,
    pointer: reveal,
    uniforms: {
      uPixelSize: pixelSize,
      uGlitch: Math.min(Math.max(glitch, 0), 1),
      uGlitchRate: glitchRate,
      uColorSplit: colorSplit,
      uScanlines: Math.min(Math.max(scanlines, 0), 1),
      uColorLevels: colorLevels,
      uReveal: reveal ? 1 : 0,
      uRevealRadius: revealRadius,
      // Without animation the procedural field holds still, while glitches
      // still advance with time.
      uSpeed: animated ? speed : 0,
      uSourceA: rgb(sourceA),
      uSourceB: rgb(sourceB),
      uSourceC: rgb(sourceC),
    },
  });

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className, "bg-neutral-950")}
    >
      {src ? (
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

export default Pixelate;
