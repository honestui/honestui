"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type LiquidGlassMode = "refract" | "blur";

export interface LiquidGlassProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Corner radius of the panel in CSS pixels. */
  radius?: number;
  /** Width of the curved edge in CSS pixels. The middle of the panel stays flat. */
  bezel?: number;
  /** How far the curved edge bends what is behind it, from 0 to 1. */
  refraction?: number;
  /** Splits red and blue slightly at the edge like a prism, from 0 to 1. */
  dispersion?: number;
  /** Frosted blur of the backdrop, from 0 to 1. */
  frost?: number;
  /** Color saturation of the backdrop. 1 leaves it unchanged. */
  saturation?: number;
  /** Strength of the light caught by the rim, from 0 to 1. */
  specular?: number;
  /** Direction the light comes from, in degrees clockwise from the top. */
  lightAngle?: number;
  /** Turn the rim light toward the pointer while it is over the panel. */
  interactive?: boolean;
  /**
   * Color laid over the backdrop so content stays readable. `"auto"` mixes a
   * little of the page background in, so it follows light and dark themes.
   */
  tint?: string;
  /** Draw a soft shadow under the panel. */
  shadow?: boolean;
  /**
   * `"auto"` refracts in browsers that can filter a backdrop through SVG
   * (Chromium) and falls back to blur elsewhere. `"blur"` always uses the
   * fallback.
   */
  mode?: "auto" | LiquidGlassMode;
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

const MAP_LIMIT = 640;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Builds the displacement map for a rounded rectangle. Red and green hold the
 * x and y offset (0.5 is no offset). Offsets point outward along the edge
 * normal and follow a circular bezel profile: steep at the rim, flat inside,
 * so the edge pulls in what lies just beyond the panel the way thick glass
 * does, and the middle shows the backdrop unchanged.
 */
export function createLiquidGlassMap(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  margin: number,
): string | null {
  if (typeof document === "undefined" || width < 2 || height < 2) return null;
  const fullWidth = width + margin * 2;
  const fullHeight = height + margin * 2;
  const scale = Math.min(1, MAP_LIMIT / Math.max(fullWidth, fullHeight));
  const mapWidth = Math.max(2, Math.round(fullWidth * scale));
  const mapHeight = Math.max(2, Math.round(fullHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(mapWidth, mapHeight);
  const data = image.data;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);
  const edge = Math.max(bezel, 1);

  for (let j = 0; j < mapHeight; j++) {
    const py = (j + 0.5) / scale - margin - halfHeight;
    for (let i = 0; i < mapWidth; i++) {
      const px = (i + 0.5) / scale - margin - halfWidth;
      const qx = Math.abs(px) - (halfWidth - r);
      const qy = Math.abs(py) - (halfHeight - r);
      let nx: number;
      let ny: number;
      let distance: number;
      if (qx > 0 && qy > 0) {
        const length = Math.hypot(qx, qy) || 1;
        distance = length - r;
        nx = (qx / length) * Math.sign(px);
        ny = (qy / length) * Math.sign(py);
      } else if (qx > qy) {
        distance = qx - r;
        nx = Math.sign(px);
        ny = 0;
      } else {
        distance = qy - r;
        nx = 0;
        ny = Math.sign(py);
      }
      // Depth inside the panel, as a share of the bezel: 0 at the rim.
      const s = Math.min(Math.max(-distance / edge, 0), 1);
      const inv = 1 - s;
      const magnitude = 1 - Math.sqrt(Math.max(0, 1 - inv * inv));
      const offset = (j * mapWidth + i) * 4;
      data[offset] = Math.round(127.5 + 127.5 * nx * magnitude);
      data[offset + 1] = Math.round(127.5 + 127.5 * ny * magnitude);
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function supportsSvgBackdrop() {
  if (typeof navigator === "undefined") return false;
  const agent = navigator.userAgent;
  // Chromium applies SVG filters referenced from backdrop-filter. WebKit and
  // Gecko accept the syntax but do not render it, so they get the fallback.
  return /(Chrome|Chromium)\/\d+/.test(agent) && !/\bFirefox\//.test(agent);
}

function subscribeNever() {
  return () => {};
}

let anglePropertyRegistered = false;

function registerAngleProperty() {
  if (anglePropertyRegistered || typeof CSS === "undefined" || !("registerProperty" in CSS)) return;
  anglePropertyRegistered = true;
  try {
    CSS.registerProperty({
      name: "--liquid-glass-light",
      syntax: "<angle>",
      inherits: true,
      initialValue: "315deg",
    });
  } catch {
    // Already registered by another copy of the component.
  }
}

function usePrefersReducedTransparency() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function rimBackground(alpha: number) {
  const strong = `rgba(255,255,255,${(0.95 * alpha).toFixed(3)})`;
  const soft = `rgba(255,255,255,${(0.42 * alpha).toFixed(3)})`;
  return `conic-gradient(from calc(var(--liquid-glass-light) - 70deg), transparent 0deg, ${strong} 70deg, transparent 140deg, transparent 180deg, ${soft} 250deg, transparent 320deg)`;
}

// Keeps only the padding ring: the content box is cut out of the border box.
const ringMask: React.CSSProperties = {
  WebkitMaskImage: "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
  maskImage: "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
  WebkitMaskClip: "content-box, border-box",
  maskClip: "content-box, border-box",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

export function LiquidGlass({
  radius = 28,
  bezel = 24,
  refraction = 0.65,
  dispersion = 0.25,
  frost = 0.08,
  saturation = 1.5,
  specular = 0.7,
  lightAngle = 315,
  interactive = true,
  tint = "auto",
  shadow = true,
  mode = "auto",
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ref,
  ...props
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );
  const filterId = `liquid-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reducedMotion = usePrefersReducedMotion();
  const reducedTransparency = usePrefersReducedTransparency();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const canRefract = useSyncExternalStore(subscribeNever, supportsSvgBackdrop, () => false);
  const [pointerAngle, setPointerAngle] = useState<number | null>(null);

  useEffect(() => {
    registerAngleProperty();
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const width = Math.round(box ? box.inlineSize : entry.contentRect.width);
      const height = Math.round(box ? box.blockSize : entry.contentRect.height);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize((current) =>
          current && current.width === width && current.height === height ? current : { width, height },
        );
      });
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const strength = clamp01(refraction);
  const spread = clamp01(dispersion);
  const activeMode: LiquidGlassMode =
    mode === "blur" || reducedTransparency || !canRefract || strength === 0 ? "blur" : "refract";
  const bezelWidth = Math.max(2, bezel);
  const displacement = strength * bezelWidth * 2.4;
  const margin = Math.ceil(displacement + 2);

  const map = useMemo(() => {
    if (activeMode !== "refract" || !size) return null;
    return createLiquidGlassMap(size.width, size.height, radius, bezelWidth, margin);
  }, [activeMode, size, radius, bezelWidth, margin]);

  const refracting = activeMode === "refract" && map !== null && size !== null;
  const blur = refracting ? frost * 12 : Math.max(frost * 12, 10);
  // Chromium smears a CSS blur chained after an SVG backdrop filter, so in
  // refract mode the frost and saturation run inside the SVG filter instead.
  const backdrop = refracting
    ? `url(#${filterId})`
    : `blur(${blur.toFixed(1)}px) saturate(${saturation})`;

  const tintColor =
    tint === "auto"
      ? `color-mix(in oklab, var(--background, #fff) ${reducedTransparency ? 88 : refracting ? 12 : 30}%, transparent)`
      : tint;

  const light = !reducedMotion && interactive && pointerAngle !== null ? pointerAngle : lightAngle;
  const rimStrength = clamp01(specular);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (!interactive || reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    setPointerAngle(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    setPointerAngle(null);
  };

  const fullWidth = size ? size.width + margin * 2 : 0;
  const fullHeight = size ? size.height + margin * 2 : 0;

  return (
    <div
      {...props}
      ref={setRefs}
      data-slot="liquid-glass"
      data-mode={refracting ? "refract" : "blur"}
      className={["relative overflow-hidden", className].filter(Boolean).join(" ")}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={
        {
          borderRadius: radius,
          "--liquid-glass-light": `${light}deg`,
          transition: reducedMotion ? undefined : "--liquid-glass-light 420ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          boxShadow: shadow
            ? "0 0 0 0.5px rgba(0,0,0,0.08), 0 18px 40px -18px rgba(0,0,0,0.35), 0 4px 12px -4px rgba(0,0,0,0.14)"
            : undefined,
          ...style,
        } as React.CSSProperties
      }
    >
      {refracting ? (
        <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute">
          <filter
            id={filterId}
            x={-margin}
            y={-margin}
            width={fullWidth}
            height={fullHeight}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map}
              x={-margin}
              y={-margin}
              width={fullWidth}
              height={fullHeight}
              preserveAspectRatio="none"
              result="map"
            />
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur / 2} edgeMode="duplicate" result="frosted" />
            <feColorMatrix in="frosted" type="saturate" values={String(saturation)} result="source" />
            {spread > 0 ? (
              <>
                <feDisplacementMap in="source" in2="map" scale={displacement * (1 + spread * 0.12)} xChannelSelector="R" yChannelSelector="G" result="shiftRed" />
                <feColorMatrix in="shiftRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                <feDisplacementMap in="source" in2="map" scale={displacement} xChannelSelector="R" yChannelSelector="G" result="shiftGreen" />
                <feColorMatrix in="shiftGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                <feDisplacementMap in="source" in2="map" scale={displacement * (1 - spread * 0.12)} xChannelSelector="R" yChannelSelector="G" result="shiftBlue" />
                <feColorMatrix in="shiftBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                <feBlend in="red" in2="green" mode="screen" result="redGreen" />
                <feBlend in="redGreen" in2="blue" mode="screen" />
              </>
            ) : (
              <feDisplacementMap in="source" in2="map" scale={displacement} xChannelSelector="R" yChannelSelector="G" />
            )}
          </filter>
        </svg>
      ) : null}
      <div
        aria-hidden="true"
        data-slot="liquid-glass-backdrop"
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          borderRadius: "inherit",
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: "inherit", background: tintColor }}
      />
      {rimStrength > 0 ? (
        <>
          <div
            aria-hidden="true"
            data-slot="liquid-glass-sheen"
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: "inherit",
              padding: Math.max(6, bezelWidth * 0.55),
              background: rimBackground(rimStrength * 0.32),
              filter: "blur(6px)",
              ...ringMask,
            }}
          />
          <div
            aria-hidden="true"
            data-slot="liquid-glass-rim"
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: "inherit",
              padding: 1.25,
              background: rimBackground(rimStrength),
              ...ringMask,
            }}
          />
        </>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "inherit",
          boxShadow:
            "inset 0 0 0 0.5px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -12px 24px -18px rgba(0,0,0,0.22)",
        }}
      />
      <div data-slot="liquid-glass-content" className="relative">
        {children}
      </div>
    </div>
  );
}

export default LiquidGlass;
