"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";

export interface ScrollProgressProps {
  /**
   * Scroll container to track. Omit to track the page. With a container, the
   * bar is sticky, so render it as the container's first child (position "top")
   * or last child (position "bottom").
   */
  container?: RefObject<HTMLElement | null>;
  /** Edge the bar sits on. Default "top". */
  position?: "top" | "bottom";
  /** Smooth the bar with a spring. Turned off under reduced motion. Default true. */
  smooth?: boolean;
  /** Classes for the bar: set its height and color here (default h-0.5 bg-foreground). */
  className?: string;
}

const SPRING = { stiffness: 260, damping: 40, mass: 0.4, restDelta: 0.0005 };

export function ScrollProgress({
  container,
  position = "top",
  smooth = true,
  className,
}: ScrollProgressProps) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll(container ? { container } : undefined);
  const smoothed = useSpring(scrollYProgress, SPRING);
  const scaleX = smooth && !reduce ? smoothed : scrollYProgress;

  return (
    <motion.div
      aria-hidden
      data-slot="scroll-progress"
      style={{ scaleX }}
      className={cn(
        "pointer-events-none inset-x-0 z-50 h-0.5 origin-left bg-foreground",
        container ? "sticky" : "fixed",
        position === "top" ? "top-0" : "bottom-0",
        // A sticky bar takes up flow space; the negative margin cancels its
        // height so the content below or above does not shift.
        container && (position === "top" ? "-mb-0.5" : "-mt-0.5"),
        className,
      )}
    />
  );
}
