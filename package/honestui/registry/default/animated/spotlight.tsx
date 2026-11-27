"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { SPRING_MOUSE } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

type PointerListener = (point: { x: number; y: number } | null) => void;

type SpotlightContextValue = {
  subscribe: (listener: PointerListener) => () => void;
  size: number;
  borderColor: string;
  fillColor: string;
  enabled: boolean;
};

const SpotlightContext = createContext<SpotlightContextValue | null>(null);

// Fades the container glow out toward every edge, so the light never ends in a
// hard line where the container stops.
const EDGE_FADE = "linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent)";
const EDGE_FADE_Y = "linear-gradient(to bottom, transparent, #000 32px, #000 calc(100% - 32px), transparent)";
const GLOW_MASK: CSSProperties = {
  maskImage: `${EDGE_FADE}, ${EDGE_FADE_Y}`,
  maskComposite: "intersect",
  WebkitMaskImage: `${EDGE_FADE}, ${EDGE_FADE_Y}`,
  WebkitMaskComposite: "source-in",
};

export interface SpotlightProps {
  children?: ReactNode;
  className?: string;
  /** Diameter of the glow in px. Default 420. */
  size?: number;
  /** Glow color on the container surface. Any CSS color. */
  color?: string;
  /** Color of the border light on `SpotlightCard`s. Any CSS color. */
  borderColor?: string;
  /** Faint fill inside a `SpotlightCard` under the pointer. Any CSS color. */
  cardColor?: string;
  /** Show the glow on the container surface. Turn off to light only card borders. Default true. */
  glow?: boolean;
}

/**
 * A soft light that follows the pointer across a container. Cards inside it
 * (`SpotlightCard`) light up along the part of their border nearest the
 * pointer, even before the pointer reaches them, so a grid reads as one lit
 * surface. Decorative only: off on touch devices and under reduced motion.
 */
export function Spotlight({
  children,
  className,
  size = 420,
  color = "color-mix(in oklab, var(--foreground) 7%, transparent)",
  borderColor = "color-mix(in oklab, var(--foreground) 60%, transparent)",
  cardColor = "color-mix(in oklab, var(--foreground) 4%, transparent)",
  glow = true,
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const enabled = canHover && !reduce;

  const listeners = useRef(new Set<PointerListener>());
  const subscribe = useCallback((listener: PointerListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const sx = useSpring(x, SPRING_MOUSE);
  const sy = useSpring(y, SPRING_MOUSE);
  const sOpacity = useSpring(opacity, { stiffness: 200, damping: 30 });
  const background = useMotionTemplate`radial-gradient(${size / 2}px circle at ${sx}px ${sy}px, ${color}, transparent 70%)`;

  const frame = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  const flush = useCallback(() => {
    frame.current = 0;
    for (const listener of listeners.current) listener(last.current);
  }, []);

  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    if (opacity.get() === 0) {
      // Enter at the pointer instead of sliding in from the last exit point.
      sx.jump(localX);
      sy.jump(localY);
    }
    x.set(localX);
    y.set(localY);
    opacity.set(1);
    last.current = { x: event.clientX, y: event.clientY };
    schedule();
  };

  const onPointerLeave = () => {
    opacity.set(0);
    last.current = null;
    schedule();
  };

  const value = useMemo(
    () => ({ subscribe, size, borderColor, fillColor: cardColor, enabled }),
    [subscribe, size, borderColor, cardColor, enabled],
  );

  return (
    <SpotlightContext.Provider value={value}>
      <div
        ref={ref}
        data-slot="spotlight"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className={cn("relative isolate", className)}
      >
        {glow && enabled ? (
          <motion.div
            aria-hidden
            style={{ ...GLOW_MASK, background, opacity: sOpacity }}
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          />
        ) : null}
        {children}
      </div>
    </SpotlightContext.Provider>
  );
}

export interface SpotlightCardProps {
  children?: ReactNode;
  className?: string;
}

// Shows only the 1px border box of the overlay: the padding box is cut out.
const BORDER_MASK: CSSProperties = {
  padding: 1,
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
};

/** A card whose border catches the light of the surrounding `Spotlight`. */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const context = useContext(SpotlightContext);
  const ref = useRef<HTMLDivElement>(null);
  // The light layers sit at -z-10 inside the card's own stacking context:
  // above its fill and border, below its content.
  const borderRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!context?.enabled) return;
    return context.subscribe((point) => {
      const card = ref.current;
      if (!card) return;
      const layers = [borderRef.current, fillRef.current];
      if (!point) {
        for (const layer of layers) if (layer) layer.style.opacity = "0";
        return;
      }
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spotlight-x", `${point.x - rect.left}px`);
      card.style.setProperty("--spotlight-y", `${point.y - rect.top}px`);
      for (const layer of layers) if (layer) layer.style.opacity = "1";
    });
  }, [context]);

  const radius = (context?.size ?? 420) / 2;
  // The border light reaches the full radius so edges a little away from the
  // pointer still catch it; the fill fades sooner so it stays a soft wash.
  const gradient = (color: string, reach: number) =>
    `radial-gradient(${radius}px circle at var(--spotlight-x, -999px) var(--spotlight-y, -999px), ${color}, transparent ${reach}%)`;

  return (
    <div ref={ref} data-slot="spotlight-card" className={cn("relative isolate rounded-xl border border-border bg-card", className)}>
      {context?.enabled ? (
        <>
          <div
            ref={fillRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300"
            style={{ background: gradient(context.fillColor, 70) }}
          />
          <div
            ref={borderRef}
            aria-hidden
            className="pointer-events-none absolute -inset-px -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300"
            style={{ ...BORDER_MASK, background: gradient(context.borderColor, 100) }}
          />
        </>
      ) : null}
      {children}
    </div>
  );
}
