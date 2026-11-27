"use client";

import { motion, useReducedMotion, type PanInfo, type TargetAndTransition, type Transition } from "motion/react";
import { ChevronLeft, ChevronRight } from "honestui/icons";
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

export interface CardStackProps<T = unknown> {
  /** Data for each card. Rendered with `renderItem`. Children are used when omitted. */
  items?: readonly T[];
  /** Renders one card's content from its item. */
  renderItem?: (item: T, index: number) => ReactNode;
  /** One child per card, when `items` is not used. */
  children?: ReactNode;
  /** The card on top, for a controlled stack. */
  index?: number;
  /** The card on top at first. Default 0. */
  defaultIndex?: number;
  /** Called with the new top card's index. */
  onIndexChange?: (index: number) => void;
  /** Go from the last card back to the first. Default true. */
  loop?: boolean;
  /** Milliseconds between automatic moves. 0 turns it off. Default 0. */
  autoplay?: number;
  /** Fan the cards apart while the pointer is over the stack. Default true. */
  fan?: boolean;
  /** How many cards peek out behind the top one. Default 2. */
  depth?: number;
  /** Show previous and next buttons and the position. Default true. */
  controls?: boolean;
  /** Accessible name for the stack. Default "Cards". */
  label?: string;
  className?: string;
  /** Class for every card. */
  cardClassName?: string;
}

/** The direction of the last move: 1 sends the top card to the back, -1 brings the back card forward. */
type Move = { dir: 1 | -1; card: number; id: number; phase: "out" | "in" };

const MOVE_SECONDS = 0.62;
/** Share of the move spent lifting the card out to the side, before it tucks into place. */
const MOVE_SPLIT = 0.42;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const SWIPE_DISTANCE = 0.28;
const SWIPE_VELOCITY = 450;

export function CardStack<T = unknown>({
  items,
  renderItem,
  children,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  loop = true,
  autoplay = 0,
  fan = true,
  depth = 2,
  controls = true,
  label = "Cards",
  className,
  cardClassName,
}: CardStackProps<T>) {
  const cards = items
    ? items.map((item, i) => (renderItem ? renderItem(item, i) : (item as ReactNode)))
    : Children.toArray(children);
  const count = cards.length;
  const reduce = useReducedMotion() ?? false;
  const canHover = useHoverCapable();
  const id = useId();

  const [innerIndex, setInnerIndex] = useState(defaultIndex);
  const rawIndex = indexProp ?? innerIndex;
  const active = count ? Math.min(Math.max(rawIndex, 0), count - 1) : 0;

  const [move, setMove] = useState<Move | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announced, setAnnounced] = useState(false);
  const [width, setWidth] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const moveId = useRef(0);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  useIsomorphicLayoutEffect(() => {
    const node = deckRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setWidth(node.getBoundingClientRect().width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const canPrev = count > 1 && (loop || active > 0);
  const canNext = count > 1 && (loop || active < count - 1);

  const go = useCallback(
    (dir: 1 | -1, fromUser: boolean) => {
      if (count < 2) return;
      if (!loop && (dir === 1 ? active >= count - 1 : active <= 0)) return;
      const next = (active + dir + count) % count;
      moveId.current += 1;
      // Going forward animates the card leaving the top; going back animates the one arriving.
      setMove({ dir, card: dir === 1 ? active : next, id: moveId.current, phase: "out" });
      setAnnounced(fromUser);
      if (indexProp === undefined) setInnerIndex(next);
      onIndexChangeRef.current?.(next);
    },
    [active, count, indexProp, loop],
  );

  // Halfway through a move the card changes layer: a leaving card drops behind the deck,
  // an arriving card rises above it.
  const moveKey = move?.id;
  useEffect(() => {
    if (moveKey === undefined) return;
    const timer = window.setTimeout(
      () => setMove((current) => (current?.id === moveKey ? { ...current, phase: "in" } : current)),
      MOVE_SECONDS * MOVE_SPLIT * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [moveKey]);

  // Autoplay holds while the pointer or focus is in the stack, for reduced motion, and in a hidden tab.
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const autoplayOn = autoplay > 0 && !reduce && !hovered && !focused && pageVisible && canNext;
  useEffect(() => {
    if (!autoplayOn) return;
    const timer = window.setTimeout(() => go(1, false), autoplay);
    return () => window.clearTimeout(timer);
  }, [autoplayOn, autoplay, go, active]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1, true);
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const distance = Math.abs(info.offset.x);
    const fast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    if (distance < Math.max(width * SWIPE_DISTANCE, 60) && !fast) return;
    // Swiping left sends the card away and shows the next one, like turning a page.
    go(info.offset.x < 0 ? 1 : -1, true);
  };

  const fanned = fan && hovered && canHover && !reduce;
  const swipe = Math.max(width * 0.62, 160);
  const spread = Math.min(30, width * 0.07);

  const place = (pos: number): TargetAndTransition => {
    if (reduce) return { x: 0, y: 0, scale: 1, rotate: 0, opacity: pos === 0 ? 1 : 0 };
    if (pos < 0) return { x: -swipe, y: 0, scale: 0.96, rotate: -6, opacity: 0 };
    const shown = Math.min(pos, depth);
    const opacity = pos > depth ? 0 : 1 - shown * 0.12;
    if (fanned) {
      return { x: shown * spread, y: -shown * 6, scale: 1 - shown * 0.04, rotate: shown * 3.5, opacity };
    }
    return { x: 0, y: -shown * 14, scale: 1 - shown * 0.06, rotate: 0, opacity };
  };

  // Where each card sits relative to the top: 0 is on top, then 1, 2, … behind it.
  // Without looping, cards before the top one have been dealt away (negative).
  const positionOf = (i: number) => (loop ? (i - active + count) % count : i - active);

  const status = count ? `${active + 1} of ${count}` : "";

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("flex w-full flex-col items-center gap-5", className)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div
        ref={deckRef}
        id={id}
        tabIndex={0}
        aria-label={`${label}, ${status}. Use the left and right arrow keys to move through the cards.`}
        className="relative grid w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{ paddingTop: reduce ? 0 : depth * 14 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {cards.map((card, i) => {
          const pos = positionOf(i);
          const top = pos === 0;
          const target = place(pos);
          const z = pos < 0 ? 0 : count - pos;
          const moving = move !== null && move.card === i && !reduce;

          let animate: TargetAndTransition = target;
          // While a card is out to the side it sits above the deck when leaving and below it when arriving.
          const zIndex = moving ? ((move.phase === "out") === (move.dir === 1) ? count + 1 : 0) : z;
          let transition: Transition = reduce ? { duration: 0.2, ease: EASE_OUT } : SPRING_LAYOUT;
          if (moving && loop) {
            // Lift the card out to the side above the deck, then tuck it into its new place.
            const side = move.dir === 1 ? -swipe : swipe * 0.9;
            const rotate = move.dir === 1 ? -8 : 8;
            animate = {
              x: [null, side, target.x as number],
              y: [null, -8, target.y as number],
              rotate: [null, rotate, target.rotate as number],
              scale: [null, 0.98, target.scale as number],
              opacity: [null, 1, target.opacity as number],
            };
            transition = { duration: MOVE_SECONDS, times: [0, MOVE_SPLIT, 1], ease: [EASE_OUT, EASE_OUT] };
          }

          return (
            <motion.div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={top ? undefined : true}
              inert={!top}
              className={cn(
                "col-start-1 row-start-1 w-full origin-bottom touch-pan-y rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm",
                top && count > 1 && !reduce && "cursor-grab active:cursor-grabbing",
                cardClassName,
              )}
              style={{ zIndex: moving && loop ? zIndex : z }}
              initial={false}
              animate={animate}
              transition={transition}
              drag={top && count > 1 && !reduce ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              dragSnapToOrigin={false}
              onDragEnd={top ? onDragEnd : undefined}
              onAnimationComplete={() => {
                if (moving) setMove((current) => (current?.id === move.id ? null : current));
              }}
            >
              {/* Cards behind the top one stay blank, so their text never peeks out around it. */}
              <div
                className={cn(
                  "flex flex-1 flex-col transition-opacity duration-300 ease-out motion-reduce:transition-none",
                  !top && !moving && "opacity-0",
                )}
              >
                {card}
              </div>
            </motion.div>
          );
        })}
      </div>

      {controls && count > 1 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous card"
            aria-controls={id}
            disabled={!canPrev}
            onClick={() => go(-1, true)}
            className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span aria-hidden="true" className="min-w-12 text-center text-sm text-muted-foreground tabular-nums">
            {active + 1} / {count}
          </span>
          <button
            type="button"
            aria-label="Next card"
            aria-controls={id}
            disabled={!canNext}
            onClick={() => go(1, true)}
            className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Only moves people make are announced; automatic ones stay quiet. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announced ? `Card ${status}` : ""}
      </span>
    </section>
  );
}
