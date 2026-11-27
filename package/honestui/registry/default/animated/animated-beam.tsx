"use client";

import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBeamProps {
  /** The positioned element both nodes sit inside. The beam is drawn over it. */
  containerRef: RefObject<HTMLElement | null>;
  /** Element the beam starts from. */
  fromRef: RefObject<HTMLElement | null>;
  /** Element the beam ends at. */
  toRef: RefObject<HTMLElement | null>;
  /** Lifts the middle of the path by this many px. Negative values push it down. */
  curvature?: number;
  /** Run the pulse from `toRef` back to `fromRef`. */
  reverse?: boolean;
  /** Seconds for the pulse to travel the path. */
  duration?: number;
  /** Seconds before the first pulse. Use different delays to stagger beams. */
  delay?: number;
  /** Length of the pulse, including its fading tail, as a fraction of the path from 0 to 1. */
  pulseLength?: number;
  /** Color of the resting path. */
  pathColor?: string;
  /** Stroke width of the path and pulse, in px. */
  pathWidth?: number;
  /** Opacity of the resting path. */
  pathOpacity?: number;
  /** Color of the pulse's head. */
  gradientStartColor?: string;
  /** Color the tail fades to. */
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  className?: string;
}

type Geometry = {
  width: number;
  height: number;
  d: string;
};

/** Number of stacked strokes that build the pulse's fading tail. */
const PULSE_LAYERS = 6;

/**
 * Draws a curved line between two elements and sends a light pulse along it.
 * Both nodes and the beam share a `relative` container; the path is measured
 * from their boxes and recomputed whenever the container or a node resizes.
 *
 * The path is a cubic curve that leaves and arrives horizontally, so several
 * beams into one node fan out cleanly. The pulse is a comet: a bright head
 * with a tail that fades out behind it.
 */
export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 4,
  delay = 0,
  pulseLength = 0.25,
  pathColor = "var(--muted-foreground)",
  pathWidth = 1.5,
  pathOpacity = 0.2,
  gradientStartColor = "var(--foreground)",
  gradientStopColor = "color-mix(in oklch, var(--foreground) 15%, transparent)",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  className,
}: AnimatedBeamProps) {
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const measure = () => {
      const box = container.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const x1 = a.left - box.left + a.width / 2 + startXOffset;
      const y1 = a.top - box.top + a.height / 2 + startYOffset;
      const x2 = b.left - box.left + b.width / 2 + endXOffset;
      const y2 = b.top - box.top + b.height / 2 + endYOffset;
      // Control points sit halfway along the x axis at each end's height, so
      // the curve leaves and arrives level. `curvature` lifts both of them.
      const reach = (x2 - x1) / 2;
      setGeometry({
        width: box.width,
        height: box.height,
        d: `M ${x1},${y1} C ${x1 + reach},${y1 - curvature} ${x2 - reach},${y2 - curvature} ${x2},${y2}`,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(from);
    observer.observe(to);
    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  if (!geometry) return null;

  const tail = Math.min(Math.max(pulseLength, 0.02), 1);
  // Paths are normalised to a length of 1. Each layer is a single dash whose
  // head sits at the same point, so the overlapping layers are brightest at
  // the head and fade toward the end of the tail. The head travels from the
  // start of the path to past its end, carrying the whole tail off the path.
  const layers = Array.from({ length: PULSE_LAYERS }, (_, index) => {
    const share = (PULSE_LAYERS - index) / PULSE_LAYERS;
    const length = tail * share;
    const headStart = reverse ? 1 : 0;
    const headEnd = reverse ? -tail : 1 + tail;
    // A dash of `length` starting at -offset ends at its head, so
    // offset = length - head going forward. Going backward the head leads,
    // so offset = -head.
    const offset = (head: number) => (reverse ? -head : length - head);
    return {
      length,
      from: offset(headStart),
      to: offset(headEnd),
      color: `color-mix(in oklch, ${gradientStartColor} ${Math.round((1 - share) * 100)}%, ${gradientStopColor})`,
    };
  });

  return (
    <>
      <style>
        {`@keyframes beui-animated-beam{from{stroke-dashoffset:var(--beam-from)}to{stroke-dashoffset:var(--beam-to)}}.beui-animated-beam{animation:beui-animated-beam var(--beam-duration) linear infinite;animation-delay:var(--beam-delay);animation-fill-mode:backwards}@media(prefers-reduced-motion:reduce){.beui-animated-beam{display:none}}`}
      </style>
      <svg
        aria-hidden
        fill="none"
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className={cn("pointer-events-none absolute top-0 left-0 overflow-visible", className)}
      >
        <path
          d={geometry.d}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity}
          strokeLinecap="round"
        />
        {layers.map((layer, index) => (
          <path
            key={index}
            d={geometry.d}
            pathLength={1}
            className="beui-animated-beam"
            stroke={layer.color}
            strokeOpacity={0.45}
            strokeWidth={pathWidth}
            strokeLinecap="round"
            strokeDasharray={`${layer.length} ${3 + tail}`}
            strokeDashoffset={layer.from}
            style={
              {
                "--beam-from": layer.from,
                "--beam-to": layer.to,
                "--beam-duration": `${duration}s`,
                "--beam-delay": `${delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </svg>
    </>
  );
}
