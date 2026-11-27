"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface BorderBeamProps {
  /** Length of the travelling light segment, in px. */
  size?: number;
  /** Seconds for one full lap around the border. */
  duration?: number;
  /** Seconds before the first lap starts. A negative value starts mid-lap. */
  delay?: number;
  /** Color at the head of the beam. */
  colorFrom?: string;
  /** Color the beam fades through toward its tail. */
  colorTo?: string;
  /** Width of the border the beam travels on, in px. */
  borderWidth?: number;
  /** Corner radius of the path in px. Defaults to the parent's border radius. */
  radius?: number;
  /** Travel counterclockwise. */
  reverse?: boolean;
  className?: string;
}

/**
 * A short segment of light that travels around its parent's border. Place it
 * as the last child of a `relative` element with a border radius; it fills the
 * parent, draws only inside the border width, and never takes pointer events.
 */
export function BorderBeam({
  size = 72,
  duration = 8,
  delay = 0,
  colorFrom = "var(--foreground)",
  colorTo = "color-mix(in oklch, var(--foreground) 35%, transparent)",
  borderWidth = 1,
  radius,
  reverse = false,
  className,
}: BorderBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [measuredRadius, setMeasuredRadius] = useState(0);

  // The visible border follows the parent's radius through `rounded-[inherit]`;
  // the motion path needs the same radius as a number so corners stay on the
  // border instead of cutting across them.
  useLayoutEffect(() => {
    if (radius !== undefined) return;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const value = Number.parseFloat(getComputedStyle(parent).borderTopLeftRadius);
    setMeasuredRadius(Number.isFinite(value) ? value : 0);
  }, [radius]);

  const pathRadius = radius ?? measuredRadius;

  return (
    <>
      <style>
        {`@keyframes beui-border-beam{to{offset-distance:100%}}.beui-border-beam{animation:beui-border-beam var(--beam-duration) linear infinite;animation-delay:var(--beam-delay);animation-direction:var(--beam-direction)}@media(prefers-reduced-motion:reduce){.beui-border-beam{animation:none;offset-distance:18%}}`}
      </style>
      <div
        ref={ref}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] border-solid border-transparent",
          // Two mask layers intersected: the full box minus the padding box
          // leaves only the border ring visible.
          "[mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
          className,
        )}
        style={{ borderWidth }}
      >
        <div
          className="beui-border-beam absolute aspect-square"
          style={
            {
              width: size,
              offsetPath: `rect(0 auto auto 0 round ${pathRadius}px)`,
              offsetAnchor: "90% 50%",
              background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
              "--beam-duration": `${duration}s`,
              "--beam-delay": `${delay}s`,
              "--beam-direction": reverse ? "reverse" : "normal",
            } as CSSProperties
          }
        />
      </div>
    </>
  );
}
