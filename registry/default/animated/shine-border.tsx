import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface ShineBorderProps {
  /** Colors the sheen passes through. One color gives a single soft highlight. */
  colors?: string[];
  /** Seconds for one sweep and back. */
  duration?: number;
  /** Width of the shining border, in px. */
  borderWidth?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "color-mix(in oklch, var(--foreground) 70%, transparent)",
  "color-mix(in oklch, var(--foreground) 20%, transparent)",
];

/**
 * A soft sheen that drifts along its parent's border. Place it as a child of a
 * `relative` element with a border radius; it inherits the radius, paints only
 * the border width, and ignores pointer events.
 */
export function ShineBorder({
  colors = DEFAULT_COLORS,
  duration = 12,
  borderWidth = 1,
  className,
}: ShineBorderProps) {
  const stops = colors.length > 0 ? colors.join(", ") : DEFAULT_COLORS.join(", ");

  return (
    <>
      <style>
        {`@keyframes beui-shine-border{0%,100%{background-position:0% 0%}50%{background-position:100% 100%}}.beui-shine-border{animation:beui-shine-border var(--shine-duration) linear infinite}@media(prefers-reduced-motion:reduce){.beui-shine-border{animation:none;background-position:30% 30%}}`}
      </style>
      <div
        aria-hidden
        className={cn(
          "beui-shine-border pointer-events-none absolute inset-0 rounded-[inherit] bg-[length:300%_300%]",
          className,
        )}
        style={
          {
            padding: borderWidth,
            // The content box excluded from the full box leaves only the
            // padding ring, and the padding is the border width. Set inline
            // because the mask shorthand resets mask-composite, so utility
            // class order could undo the exclusion.
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            backgroundImage: `radial-gradient(transparent, transparent, ${stops}, transparent, transparent)`,
            "--shine-duration": `${duration}s`,
          } as CSSProperties
        }
      />
    </>
  );
}
