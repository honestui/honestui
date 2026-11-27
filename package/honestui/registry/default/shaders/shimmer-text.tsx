"use client";

import React from "react";

export interface ShimmerTextProps extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  children?: React.ReactNode;
  /** Element to render. */
  as?: React.ElementType;
  /** Text color. Any CSS color; `currentColor` follows the surrounding text and theme. */
  color?: string;
  /** Color of the band of light. Defaults to `color`. */
  shimmerColor?: string;
  /** How much the text fades while the band sweeps, from 0 (not at all) to 0.9. */
  dim?: number;
  /** Width of the band: a number in CSS pixels or any CSS length. */
  width?: number | string;
  /** Milliseconds the band takes to cross the text. */
  duration?: number;
  /** Milliseconds between one sweep leaving and the next one entering. */
  delay?: number;
  /** Direction of the band in degrees. 90 is upright; larger values lean it. */
  angle?: number;
  /** Sweeps while true. When false the text is plain, at full color. */
  active?: boolean;
}

// One stylesheet for every instance. React hoists it into <head> once, keyed
// by href. Each instance sets only custom properties inline.
const CSS = `@keyframes hui-shimmer-text{from{background-position:100% 0,0 0}to{background-position:0% 0,0 0}}
.hui-shimmer-text[data-active]{
--hui-shimmer-soft:color-mix(in oklab,var(--hui-shimmer-color) 40%,transparent);
background-image:linear-gradient(var(--hui-shimmer-angle),transparent calc(50% - var(--hui-shimmer-half)),var(--hui-shimmer-soft) calc(50% - var(--hui-shimmer-half) * 0.45),var(--hui-shimmer-color) 50%,var(--hui-shimmer-soft) calc(50% + var(--hui-shimmer-half) * 0.45),transparent calc(50% + var(--hui-shimmer-half))),linear-gradient(var(--hui-shimmer-base),var(--hui-shimmer-base));
background-size:var(--hui-shimmer-size) 100%,100% 100%;
background-repeat:no-repeat;
-webkit-background-clip:text;
background-clip:text;
-webkit-text-fill-color:transparent;
animation:hui-shimmer-text var(--hui-shimmer-period) linear infinite;
}
.hui-shimmer-text[data-active]::selection,.hui-shimmer-text[data-active] ::selection{-webkit-text-fill-color:var(--hui-shimmer-color)}
@media (prefers-reduced-motion:reduce){.hui-shimmer-text[data-active]{animation:none;background:none;-webkit-text-fill-color:currentColor}}`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Real, selectable text with a band of light sweeping across it. The text is
 * drawn with CSS (background-clip: text), so it stays crisp at any size and
 * is read by assistive technology like any other text.
 */
export function ShimmerText({
  children,
  as: Component = "span",
  color = "currentColor",
  shimmerColor,
  dim = 0.5,
  width = "4em",
  duration = 1800,
  delay = 700,
  angle = 105,
  active = true,
  className,
  style,
  ...props
}: ShimmerTextProps) {
  const sweep = Math.max(duration, 100);
  const gap = Math.max(delay, 0);
  // The band layer is wider than the text so it starts and ends just outside
  // it; the extra width is spent offscreen, which becomes the pause between
  // sweeps at a constant speed.
  const travel = (sweep + gap) / sweep;
  const bandWidth = typeof width === "number" ? `${Math.max(width, 1)}px` : width;
  const base = color === "currentColor" || color === "currentcolor" ? "currentColor" : color;

  const variables = {
    "--hui-shimmer-color": shimmerColor ?? base,
    "--hui-shimmer-base": `color-mix(in oklab, ${base} ${Math.round((1 - clamp(dim, 0, 0.9)) * 100)}%, transparent)`,
    "--hui-shimmer-half": `calc(${bandWidth} / 2)`,
    "--hui-shimmer-size": `calc(100% + (100% + ${bandWidth}) * ${travel.toFixed(4)})`,
    "--hui-shimmer-angle": `${angle}deg`,
    "--hui-shimmer-period": `${sweep + gap}ms`,
  } as React.CSSProperties;

  return (
    <>
      <style href="hui-shimmer-text" precedence="default">
        {CSS}
      </style>
      <Component
        {...props}
        data-slot="shimmer-text"
        data-active={active ? "" : undefined}
        className={["hui-shimmer-text", className].filter(Boolean).join(" ")}
        style={{ ...(base !== "currentColor" ? { color: base } : null), ...variables, ...style }}
      >
        {children}
      </Component>
    </>
  );
}

export default ShimmerText;
