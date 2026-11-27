"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react";
import {
  Children,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

/** +1 when moving to a later panel, -1 when moving back. Passed to variants as `custom`. */
export type TransitionPanelDirection = 1 | -1;

export interface TransitionPanelProps {
  /** One child per panel. Only the child at `activeIndex` is rendered. */
  children: ReactNode;
  /** Index of the visible panel. */
  activeIndex: number;
  /**
   * Variants with `enter`, `center`, and `exit` keys. Each may be a function of
   * the direction (+1 forward, -1 back). Defaults to a short directional slide
   * with a blur.
   */
  variants?: Variants;
  /** Transition for panel enter and exit. */
  transition?: Transition;
  /** Animate the container height when panels differ in height. Default true. */
  animateHeight?: boolean;
  className?: string;
  /** Classes for the wrapper around each panel. */
  panelClassName?: string;
}

const defaultVariants: Variants = {
  enter: (direction: TransitionPanelDirection) => ({
    opacity: 0,
    x: direction * 24,
    filter: "blur(4px)",
  }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (direction: TransitionPanelDirection) => ({
    opacity: 0,
    x: direction * -24,
    filter: "blur(4px)",
  }),
};

const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const DEFAULT_TRANSITION: Transition = {
  x: SPRING_LAYOUT,
  opacity: { duration: 0.2, ease: EASE_OUT },
  filter: { duration: 0.2, ease: EASE_OUT },
};

export function TransitionPanel({
  children,
  activeIndex,
  variants,
  transition,
  animateHeight = true,
  className,
  panelClassName,
}: TransitionPanelProps) {
  const reduce = useReducedMotion() ?? false;
  const panels = Children.toArray(children);
  const [previousIndex, setPreviousIndex] = useState(activeIndex);
  const [direction, setDirection] = useState<TransitionPanelDirection>(1);
  const [height, setHeight] = useState<number | "auto">("auto");

  // Derive the direction during render when the index changes, so the
  // entering and exiting panels both read the new value.
  if (previousIndex !== activeIndex) {
    setPreviousIndex(activeIndex);
    setDirection(activeIndex > previousIndex ? 1 : -1);
  }

  // Track the active panel's height so the container can spring between
  // panels of different sizes.
  const measureRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !animateHeight) return;
      const observer = new ResizeObserver(([entry]) => {
        // An exiting panel is popped out of flow and tagged by Motion; its
        // size no longer decides the container height.
        if (node.parentElement?.hasAttribute("data-motion-pop-id")) return;
        setHeight(entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight);
      });
      observer.observe(node);
      return () => observer.disconnect();
    },
    [animateHeight],
  );

  const active = panels[activeIndex];

  return (
    <motion.div
      initial={false}
      animate={animateHeight ? { height } : undefined}
      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      className={cn("relative overflow-hidden", className)}
    >
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={reduce ? reducedVariants : (variants ?? defaultVariants)}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduce ? { duration: 0.15 } : (transition ?? DEFAULT_TRANSITION)}
          className={panelClassName}
        >
          {/* popLayout attaches its own ref to the animated element, so the
              height is measured on an inner wrapper. */}
          <div ref={measureRef}>{active}</div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
