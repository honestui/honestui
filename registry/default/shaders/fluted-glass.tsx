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

interface FlutedGlassBaseProps {
  /** Width of one flute (rib) in CSS pixels. */
  fluteSize?: number;
  /** Direction of the flutes in degrees. 0 is vertical. */
  angle?: number;
  /** How strongly each flute bends what is behind it, from 0 to 1. */
  distortion?: number;
  /** Frosted blur along the flutes, from 0 to 1. */
  frost?: number;
  /** Shadow in the grooves between flutes, from 0 to 1. */
  shading?: number;
  /** Specular highlight along each flute, from 0 to 1. */
  highlight?: number;
  /** Prism fringes at the flute edges, from 0 to 1. */
  dispersion?: number;
  /** Slide the glass slowly over the source. */
  animated?: boolean;
  /** Speed of the drift and of the procedural source. */
  speed?: number;
  /** Colors of the procedural source used when there is no image. */
  sourceColors?: [string, string, string];
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface FlutedGlassImageProps {
  /** Image behind the glass. It must allow cross-origin use. */
  src: string;
  /** Alternative text for the image; an empty string for decorative images. */
  alt: string;
}

interface FlutedGlassProceduralProps {
  src?: undefined;
  alt?: undefined;
}

export type FlutedGlassProps = FlutedGlassBaseProps &
  (FlutedGlassImageProps | FlutedGlassProceduralProps);

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform float uFluteSize;
uniform float uAngle;
uniform float uDistortion;
uniform float uFrost;
uniform float uShading;
uniform float uHighlight;
uniform float uDispersion;
uniform float uSpeed;
out vec4 fragColor;
${NOISE_GLSL}
${SOURCE_GLSL}

mat2 rotation(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// Where a ray through this point of the flute lands on the source. Each
// flute acts as a cylindrical lens: it compresses a wider strip of the scene
// and, past the midpoint of distortion, mirrors it.
vec2 refracted(vec2 p, float id, float f, float size, float bend, mat2 back, vec2 center, float drift) {
  float x = (id + 0.5 + f * (1.0 - 2.2 * bend) - drift) * size;
  return (back * vec2(x, p.y) + center) / uResolution;
}

vec3 sampleAt(vec2 uv) {
  return sampleSource(uv, uTime * uSpeed).rgb;
}

void main() {
  vec2 center = uResolution * 0.5;
  mat2 toGlass = rotation(radians(uAngle));
  mat2 back = transpose(toGlass);
  vec2 p = toGlass * (gl_FragCoord.xy - center);
  float size = max(uFluteSize * uPixelRatio, 4.0);

  // The glass drifts sideways over a still scene; time only advances while
  // animation is on and allowed.
  float drift = uTime * uSpeed * 0.06;
  float x = p.x / size + drift;
  float id = floor(x);
  float f = fract(x) - 0.5;

  // Frost blurs along the flute length and slightly across it.
  vec3 color = vec3(0.0);
  float total = 0.0;
  float reach = uFrost * size * 1.6;
  // Each pixel jitters its taps, trading the banding of a few even steps for
  // a fine grain that reads as frosted glass.
  float jitter = hash12(gl_FragCoord.xy) - 0.5;
  for (int i = -4; i <= 4; i++) {
    float k = (float(i) + jitter) / 4.0;
    float weight = exp(-k * k * 2.0);
    vec2 q = p + vec2(0.0, k * reach);
    float fq = clamp(f + k * uFrost * 0.06, -0.5, 0.5);
    vec2 uvG = refracted(q, id, fq, size, uDistortion, back, center, drift);
    vec3 s;
    if (uDispersion > 0.0) {
      float spread = uDispersion * 0.12;
      s.r = sampleAt(refracted(q, id, fq, size, uDistortion * (1.0 + spread), back, center, drift)).r;
      s.g = sampleAt(uvG).g;
      s.b = sampleAt(refracted(q, id, fq, size, uDistortion * (1.0 - spread), back, center, drift)).b;
    } else {
      s = sampleAt(uvG);
    }
    color += s * weight;
    total += weight;
  }
  color /= total;

  // Rib profile: grooves darken, a soft highlight runs down one side, and a
  // thin bright line catches the far edge.
  float profile = f * 2.0;
  float groove = smoothstep(0.55, 1.0, abs(profile));
  color *= 1.0 - uShading * 0.42 * groove;
  color *= 1.0 - uShading * 0.12 * profile;
  float sheen = exp(-pow((f + 0.24) / 0.09, 2.0));
  float rim = exp(-pow((f - 0.46) / 0.025, 2.0));
  color += uHighlight * (sheen * 0.22 + rim * 0.1);
  color = mix(color, vec3(luminance(color)), uFrost * 0.08);

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export function FlutedGlass({
  src,
  alt,
  fluteSize = 36,
  angle = 0,
  distortion = 0.55,
  frost = 0.25,
  shading = 0.5,
  highlight = 0.6,
  dispersion = 0.3,
  animated = true,
  speed = 0.6,
  sourceColors = ["#0e1226", "#ff7448", "#8d7bff"],
  paused = false,
  className,
  children,
}: FlutedGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sourceA, sourceB, sourceC] = useCssColors(containerRef, sourceColors);
  const { imageReady } = useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    imageSrc: src,
    animated,
    paused,
    uniforms: {
      uFluteSize: fluteSize,
      uAngle: angle,
      uDistortion: Math.min(Math.max(distortion, 0), 1),
      uFrost: Math.min(Math.max(frost, 0), 1),
      uShading: Math.min(Math.max(shading, 0), 1),
      uHighlight: Math.min(Math.max(highlight, 0), 1),
      uDispersion: Math.min(Math.max(dispersion, 0), 1),
      uSpeed: speed,
      uSourceA: rgb(sourceA),
      uSourceB: rgb(sourceB),
      uSourceC: rgb(sourceC),
    },
  });

  return (
    <div
      ref={containerRef}
      className={effectContainerClass(className, "bg-neutral-900")}
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

export default FlutedGlass;
