"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  Children,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type AnimatedListLayout = "list" | "stack";

export interface AnimatedListProps {
  /**
   * Items in arrival order, oldest first. Each child needs a stable `key`.
   * The newest item is shown on top.
   */
  children: ReactNode;
  /**
   * Milliseconds between reveals. Items appear one at a time, and items added
   * later join the queue. Set to 0 to show every item at once.
   */
  delay?: number;
  /** Maximum items shown. Older items leave as new ones arrive. */
  maxVisible?: number;
  /**
   * `list` lays items out in a column. `stack` piles them like notifications,
   * with older items tucked behind the newest one.
   */
  layout?: AnimatedListLayout;
  /** Vertical offset between stacked items, in px. Default 10. */
  stackOffset?: number;
  /**
   * Announce new items politely to screen readers. Use for feeds that matter,
   * such as notifications. Default false.
   */
  live?: boolean;
  className?: string;
  /** Classes for the wrapper around each item. */
  itemClassName?: string;
}

const ENTER_SPRING: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.7,
};

export function AnimatedList({
  children,
  delay = 1000,
  maxVisible = 4,
  layout = "list",
  stackOffset = 10,
  live = false,
  className,
  itemClassName,
}: AnimatedListProps) {
  const reduce = useReducedMotion() ?? false;
  const items = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const total = items.length;
  const [revealed, setRevealed] = useState(delay > 0 ? Math.min(1, total) : total);
  const shownCount = delay > 0 ? Math.min(revealed, total) : total;

  // Reveal the next queued item on each tick until everything is shown. A
  // list that grows later resumes from where it stopped.
  useEffect(() => {
    if (delay <= 0 || revealed >= total) return;
    const timer = window.setTimeout(() => setRevealed((count) => count + 1), delay);
    return () => window.clearTimeout(timer);
  }, [delay, revealed, total]);

  // Newest first, trimmed to the visible window.
  const visible = items.slice(0, shownCount).reverse().slice(0, Math.max(1, maxVisible));
  const stacked = layout === "stack";

  return (
    <div
      role={live ? "log" : undefined}
      aria-live={live ? "polite" : undefined}
      aria-relevant={live ? "additions" : undefined}
      className={cn(stacked ? "grid" : "flex flex-col gap-3", className)}
      // Stacked items share one grid cell; padding leaves room for the
      // offsets of the items tucked behind.
      style={stacked ? { paddingBottom: (Math.min(visible.length, 3) - 1) * stackOffset } : undefined}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((item, index) => {
          const depth = stacked ? index : 0;
          return (
            <motion.div
              key={item.key ?? index}
              layout={stacked ? false : "position"}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: stacked ? -16 : -12 }}
              // Tucked items stay opaque so their text never shows through the
              // item in front; scale and offset carry the depth instead. Only
              // the first three layers are visible.
              animate={
                reduce
                  ? { opacity: depth > 2 ? 0 : 1, y: depth * stackOffset }
                  : {
                      opacity: depth > 2 ? 0 : 1,
                      scale: 1 - depth * 0.05,
                      y: depth * stackOffset,
                    }
              }
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, transition: { duration: 0.18, ease: EASE_OUT } }}
              transition={reduce ? { duration: 0.15 } : ENTER_SPRING}
              aria-hidden={stacked && depth > 0 ? true : undefined}
              className={cn(stacked ? "origin-bottom [grid-area:1/1]" : "origin-top", itemClassName)}
              style={stacked ? { zIndex: visible.length - depth } : undefined}
            >
              {item}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
