"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CORE_UNIFORMS,
  NOISE_GLSL,
  effectContainerClass,
  rgb,
  useCssColors,
  useEffectCanvas,
} from "./effect-canvas";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type DissolveSide = "from" | "to";
export type DissolveDirection = "none" | "left" | "right" | "up" | "down" | "radial";

export interface DissolveProps {
  /** First image. It must allow cross-origin use. */
  from: string;
  /** Alternative text for `from`; an empty string when the image is decorative. */
  fromAlt: string;
  /** Second image. It must allow cross-origin use. */
  to: string;
  /** Alternative text for `to`; an empty string when the image is decorative. */
  toAlt: string;
  /** Which image to show. Changing it plays the dissolve. Ignored when `progress` is set. */
  show?: DissolveSide;
  /** Controlled position from 0 (`from`) to 1 (`to`). Overrides `show`. */
  progress?: number;
  /** Milliseconds a full dissolve takes when `show` changes. */
  duration?: number;
  /** Called when a dissolve started by `show` finishes. */
  onShowComplete?: (side: DissolveSide) => void;
  /** Size of the noise pattern. Larger values give finer grain. */
  scale?: number;
  /** Feathering of the boundary, from 0 (crisp) to 1 (soft). */
  softness?: number;
  /** Color of the glowing edge. Any CSS color. */
  edgeColor?: string;
  /** Width of the glowing edge, from 0 (none) to 0.2. */
  edgeWidth?: number;
  /** Where the dissolve starts: everywhere at once, from a side, or from the center. */
  direction?: DissolveDirection;
  className?: string;
  children?: React.ReactNode;
}

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
${CORE_UNIFORMS}
uniform sampler2D uImageTo;
uniform vec2 uImageToSize;
uniform float uProgress;
uniform float uScale;
uniform float uSoftness;
uniform float uEdgeWidth;
uniform float uDirection;
uniform vec4 uEdge;
out vec4 fragColor;
${NOISE_GLSL}

vec2 coverFor(vec2 uv, vec2 size) {
  float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
  float imageAspect = size.x / max(size.y, 1.0);
  if (imageAspect > canvasAspect) {
    uv.x = (uv.x - 0.5) * canvasAspect / imageAspect + 0.5;
  } else {
    uv.y = (uv.y - 0.5) * imageAspect / canvasAspect + 0.5;
  }
  return clamp(uv, 0.0, 1.0);
}

float directionField(vec2 uv) {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  if (uDirection < 0.5) return 0.5;
  if (uDirection < 1.5) return uv.x;
  if (uDirection < 2.5) return 1.0 - uv.x;
  if (uDirection < 3.5) return uv.y;
  if (uDirection < 4.5) return 1.0 - uv.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / max(aspect, 1.0);
  return clamp(length(p) * 1.38, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 a = texture(uImage, coverFor(uv, uImageSize));
  // Textures uploaded through the extra slot are not flipped.
  vec2 toUv = coverFor(uv, uImageToSize);
  vec4 b = texture(uImageTo, vec2(toUv.x, 1.0 - toUv.y));

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y) * uScale;
  // fbm sits around 0.2..0.8; stretch it to fill 0..1 evenly.
  float noise = smoothstep(0.18, 0.82, fbm(p + fbm(p * 0.7 + 3.1) * 0.6));
  float field = noise;
  if (uDirection > 0.5) field = mix(directionField(uv), noise, 0.32);

  float soft = max(uSoftness * 0.12, 0.002);
  float edge = max(uEdgeWidth, 0.0);
  // Push the threshold past both ends so 0 and 1 are fully one image, with no
  // edge left on screen.
  float reach = soft + edge * 3.0 + 0.02;
  float threshold = mix(-reach, 1.0 + reach, clamp(uProgress, 0.0, 1.0));
  float d = field - threshold;
  float reveal = 1.0 - smoothstep(-soft, soft, d);

  vec4 color = mix(a, b, reveal);
  if (edge > 0.0) {
    // A thin line of light that rides the front. Its width is measured on
    // screen, so it stays even where the noise is flat or steep.
    float pixel = max(fwidth(field), 1e-5);
    float width = min(edge, pixel * edge * 90.0 * uPixelRatio);
    float glow = exp(-(d * d) / (width * width));
    glow *= smoothstep(0.0, 0.03, uProgress) * smoothstep(1.0, 0.97, uProgress);
    color.rgb = mix(color.rgb, uEdge.rgb, clamp(glow * 0.8 * uEdge.a, 0.0, 1.0));
  }
  fragColor = vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
}
`;

const DIRECTIONS: Record<DissolveDirection, number> = {
  none: 0,
  left: 1,
  right: 2,
  up: 3,
  down: 4,
  radial: 5,
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Loads an image for the second texture. Returns null until it has decoded. */
function useLoadedImage(src: string) {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (!cancelled) setLoaded({ src, image });
    };
    image.src = src;
    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [src]);
  return loaded?.src === src ? loaded.image : null;
}

/** The uncontrolled position: eases toward the side named by `show`. */
function useShowProgress(
  show: DissolveSide,
  duration: number,
  onShowComplete: ((side: DissolveSide) => void) | undefined,
) {
  const reduceMotion = usePrefersReducedMotion();
  const target = show === "to" ? 1 : 0;
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const completeRef = useRef(onShowComplete);

  useEffect(() => {
    completeRef.current = onShowComplete;
  });

  useEffect(() => {
    const start = valueRef.current;
    if (start === target) return;
    // A dissolve that is interrupted continues from where it is, taking the
    // share of `duration` that is left.
    const total = reduceMotion ? 0 : Math.max(duration, 0) * Math.abs(target - start);
    const startedAt = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const t = total > 0 ? clamp01((now - startedAt) / total) : 1;
      const next = start + (target - start) * easeInOut(t);
      valueRef.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(step);
      else completeRef.current?.(target === 1 ? "to" : "from");
    });
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduceMotion]);

  return value;
}

/**
 * Dissolves one image into another through a noise pattern, with an optional
 * glowing edge. Set `show` to play the dissolve, or drive `progress` yourself.
 */
export function Dissolve({
  from,
  fromAlt,
  to,
  toAlt,
  show = "from",
  progress,
  duration = 1400,
  onShowComplete,
  scale = 3,
  softness = 0.2,
  edgeColor = "#ffd29a",
  edgeWidth = 0.02,
  direction = "none",
  className,
  children,
}: DissolveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shown = useShowProgress(show, duration, onShowComplete);
  const value = clamp01(progress ?? shown);
  const toImage = useLoadedImage(to);
  const [edge] = useCssColors(containerRef, [edgeColor]);

  const { imageReady } = useEffectCanvas(containerRef, {
    fragment: FRAGMENT,
    imageSrc: from,
    animated: false,
    textures: { uImageTo: toImage },
    uniforms: {
      uImageToSize: toImage ? [toImage.naturalWidth, toImage.naturalHeight] : [1, 1],
      uProgress: value,
      uScale: Math.max(scale, 0.1),
      uSoftness: clamp01(softness),
      uEdgeWidth: Math.min(Math.max(edgeWidth, 0), 0.2),
      uDirection: DIRECTIONS[direction],
      uEdge: [...rgb(edge), edge[3] ?? 1],
    },
  });

  // The canvas takes over once both images are on the GPU. Until then, and
  // without WebGL, the two images crossfade.
  const ready = imageReady && toImage !== null;
  const showingTo = value >= 0.5;

  return (
    <div ref={containerRef} data-slot="dissolve" className={effectContainerClass(className)}>
      {/* Both images stay in the accessibility tree order; only the one on
          screen is exposed, so its text follows the dissolve. */}
      <img
        src={from}
        alt={showingTo ? "" : fromAlt}
        aria-hidden={showingTo ? true : undefined}
        className="absolute inset-0 z-[1] size-full object-cover"
        style={{ opacity: ready ? 0 : 1 }}
      />
      <img
        src={to}
        alt={showingTo ? toAlt : ""}
        aria-hidden={showingTo ? undefined : true}
        className="absolute inset-0 z-[1] size-full object-cover"
        style={{ opacity: ready ? 0 : value }}
      />
      {children ? <div className="relative z-10 size-full">{children}</div> : null}
    </div>
  );
}

export default Dissolve;
