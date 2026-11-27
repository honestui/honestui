"use client";

import React, { useRef } from "react";
import { CORE_UNIFORMS, NOISE_GLSL, effectContainerClass, useEffectCanvas } from "./effect-canvas";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export interface IridescentFoilProps {
  /** Opacity of the sheen at its brightest, from 0 to 1. */
  intensity?: number;
  /** Size of the color bands. Higher values make more, finer bands. */
  scale?: number;
  /** Rotates every color of the film around the hue wheel, from 0 to 1. */
  hue?: number;
  /** Amount of fine glints that catch the light, from 0 to 1. */
  sparkle?: number;
  /** Speed of the slow drift while nobody is pointing at the surface. 0 holds it still. */
  speed?: number;
  /** Let the pointer move the sheen, as if the surface were tilted toward the light. */
  interactive?: boolean;
  /** Maximum 3D tilt of the whole surface toward the pointer, in degrees. 0 keeps it flat. */
  tilt?: number;
  /** Draw the sheen under the children (a foil background) or over them (a laminate). */
  layer?: "under" | "over";
  /** Render one still frame. */
  paused?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
#define TAU 6.28318530718
uniform float uIntensity;
uniform float uScale;
uniform float uHue;
uniform float uSparkle;
uniform float uSpeed;
out vec4 fragColor;
${NOISE_GLSL}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * uSpeed;

  // Where the light seems to come from: a slow drift at rest, the pointer on hover.
  vec2 idle = vec2(sin(t * 0.37), cos(t * 0.29)) * 0.45;
  vec2 pointer = (uPointer / max(uResolution, vec2(1.0)) - 0.5) * 2.0;
  vec2 tilt = mix(idle, clamp(pointer, -1.2, 1.2), uPointerStrength);

  // Film thickness: broad diagonal bands bent gently by noise. Moving the
  // light shifts the bands and the viewing angle, so the colors slide.
  float n = fbm(p * 1.2 * uScale + tilt * 0.25 + 7.0);
  float diagonal = (p.x * 0.85 + p.y * 1.25) * 3.2 * uScale;
  float bands = sin(diagonal + dot(tilt, vec2(2.2, -1.6)) + n * 2.2);
  float off = length(p * 0.7 - tilt * 0.3);
  float cosTheta = sqrt(clamp(1.0 - 0.5 * off * off, 0.2, 1.0));
  float thickness = (0.35 * bands + 0.9 * n + diagonal * 0.12) * cosTheta;

  // First-order interference colors are soft: cyan, lilac, rose, and pale gold,
  // drawn from a phase-shifted cosine so no channel ever goes fully dark.
  vec3 film = 0.7 + 0.3 * cos(TAU * (thickness + uHue + vec3(0.0, 0.33, 0.67)));
  film = mix(vec3(dot(film, vec3(0.3333))), film, 1.25);

  // The color lives mostly in a soft glint that follows the light; the rest
  // of the surface keeps only a faint tint.
  vec2 glintDir = normalize(vec2(1.0, 0.62));
  float s = dot(p - tilt * vec2(aspect, 1.0) * 0.4, glintDir);
  float glint = exp(-s * s * 3.2);
  float alpha = uIntensity * (0.16 + 0.84 * glint * glint) * (0.85 + 0.15 * bands);

  // Fine glints: a few cells catch the light at a time, more inside the band.
  float sparkle = 0.0;
  if (uSparkle > 0.0) {
    float cell = 3.0 * uPixelRatio;
    vec2 id = floor(gl_FragCoord.xy / cell);
    float h = hash12(id);
    float local = 1.0 - smoothstep(0.15, 0.5, length(fract(gl_FragCoord.xy / cell) - 0.5));
    float flicker = pow(max(sin(h * 61.0 + dot(tilt, vec2(9.0, 7.0)) + t * 1.7), 0.0), 14.0);
    sparkle = step(0.93, h) * flicker * local * uSparkle * (0.25 + 0.75 * glint);
  }

  vec3 color = mix(film, vec3(1.0), clamp(sparkle, 0.0, 1.0));
  fragColor = vec4(clamp(color, 0.0, 1.0), clamp(alpha + sparkle * 0.8, 0.0, 1.0));
}
`;

export function IridescentFoil({
  intensity = 0.55,
  scale = 1,
  hue = 0,
  sparkle = 0.35,
  speed = 0.6,
  interactive = true,
  tilt = 6,
  layer = "under",
  paused = false,
  className,
  children,
}: IridescentFoilProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const tiltEnabled = interactive && tilt > 0 && !reduceMotion;

  useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    animated: speed !== 0,
    paused,
    pointer: interactive,
    uniforms: {
      uIntensity: Math.min(Math.max(intensity, 0), 1),
      uScale: Math.min(Math.max(scale, 0.2), 4),
      uHue: hue,
      uSparkle: Math.min(Math.max(sparkle, 0), 1),
      uSpeed: speed,
    },
  });

  const tiltHandlers = tiltEnabled
    ? {
        onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
          if (event.pointerType === "touch") return;
          const node = event.currentTarget;
          const rect = node.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
          const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
          node.style.transition = "transform 120ms ease-out";
          node.style.transform = `perspective(900px) rotateX(${(-y * tilt).toFixed(2)}deg) rotateY(${(x * tilt).toFixed(2)}deg)`;
        },
        onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => {
          const node = event.currentTarget;
          node.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
          node.style.transform = "";
        },
      }
    : {};

  // The canvas is appended after the children, so it paints above them unless
  // the children sit on a higher layer.
  const layerClass =
    layer === "over" ? "[&>canvas]:pointer-events-none [&>canvas]:z-20" : "[&>canvas]:pointer-events-none";

  return (
    <div
      ref={containerRef}
      data-slot="iridescent-foil"
      className={effectContainerClass(className, `${layerClass}`)}
      {...tiltHandlers}
    >
      {children ? <div className={layer === "over" ? "relative size-full" : "relative z-10 size-full"}>{children}</div> : null}
    </div>
  );
}

export default IridescentFoil;
