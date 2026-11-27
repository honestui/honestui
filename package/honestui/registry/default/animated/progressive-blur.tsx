import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ProgressiveBlurDirection = "top" | "bottom" | "left" | "right";

export interface ProgressiveBlurProps extends HTMLAttributes<HTMLDivElement> {
  /** Edge where the blur is strongest. Default "bottom". */
  direction?: ProgressiveBlurDirection;
  /** Number of stacked blur layers. More layers give a smoother ramp. Default 8. */
  layers?: number;
  /** Blur radius at the strongest edge, in px. Default 16. */
  intensity?: number;
}

/**
 * Stacks backdrop-filter layers whose blur doubles toward one edge. Each layer
 * is masked to an overlapping band, so the radius ramps up smoothly instead of
 * the single hard step a one-layer blur produces. Position it over the content
 * it should soften (for example `absolute inset-x-0 bottom-0 h-24`).
 */
export function ProgressiveBlur({
  direction = "bottom",
  layers = 8,
  intensity = 16,
  className,
  style,
  ...props
}: ProgressiveBlurProps) {
  const count = Math.max(2, Math.round(layers));
  const step = 100 / (count + 1);

  return (
    <div
      aria-hidden
      data-slot="progressive-blur"
      className={cn("pointer-events-none relative", className)}
      style={style}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => {
        // Blur halves for every layer away from the strong edge.
        const blur = intensity / 2 ** (count - 1 - index);
        const start = index * step;
        const isLast = index === count - 1;
        const mask = `linear-gradient(to ${direction}, transparent ${start}%, #000 ${start + step}%, #000 ${
          isLast ? 100 : start + 2 * step
        }%, ${isLast ? "#000 100%" : `transparent ${Math.min(100, start + 3 * step)}%`})`;
        const layerStyle: CSSProperties = {
          backdropFilter: `blur(${blur.toFixed(2)}px)`,
          WebkitBackdropFilter: `blur(${blur.toFixed(2)}px)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        };
        return <div key={index} className="absolute inset-0 rounded-[inherit]" style={layerStyle} />;
      })}
    </div>
  );
}
