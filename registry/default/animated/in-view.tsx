"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Transition,
  type UseInViewOptions,
  type Variants,
} from "motion/react";
import { Children, isValidElement, useRef, type ReactNode } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type InViewPreset = "fade" | "slide-up" | "slide-down" | "blur" | "scale";

type InViewTag = "div" | "section" | "article" | "header" | "footer" | "ul" | "ol" | "li" | "span" | "p";

export interface InViewProps {
  children: ReactNode;
  /** Element to render. Default "div". */
  as?: InViewTag;
  /** Entrance style. Default "blur" (fade, rise, and unblur). */
  preset?: InViewPreset;
  /** Custom variants with `hidden` and `visible` keys. Overrides `preset`. */
  variants?: Variants;
  /** Seconds between each direct child's entrance. 0 animates the wrapper as one. Default 0. */
  stagger?: number;
  /** Seconds before the entrance starts. Default 0. */
  delay?: number;
  /** Entrance duration in seconds. Default 0.6. */
  duration?: number;
  /** Animate only the first time the element enters. Default true. */
  once?: boolean;
  /** Fraction of the element that must be visible: "some", "all", or 0–1. Default 0.25. */
  amount?: UseInViewOptions["amount"];
  /** Root margin that grows or shrinks the viewport, like "0px 0px -10% 0px". */
  margin?: UseInViewOptions["margin"];
  className?: string;
  /** Classes for each wrapped child when `stagger` is set. */
  itemClassName?: string;
}

const PRESETS: Record<InViewPreset, Variants> = {
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  "slide-up": { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } },
  "slide-down": { hidden: { opacity: 0, y: -16 }, visible: { opacity: 1, y: 0 } },
  blur: {
    hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  scale: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
};

// Reduced motion keeps the entrance but drops movement, blur, and scale.
const REDUCED: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

export function InView({
  children,
  as = "div",
  preset = "blur",
  variants,
  stagger = 0,
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.25,
  margin,
  className,
  itemClassName,
}: InViewProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once, amount, margin });
  const itemVariants = reduce ? REDUCED : (variants ?? PRESETS[preset]);
  const itemTransition: Transition = { duration: reduce ? 0.2 : duration, ease: EASE_OUT };

  const Root = motion[as] as typeof motion.div;
  const ItemTag = as === "ul" || as === "ol" ? motion.li : motion.div;
  const animate = inView ? "visible" : "hidden";

  if (stagger > 0) {
    const groupVariants: Variants = {
      hidden: {},
      visible: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay } },
    };
    return (
      <Root
        ref={ref as React.Ref<HTMLDivElement>}
        data-slot="in-view"
        initial="hidden"
        animate={animate}
        variants={groupVariants}
        className={className}
      >
        {Children.map(children, (child, index) =>
          child == null || child === false ? null : (
            <ItemTag
              key={isValidElement(child) && child.key != null ? child.key : index}
              variants={itemVariants}
              transition={itemTransition}
              className={cn(itemClassName)}
            >
              {child}
            </ItemTag>
          ),
        )}
      </Root>
    );
  }

  return (
    <Root
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="in-view"
      initial="hidden"
      animate={animate}
      variants={itemVariants}
      transition={{ ...itemTransition, delay }}
      className={className}
    >
      {children}
    </Root>
  );
}
