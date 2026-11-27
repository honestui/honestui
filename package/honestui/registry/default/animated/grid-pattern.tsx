"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type GridPatternVariant = "lines" | "dots";
export type GridPatternFade = "none" | "radial" | "edges" | "top" | "bottom";

export interface GridPatternProps {
  /** Width of one cell, in px. */
  width?: number;
  /** Height of one cell, in px. */
  height?: number;
  /** Horizontal offset of the pattern, in px. */
  x?: number;
  /** Vertical offset of the pattern, in px. */
  y?: number;
  /** Draw cell outlines or a dot at each intersection. */
  variant?: GridPatternVariant;
  /** Dash pattern for the lines, such as "4 2". Lines variant only. */
  strokeDasharray?: string;
  /** Dot radius, in px. Dots variant only. */
  dotRadius?: number;
  /** Cells that stay filled, as [column, row] pairs. */
  squares?: Array<[number, number]>;
  /** Number of cells that light up and fade out at random. 0 turns this off. */
  numSquares?: number;
  /** Peak opacity of a lit cell. */
  maxOpacity?: number;
  /** Seconds for a cell to fade in and back out. */
  duration?: number;
  /** Fade the pattern toward its edges with a mask. */
  fade?: GridPatternFade;
  className?: string;
}

const FADE_CLASSES: Record<GridPatternFade, string> = {
  none: "",
  radial: "[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
  edges:
    "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent),linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] [mask-composite:intersect]",
  top: "[mask-image:linear-gradient(to_bottom,black,transparent_85%)]",
  bottom: "[mask-image:linear-gradient(to_top,black,transparent_85%)]",
};

type LitSquare = { id: number; column: number; row: number; first?: boolean };

/**
 * An SVG grid of lines or dots that fills its parent, with optional cells that
 * glow on and off. Render it inside a `relative` element; it is decorative and
 * ignores pointer events. Color follows `currentColor`, so set it with a text
 * color class such as `text-foreground/15`.
 */
export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  variant = "lines",
  strokeDasharray,
  dotRadius = 1,
  squares,
  numSquares = 0,
  maxOpacity = 0.35,
  duration = 4,
  fade = "none",
  className,
}: GridPatternProps) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const patternId = `beui-grid-${id}`;
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ columns: 0, rows: 0 });
  const [lit, setLit] = useState<LitSquare[]>([]);
  const nextId = useRef(0);

  // Measure how many whole cells fit and choose the lit cells in the same
  // observer callback. The observer reports once as soon as it starts, so
  // cells are chosen on the client after mount (never during render) and
  // server and client markup match.
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      const next = {
        columns: Math.max(1, Math.floor(box.width / width)),
        rows: Math.max(1, Math.floor(box.height / height)),
      };
      setSize(next);
      setLit(
        Array.from({ length: Math.max(0, numSquares) }, () => ({
          id: nextId.current++,
          column: Math.floor(Math.random() * next.columns),
          row: Math.floor(Math.random() * next.rows),
          first: true,
        })),
      );
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [width, height, numSquares]);

  const pick = (): LitSquare => ({
    id: nextId.current++,
    column: Math.floor(Math.random() * size.columns),
    row: Math.floor(Math.random() * size.rows),
  });

  const replace = (litId: number) => {
    setLit((current) => current.map((square) => (square.id === litId ? pick() : square)));
  };

  return (
    <svg
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 size-full text-foreground/15",
        FADE_CLASSES[fade],
        className,
      )}
    >
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          {variant === "dots" ? (
            <circle cx={1} cy={1} r={dotRadius} fill="currentColor" />
          ) : (
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              stroke="currentColor"
              strokeDasharray={strokeDasharray}
            />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares?.map(([column, row]) => (
          <rect
            key={`${column}-${row}`}
            width={width - 1}
            height={height - 1}
            x={column * width + 1}
            y={row * height + 1}
            fill="currentColor"
            fillOpacity={maxOpacity}
          />
        ))}
        {(reduce ? [] : lit).map((square, index) => (
          <motion.rect
            key={square.id}
            width={width - 1}
            height={height - 1}
            x={square.column * width + 1}
            y={square.row * height + 1}
            fill="currentColor"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, maxOpacity, 0] }}
            transition={{
              duration,
              ease: "easeInOut",
              // Spread the first round so cells don't all pulse together.
              delay: square.first ? (index / Math.max(lit.length, 1)) * duration : 0,
            }}
            onAnimationComplete={() => replace(square.id)}
          />
        ))}
      </svg>
    </svg>
  );
}
