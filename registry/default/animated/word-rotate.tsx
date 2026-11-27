"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from "motion/react";
import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ElementType,
  type ReactNode,
} from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type WordRotateVariant = "slide" | "blur" | "fade";

export interface WordRotateProps {
  /** Items to cycle through. Children are used when omitted. */
  words?: ReactNode[];
  children?: ReactNode;
  as?: ElementType;
  /** Milliseconds each item stays. Default 2400. */
  interval?: number;
  /** Transition between items. Default "slide" (up). */
  variant?: WordRotateVariant;
  /** Hold the current item while the pointer is over it. Default false. */
  pauseOnHover?: boolean;
  /** Stop cycling. */
  paused?: boolean;
  /** Animate the width between items of different lengths. Default true. */
  animateWidth?: boolean;
  /**
   * Announce each new item to screen readers. Default false: the full list is
   * read once instead, which is less noisy for decorative rotation.
   */
  announce?: boolean;
  className?: string;
  itemClassName?: string;
  onIndexChange?: (index: number) => void;
}

type WordRotateRootProps = {
  children?: ReactNode;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const VARIANTS: Record<
  WordRotateVariant,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  slide: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  blur: {
    initial: { y: "35%", opacity: 0, filter: "blur(8px)" },
    animate: { y: "0%", opacity: 1, filter: "blur(0px)" },
    exit: { y: "-35%", opacity: 0, filter: "blur(8px)" },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

const REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function WordRotate({
  words,
  children,
  as: Comp = "span",
  interval = 2400,
  variant = "slide",
  pauseOnHover = false,
  paused = false,
  animateWidth = true,
  announce = false,
  className,
  itemClassName,
  onIndexChange,
}: WordRotateProps) {
  const Root = Comp as ComponentType<WordRotateRootProps>;
  const items = words ?? Children.toArray(children);
  const count = items.length;
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const safeIndex = count ? index % count : 0;
  const isPaused = paused || (pauseOnHover && hovered) || count < 2;

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setTimeout(() => {
      const next = (safeIndex + 1) % count;
      setIndex(next);
      onIndexChangeRef.current?.(next);
    }, interval);
    return () => window.clearTimeout(timer);
  }, [isPaused, interval, count, safeIndex]);

  // Measure the incoming item off-screen so the wrapper can glide to its
  // width while the items swap.
  useIsomorphicLayoutEffect(() => {
    if (!animateWidth) return;
    const node = measureRef.current;
    if (!node) return;
    // The observer reports once on observe, then on every size change
    // (such as a web font finishing loading).
    const observer = new ResizeObserver(() => setWidth(node.getBoundingClientRect().width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [animateWidth, safeIndex]);

  const motionSet = reduce ? REDUCED : VARIANTS[variant];
  const current = items[safeIndex];

  return (
    <Root
      className={cn("relative inline-flex", className)}
      onMouseEnter={pauseOnHover ? () => setHovered(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setHovered(false) : undefined}
    >
      {announce ? (
        <span className="sr-only" aria-live="polite">
          {current}
        </span>
      ) : (
        <span className="sr-only">
          {items.map((item, i) => (
            <span key={i}>
              {item}
              {i < count - 1 ? ", " : ""}
            </span>
          ))}
        </span>
      )}
      {animateWidth ? (
        <span
          ref={measureRef}
          aria-hidden="true"
          className={cn("pointer-events-none invisible absolute start-0 top-0 whitespace-nowrap", itemClassName)}
        >
          {current}
        </span>
      ) : null}
      <motion.span
        aria-hidden="true"
        className="relative inline-grid overflow-clip whitespace-nowrap"
        initial={false}
        animate={animateWidth && width !== null ? { width } : undefined}
        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      >
        <AnimatePresence initial={false}>
          <motion.span
            key={safeIndex}
            className={cn("col-start-1 row-start-1 inline-block", itemClassName)}
            initial={motionSet.initial}
            animate={motionSet.animate}
            exit={motionSet.exit}
            transition={
              reduce
                ? { duration: 0.2 }
                : variant === "slide"
                  ? SPRING_LAYOUT
                  : { duration: 0.45, ease: EASE_OUT }
            }
          >
            {current}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </Root>
  );
}
