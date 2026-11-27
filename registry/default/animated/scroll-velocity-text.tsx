"use client";

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

export interface ScrollVelocityTextProps {
  /** Rows of text. Each child is one row when `rows` is omitted. */
  rows?: ReactNode[];
  children?: ReactNode;
  /** Resting speed in CSS pixels per second. Rows alternate direction. Default 60. */
  velocity?: number;
  /** How much scrolling speeds the rows up. 0 ignores scrolling. Default 4. */
  scrollFactor?: number;
  /** Largest lean in degrees while scrolling fast. 0 keeps text upright. Default 8. */
  skew?: number;
  /** Placed between repeats of a row. Default a small dot. */
  separator?: ReactNode;
  /** Element whose scrolling drives the effect. Defaults to the nearest scrolling ancestor, or the page. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Hold the rows still while the pointer is over them. Default false. */
  pauseOnHover?: boolean;
  className?: string;
  rowClassName?: string;
}

/** The nearest ancestor that scrolls vertically, or null for the page. */
function findScrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (parent === document.body || parent === document.documentElement) return null;
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
  }
  return null;
}

const wrap = (min: number, max: number, value: number) => {
  const range = max - min;
  return range === 0 ? min : ((((value - min) % range) + range) % range) + min;
};

function Row({
  children,
  separator,
  direction,
  velocity,
  boost,
  skewX,
  shouldRun,
  className,
}: {
  children: ReactNode;
  separator: ReactNode;
  direction: 1 | -1;
  velocity: number;
  boost: MotionValue<number>;
  skewX: MotionValue<number>;
  shouldRun: () => boolean;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ copyWidth: 0, copies: 2 });
  const offset = useMotionValue(0);
  const x = useTransform(offset, (value) => `${wrap(-layout.copyWidth, 0, value)}px`);

  // Repeat the row enough times to cover the viewport plus one copy, so the
  // wrap point never shows an empty gap.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const copy = copyRef.current;
    if (!viewport || !copy) return;
    const measure = () => {
      const copyWidth = copy.getBoundingClientRect().width;
      const width = viewport.getBoundingClientRect().width;
      const copies = copyWidth > 0 ? Math.min(40, Math.max(2, Math.ceil(width / copyWidth) + 1)) : 2;
      setLayout((current) =>
        current.copyWidth === copyWidth && current.copies === copies ? current : { copyWidth, copies },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (layout.copyWidth === 0 || !shouldRun()) return;
    const step = Math.min(delta, 64) / 1000;
    offset.set(offset.get() - direction * velocity * step * (1 + Math.abs(boost.get())));
  });

  const content = (
    <>
      {children}
      <span className="inline-flex items-center px-[0.4em]">{separator}</span>
    </>
  );

  return (
    <div ref={viewportRef} className="overflow-hidden whitespace-nowrap">
      <motion.div className="flex w-max will-change-transform" style={{ x, skewX }}>
        {Array.from({ length: layout.copies }, (_, index) => (
          <div
            key={index}
            ref={index === 0 ? copyRef : undefined}
            className={cn("flex shrink-0 items-center", className)}
          >
            {content}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Rows of large text that drift sideways and speed up and lean while the page
 * scrolls, then ease back. Screen readers get each row once; the moving
 * copies are hidden from them. With reduced motion each row is still.
 */
export function ScrollVelocityText({
  rows,
  children,
  velocity = 60,
  scrollFactor = 4,
  skew = 8,
  separator = <span aria-hidden="true" className="inline-block size-[0.18em] rounded-full bg-current opacity-40" />,
  scrollContainer,
  pauseOnHover = false,
  className,
  rowClassName,
}: ScrollVelocityTextProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const items = rows ?? Children.toArray(children);
  const inView = useInView(rootRef);
  const hovered = useRef(false);
  const stateRef = useRef({ inView, pauseOnHover });
  useEffect(() => {
    stateRef.current = { inView, pauseOnHover };
  });
  const shouldRun = () => stateRef.current.inView && !(stateRef.current.pauseOnHover && hovered.current);

  // Scroll speed in pixels per second, from the given container, the nearest
  // scrolling ancestor, or the page. It drops back to 0 shortly after
  // scrolling stops, and the spring eases the rows back to their resting pace.
  const scrollVelocity = useMotionValue(0);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduceMotion) return;
    const element = scrollContainer?.current ?? findScrollParent(root);
    const target: HTMLElement | Window = element ?? window;
    const read = () => (element ? element.scrollTop : window.scrollY);
    let lastY = read();
    let lastTime = performance.now();
    let settle = 0;
    const onScroll = () => {
      const now = performance.now();
      const y = read();
      const elapsed = Math.max(now - lastTime, 8) / 1000;
      scrollVelocity.set((y - lastY) / elapsed);
      lastY = y;
      lastTime = now;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => scrollVelocity.set(0), 90);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
    };
  }, [scrollContainer, reduceMotion, scrollVelocity]);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [-1000, 0, 1000], [-scrollFactor, 0, scrollFactor], { clamp: false });
  const skewX = useTransform(smooth, [-2500, 0, 2500], [skew, 0, -skew]);

  // The large text sizes set line-height 1, which leaves descenders (g, p, y) below the line
  // box, where the clipping viewport would cut them. A taller line box keeps them whole.
  const rowClass = cn("text-5xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-6xl sm:leading-[1.2]", rowClassName);

  return (
    <div
      ref={rootRef}
      data-slot="scroll-velocity-text"
      // Inline-size containment: the repeated text must never widen the component, or
      // measuring the row would add copies that widen it further.
      className={cn("flex w-full min-w-0 flex-col gap-2 overflow-hidden [contain:inline-size]", className)}
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      {/* Each row once, in reading order, for assistive technology. */}
      <div className="sr-only">
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are static slots.
          <p key={index}>{item}</p>
        ))}
      </div>
      {reduceMotion ? (
        <div aria-hidden="true" className="flex flex-col gap-2">
          {items.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are static slots.
            <div key={index} className={cn("truncate", rowClass)}>
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="flex flex-col gap-2">
          {items.map((item, index) => (
            <Row
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are static slots.
              key={index}
              direction={index % 2 === 0 ? 1 : -1}
              velocity={velocity}
              boost={boost}
              skewX={skewX}
              shouldRun={shouldRun}
              separator={separator}
              className={rowClass}
            >
              {item}
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}
