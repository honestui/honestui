"use client";

import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CircularTextHover = "speedUp" | "slowDown" | "pause" | "none";

export interface CircularTextProps {
  /** The text to set around the circle. Screen readers hear it once. */
  text: string;
  /** Placed after each repeat so the end of the text meets the start cleanly. Default " • ". */
  separator?: string;
  /** How many times the text goes around the circle. Default 1. */
  repeat?: number;
  /** Diameter in pixels. Default 160. */
  size?: number;
  /** Font size in pixels. Default 13. */
  fontSize?: number;
  /** Seconds for one full turn. Default 18. */
  duration?: number;
  /** Which way the text turns. Default "clockwise". */
  direction?: "clockwise" | "counterclockwise";
  /** What hovering does to the rotation. Default "speedUp". */
  onHover?: CircularTextHover;
  /** Stops the rotation. */
  paused?: boolean;
  /** Content in the middle of the circle, such as an icon or a logo. */
  children?: ReactNode;
  className?: string;
  /** Class for the SVG text, for weight, case, or color. */
  textClassName?: string;
}

const HOVER_FACTOR: Record<CircularTextHover, number> = {
  speedUp: 3,
  slowDown: 0.3,
  pause: 0,
  none: 1,
};

export function CircularText({
  text,
  separator = " • ",
  repeat = 1,
  size = 160,
  fontSize = 13,
  duration = 18,
  direction = "clockwise",
  onHover = "speedUp",
  paused = false,
  children,
  className,
  textClassName,
}: CircularTextProps) {
  // Keep the id to plain characters so the textPath reference resolves in every browser.
  const pathId = `circular-text-${useId().replace(/[^\w-]/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const inView = useInView(rootRef);
  const [hovered, setHovered] = useState(false);
  const rotate = useMotionValue(0);
  // The current rate eases toward the target, so hovering speeds up or slows down smoothly.
  const rate = useRef(1);

  const running = !reduce && !paused && inView;
  useAnimationFrame((_, delta) => {
    if (!running) return;
    const target = hovered ? HOVER_FACTOR[onHover] : 1;
    const step = Math.min(delta, 64) / 1000;
    rate.current += (target - rate.current) * (1 - Math.exp(-step * 6));
    const degreesPerSecond = 360 / Math.max(duration, 0.1);
    const sign = direction === "clockwise" ? 1 : -1;
    rotate.set((rotate.get() + sign * degreesPerSecond * rate.current * step) % 360);
  });

  const center = size / 2;
  // Keep the letters inside the box: the baseline sits a little more than one line in from the edge.
  const radius = Math.max(center - fontSize * 1.1, 1);
  const circumference = 2 * Math.PI * radius;
  // Non-breaking spaces: SVG text collapses ordinary spaces next to each other and at the joins.
  const ring = Array.from({ length: Math.max(1, Math.round(repeat)) }, () => `${text}${separator}`)
    .join("")
    .replace(/ /g, "\u00a0");
  // A circle drawn from the top, clockwise, so the text starts at twelve o'clock.
  const path = `M ${center},${center - radius} a ${radius},${radius} 0 1,1 0,${radius * 2} a ${radius},${radius} 0 1,1 0,${-radius * 2}`;

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-grid shrink-0 place-items-center text-foreground", className)}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="sr-only">{text}</span>
      <motion.svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="absolute inset-0 overflow-visible"
        style={{ rotate }}
      >
        <defs>
          <path id={pathId} d={path} fill="none" />
        </defs>
        <text
          className={cn("fill-current font-medium uppercase", textClassName)}
          style={{ fontSize, letterSpacing: "0.08em" }}
        >
          {/* Stretching the spacing to the full circumference closes the ring without a gap. */}
          <textPath href={`#${pathId}`} textLength={circumference} lengthAdjust="spacing" startOffset="0">
            {ring}
          </textPath>
        </text>
      </motion.svg>
      {children ? <div className="relative grid place-items-center">{children}</div> : null}
    </div>
  );
}
