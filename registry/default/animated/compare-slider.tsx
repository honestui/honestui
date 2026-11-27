"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type CompareSliderOrientation = "horizontal" | "vertical";

export interface CompareSliderProps {
  /** Shown on the start side of the divider: left, or top when vertical. */
  before: ReactNode;
  /** Shown on the end side of the divider: right, or bottom when vertical. */
  after: ReactNode;
  /** Divider position from 0 to 100, measured from the start side. Makes the slider controlled. */
  position?: number;
  /** Starting position when uncontrolled. Default 50. */
  defaultPosition?: number;
  /** Called with the new position while the divider moves. */
  onPositionChange?: (position: number) => void;
  /** Split side by side or top and bottom. Default "horizontal". */
  orientation?: CompareSliderOrientation;
  /** Chip in the start corner, such as "Before". Fades out as the divider covers it. */
  beforeLabel?: ReactNode;
  /** Chip in the end corner, such as "After". */
  afterLabel?: ReactNode;
  /** Follow a mouse without pressing. Touch and pen still drag. Default false. */
  hover?: boolean;
  /** Accessible name of the divider. Default "Comparison divider". */
  label?: string;
  /**
   * Text read for the divider's value. Defaults to how much of each side shows,
   * such as "60% Before, 40% After", using the labels when they are strings.
   */
  getValueText?: (position: number) => string;
  disabled?: boolean;
  className?: string;
  /** Classes for the divider handle. */
  handleClassName?: string;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const round = (value: number) => Math.round(value * 10) / 10;

/** Visible share of a corner chip: gone when the divider is within 8%, full past 20%. */
const chipOpacity = (distance: number) => Math.min(1, Math.max(0, (distance - 8) / 12));

export function CompareSlider({
  before,
  after,
  position,
  defaultPosition = 50,
  onPositionChange,
  orientation = "horizontal",
  beforeLabel,
  afterLabel,
  hover = false,
  label = "Comparison divider",
  getValueText,
  disabled = false,
  className,
  handleClassName,
}: CompareSliderProps) {
  const reduce = useReducedMotion() ?? false;
  const vertical = orientation === "vertical";
  const controlled = position !== undefined;
  const [internal, setInternal] = useState(() => clamp(defaultPosition));
  const value = clamp(controlled ? position : internal);

  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  // How the next value change should reach the screen: follow directly while
  // dragging, glide for a click or key press.
  const motionModeRef = useRef<"set" | "spring">("set");

  const shown = useMotionValue(value);
  const [chipValue, setChipValue] = useState(value);
  useMotionValueEvent(shown, "change", (latest) => setChipValue(latest));

  useEffect(() => {
    animationRef.current?.stop();
    if (reduce || motionModeRef.current === "set") {
      shown.set(value);
    } else {
      animationRef.current = animate(shown, value, SPRING_LAYOUT);
    }
    return () => animationRef.current?.stop();
  }, [value, reduce, shown]);

  const commit = useCallback(
    (next: number, mode: "set" | "spring") => {
      const clamped = round(clamp(next));
      motionModeRef.current = mode;
      if (!controlled) setInternal(clamped);
      onPositionChange?.(clamped);
    },
    [controlled, onPositionChange],
  );

  const positionFromPointer = (event: PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return value;
    return vertical
      ? ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100
      : ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    handleRef.current?.focus({ preventScroll: true });
    // A press away from the divider glides there; a press on it grabs in place.
    commit(positionFromPointer(event), "spring");
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const following = hover && event.pointerType === "mouse";
    if (!draggingRef.current && !following) return;
    commit(positionFromPointer(event), "set");
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    // Toward the end side: right and up for a horizontal split, down and right for a vertical one.
    const forward = vertical ? ["ArrowDown", "ArrowRight"] : ["ArrowRight", "ArrowUp"];
    const backward = vertical ? ["ArrowUp", "ArrowLeft"] : ["ArrowLeft", "ArrowDown"];
    let next: number | null = null;
    if (forward.includes(event.key)) next = value + step;
    else if (backward.includes(event.key)) next = value - step;
    else if (event.key === "PageUp") next = value + 10;
    else if (event.key === "PageDown") next = value - 10;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 100;
    if (next === null) return;
    event.preventDefault();
    commit(next, "spring");
  };

  const beforeName = typeof beforeLabel === "string" ? beforeLabel : "Before";
  const afterName = typeof afterLabel === "string" ? afterLabel : "After";
  const valueText = getValueText
    ? getValueText(value)
    : `${Math.round(value)}% ${beforeName}, ${100 - Math.round(value)}% ${afterName}`;

  const clipPath = useTransform(shown, (latest) =>
    vertical ? `inset(0 0 ${100 - latest}% 0)` : `inset(0 ${100 - latest}% 0 0)`,
  );
  const offset = useTransform(shown, (latest) => `${latest}%`);

  return (
    <div
      ref={rootRef}
      data-slot="compare-slider"
      data-orientation={orientation}
      data-disabled={disabled ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "relative isolate overflow-hidden rounded-xl bg-muted select-none",
        // Let the page keep scrolling across the split on touch screens.
        vertical ? "touch-pan-x" : "touch-pan-y",
        disabled ? "cursor-default" : vertical ? "cursor-row-resize" : "cursor-col-resize",
        className,
      )}
    >
      <div data-slot="compare-slider-after" className="relative size-full [&>img]:size-full [&>img]:object-cover">
        {after}
      </div>
      <motion.div
        data-slot="compare-slider-before"
        className="absolute inset-0 [&>img]:size-full [&>img]:object-cover"
        style={{ clipPath }}
      >
        {before}
      </motion.div>

      {beforeLabel ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md transition-opacity duration-150"
          style={{ opacity: chipOpacity(chipValue) }}
        >
          {beforeLabel}
        </span>
      ) : null}
      {afterLabel ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md transition-opacity duration-150",
            vertical ? "bottom-3 left-3" : "top-3 right-3",
          )}
          style={{ opacity: chipOpacity(100 - chipValue) }}
        >
          {afterLabel}
        </span>
      ) : null}

      <motion.div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-10 bg-white/90 shadow-[0_0_0_0.5px_rgb(0_0_0/0.25),0_0_12px_rgb(0_0_0/0.25)]",
          vertical ? "inset-x-0 h-0.5 -translate-y-1/2" : "inset-y-0 w-0.5 -translate-x-1/2",
        )}
        style={vertical ? { top: offset } : { left: offset }}
      />
      <motion.div
        ref={handleRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-orientation={orientation}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        data-slot="compare-slider-handle"
        className={cn(
          "absolute z-20 grid size-9 -translate-1/2 place-items-center rounded-full border border-white/70 bg-white/80 text-neutral-900 shadow-[0_2px_10px_rgb(0_0_0/0.22)] backdrop-blur-md outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
          vertical ? "left-1/2" : "top-1/2",
          handleClassName,
        )}
        style={vertical ? { top: offset } : { left: offset }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={cn("size-4", vertical && "rotate-90")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4.5 2.5 8 6 11.5M10 4.5 13.5 8 10 11.5" />
        </svg>
      </motion.div>
    </div>
  );
}
