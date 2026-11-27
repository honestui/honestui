"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type HoldToConfirmVariant = "default" | "destructive";
export type HoldToConfirmSize = "sm" | "md" | "lg";
type HoldPhase = "idle" | "holding" | "confirmed";

export interface HoldToConfirmProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    // Motion owns these names on a motion element, with different signatures.
    "children" | "onClick" | "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  /** The action, such as "Delete project". */
  children: ReactNode;
  /** Shown while the button is held. Defaults to the action label. */
  holdLabel?: ReactNode;
  /** Shown once the hold completes. Default "Done". */
  confirmedLabel?: ReactNode;
  /** Milliseconds the button must be held. Default 1200. */
  duration?: number;
  /** Called once when the hold completes. */
  onConfirm?: () => void;
  /** Visual style. "destructive" for actions that remove or cancel something. Default "default". */
  variant?: HoldToConfirmVariant;
  size?: HoldToConfirmSize;
  /**
   * Milliseconds the confirmed state stays before the button resets.
   * Pass `false` to keep it confirmed. Default 1600.
   */
  resetAfter?: number | false;
  /** Hidden instruction read with the button. Default "Press and hold to confirm". */
  hint?: string;
  /** Announced when the hold completes. Defaults to the confirmed label when it is text. */
  confirmedMessage?: string;
}

const SIZE_CLASS: Record<HoldToConfirmSize, string> = {
  sm: "h-8 rounded-lg px-3 text-[13px]",
  md: "h-9 rounded-[10px] px-4 text-sm",
  lg: "h-11 rounded-xl px-5 text-[15px]",
};

const BASE_CLASS: Record<HoldToConfirmVariant, string> = {
  default: "border border-border bg-background text-foreground hover:bg-muted/60",
  destructive:
    "border border-[color-mix(in_oklab,var(--hui-color-foreground-danger-primary)_32%,transparent)] bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-danger-primary)]",
};

// The fill is a second copy of the label on a solid surface, revealed from
// the left, so the text flips color exactly where the fill passes it.
const FILL_CLASS: Record<HoldToConfirmVariant, string> = {
  default: "bg-foreground text-background",
  destructive:
    "bg-[var(--hui-color-background-danger-emphasis)] text-[var(--hui-color-foreground-danger-emphasis)]",
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[1.1em] shrink-0" fill="none">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HoldToConfirm({
  children,
  holdLabel,
  confirmedLabel = "Done",
  duration = 1200,
  onConfirm,
  variant = "default",
  size = "md",
  resetAfter = 1600,
  hint = "Press and hold to confirm",
  confirmedMessage,
  disabled,
  className,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: HoldToConfirmProps) {
  const reduce = useReducedMotion();
  const hintId = useId();
  const [phase, setPhase] = useState<HoldPhase>("idle");
  const [announcement, setAnnouncement] = useState("");
  const progress = useMotionValue(0);
  const clip = useTransform(progress, (value) => `${(1 - value) * 100}%`);
  const clipPath = useMotionTemplate`inset(0 ${clip} 0 0)`;

  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const phaseRef = useRef<HoldPhase>("idle");
  const resetTimerRef = useRef<number | undefined>(undefined);
  const latestRef = useRef({ onConfirm, duration, resetAfter, confirmedMessage, confirmedLabel, reduce });

  useEffect(() => {
    latestRef.current = { onConfirm, duration, resetAfter, confirmedMessage, confirmedLabel, reduce };
  });

  const setPhaseBoth = useCallback((next: HoldPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const confirm = useCallback(() => {
    const latest = latestRef.current;
    setPhaseBoth("confirmed");
    progress.set(1);
    latest.onConfirm?.();
    const message =
      latest.confirmedMessage ?? (typeof latest.confirmedLabel === "string" ? latest.confirmedLabel : "Confirmed");
    // Clear first so the same message is announced again on a second confirm.
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 30);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {
        /* unsupported */
      }
    }
    if (latest.resetAfter !== false) {
      resetTimerRef.current = window.setTimeout(() => {
        setPhaseBoth("idle");
        controlsRef.current = latestRef.current.reduce
          ? (progress.set(0), null)
          : animate(progress, 0, { duration: 0.35, ease: EASE_OUT });
      }, latest.resetAfter);
    }
  }, [progress, setPhaseBoth]);

  const start = useCallback(() => {
    if (disabled || phaseRef.current !== "idle") return;
    setPhaseBoth("holding");
    controlsRef.current?.stop();
    const remaining = (1 - progress.get()) * latestRef.current.duration;
    // Linear on purpose: the fill is a timer, and an eased fill would misreport how long is left.
    controlsRef.current = animate(progress, 1, {
      duration: remaining / 1000,
      ease: "linear",
      onComplete: () => {
        if (phaseRef.current === "holding") confirm();
      },
    });
  }, [confirm, disabled, progress, setPhaseBoth]);

  const release = useCallback(() => {
    if (phaseRef.current !== "holding") return;
    setPhaseBoth("idle");
    controlsRef.current?.stop();
    if (latestRef.current.reduce) {
      progress.set(0);
      controlsRef.current = null;
      return;
    }
    // Rewind faster than it filled, so letting go feels like an undo.
    controlsRef.current = animate(progress, 0, {
      duration: Math.max(0.18, progress.get() * 0.45),
      ease: EASE_OUT,
    });
  }, [progress, setPhaseBoth]);

  useEffect(
    () => () => {
      controlsRef.current?.stop();
      window.clearTimeout(resetTimerRef.current);
    },
    [],
  );

  // A button disabled mid-hold lets go.
  useEffect(() => {
    if (disabled) release();
  }, [disabled, release]);

  const label = (current: HoldPhase) => {
    if (current === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1.5">
          <CheckIcon />
          {confirmedLabel}
        </span>
      );
    }
    if (current === "holding" && holdLabel) return holdLabel;
    return children;
  };

  const labelMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, y: 6, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -6, filter: "blur(4px)" },
        transition: { duration: 0.2, ease: EASE_OUT },
      };

  // Every label sits in one grid cell, so the button keeps the width of the
  // longest one and never changes size under the pointer.
  const layer = (current: HoldPhase, interactive: boolean) => (
    <span className="grid items-center justify-items-center">
      {[children, holdLabel, confirmedLabel].map((item, index) =>
        item ? (
          <span key={index} aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
            {index === 2 ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon />
                {item}
              </span>
            ) : (
              item
            )}
          </span>
        ) : null,
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current === "holding" && !holdLabel ? "idle" : current}
          className="col-start-1 row-start-1 whitespace-nowrap"
          aria-hidden={interactive ? undefined : true}
          {...labelMotion}
        >
          {label(current)}
        </motion.span>
      </AnimatePresence>
    </span>
  );

  return (
    <>
      <motion.button
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        data-state={phase}
        whileTap={reduce || disabled ? undefined : { scale: 0.985 }}
        transition={SPRING_PRESS}
        className={cn(
          "relative isolate inline-flex select-none items-center justify-center overflow-hidden font-medium transition-colors [-webkit-touch-callout:none] [touch-action:manipulation]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          BASE_CLASS[variant],
          SIZE_CLASS[size],
          className,
        )}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || event.button !== 0) return;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Synthetic or already-released pointers cannot be captured; the hold still works.
          }
          start();
        }}
        onPointerMove={(event: PointerEvent<HTMLButtonElement>) => {
          if (phaseRef.current !== "holding") return;
          // Sliding off the button lets go, like moving off a native button cancels its click.
          const rect = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < rect.left - 8 ||
            event.clientX > rect.right + 8 ||
            event.clientY < rect.top - 8 ||
            event.clientY > rect.bottom + 8;
          if (outside) release();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (event.key !== " " && event.key !== "Enter") return;
          // Stop the native click; holding the key is the action.
          event.preventDefault();
          if (!event.repeat) start();
        }}
        onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyUp?.(event);
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            release();
          }
        }}
        onBlur={(event) => {
          onBlur?.(event);
          release();
        }}
        onClick={(event) => event.preventDefault()}
        {...props}
      >
        {layer(phase, true)}
        <motion.span
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 flex items-center justify-center", FILL_CLASS[variant])}
          style={{ clipPath, WebkitClipPath: clipPath }}
        >
          {layer(phase, false)}
        </motion.span>
      </motion.button>
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}

export default HoldToConfirm;
