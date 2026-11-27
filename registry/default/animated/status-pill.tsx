"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type StatusPillTone = "neutral" | "info" | "success" | "warning" | "danger" | "recording";
export type StatusPillAppearance = "soft" | "solid";
export type StatusPillSize = "sm" | "md";

export interface StatusPillProps {
  /**
   * Identifies the current state. When it changes, the content morphs to the
   * new state and the label is announced. Defaults to the label when it is text.
   */
  status?: string;
  /** What is happening, such as "Recording" or "Saved". */
  label: ReactNode;
  /** Secondary text after the label, such as a timer. Updates in place and is not announced. */
  detail?: ReactNode;
  /** Color of the pill. "recording" adds a pulsing red dot. Default "neutral". */
  tone?: StatusPillTone;
  /** "soft" tints the surface; "solid" fills it. Default "soft". */
  appearance?: StatusPillAppearance;
  /** Leading icon. Overrides the tone's default icon. Pass `null` for none. */
  icon?: ReactNode;
  /** Shows a small spinner in place of the icon. */
  busy?: boolean;
  /** Shows a pulsing dot in place of the icon. On by default for "recording". */
  live?: boolean;
  size?: StatusPillSize;
  /** Announce label changes through a polite live region. Default true. */
  announce?: boolean;
  /** Text announced for this state when the label is not plain text. */
  announcement?: string;
  className?: string;
}

const SOFT: Record<StatusPillTone, string> = {
  neutral: "border-border bg-muted/60 text-foreground",
  info: "border-[color-mix(in_oklab,var(--hui-color-foreground-accent-primary)_22%,transparent)] bg-[var(--hui-color-background-accent-primary)] text-[var(--hui-accent-11)]",
  success:
    "border-[color-mix(in_oklab,var(--hui-color-foreground-success-primary)_22%,transparent)] bg-[var(--hui-color-background-success-primary)] text-[var(--hui-success-11)]",
  warning:
    "border-[color-mix(in_oklab,var(--hui-color-foreground-attention-primary)_24%,transparent)] bg-[var(--hui-color-background-attention-primary)] text-[var(--hui-attention-12)]",
  danger:
    "border-[color-mix(in_oklab,var(--hui-color-foreground-danger-primary)_22%,transparent)] bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-danger-12)]",
  recording: "border-border bg-muted/60 text-foreground",
};

const SOLID: Record<StatusPillTone, string> = {
  neutral: "border-transparent bg-foreground text-background",
  info: "border-transparent bg-[var(--hui-color-background-accent-emphasis)] text-[var(--hui-color-foreground-accent-emphasis)]",
  success:
    "border-transparent bg-[var(--hui-color-background-success-emphasis)] text-[var(--hui-color-foreground-success-emphasis)]",
  warning:
    "border-transparent bg-[var(--hui-color-background-attention-emphasis)] text-[var(--hui-color-foreground-attention-emphasis)]",
  danger:
    "border-transparent bg-[var(--hui-color-background-danger-emphasis)] text-[var(--hui-color-foreground-danger-emphasis)]",
  recording: "border-transparent bg-foreground text-background",
};

const SIZE_CLASS: Record<StatusPillSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5",
  md: "h-8 px-3 text-[13px] gap-2",
};

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0">
      {children}
    </svg>
  );
}

const TONE_ICON: Partial<Record<StatusPillTone, ReactNode>> = {
  success: (
    <Glyph>
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  ),
  warning: (
    <Glyph>
      <path d="M8 4.5v4.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="1" fill="currentColor" />
    </Glyph>
  ),
  danger: (
    <Glyph>
      <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Glyph>
  ),
};

function PulseDot({ reduce, recording }: { reduce: boolean; recording: boolean }) {
  return (
    <span aria-hidden="true" className="relative grid size-3.5 shrink-0 place-items-center">
      {!reduce && (
        <motion.span
          className={cn(
            "absolute size-2 rounded-full",
            recording ? "bg-[#ef4444]" : "bg-current",
          )}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
        />
      )}
      <span className={cn("relative size-2 rounded-full", recording ? "bg-[#ef4444]" : "bg-current")} />
    </span>
  );
}

function Spinner({ reduce }: { reduce: boolean }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5 shrink-0"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={reduce ? undefined : { duration: 0.9, ease: "linear", repeat: Infinity }}
    >
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.8" />
      <path d="M13.5 8A5.5 5.5 0 0 0 8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </motion.svg>
  );
}

export function StatusPill({
  status,
  label,
  detail,
  tone = "neutral",
  appearance = "soft",
  icon,
  busy = false,
  live,
  size = "md",
  announce = true,
  announcement,
  className,
}: StatusPillProps) {
  const reduce = useReducedMotion() ?? false;
  const key = status ?? (typeof label === "string" ? label : "status");
  const spoken = announcement ?? (typeof label === "string" ? label : undefined);
  const showDot = live ?? tone === "recording";

  const contentRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number>();

  // Measure the incoming content so the pill glides to its width; the
  // outgoing content is taken out of flow while it leaves.
  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const measure = () => {
      const next = node.getBoundingClientRect().width;
      if (next > 0) setWidth((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [key]);

  let leading: ReactNode = null;
  if (busy) leading = <Spinner reduce={reduce} />;
  else if (icon !== undefined) leading = icon;
  else if (showDot) leading = <PulseDot reduce={reduce} recording={tone === "recording"} />;
  else leading = TONE_ICON[tone] ?? null;

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
        transition: { duration: 0.22, ease: EASE_OUT },
      };

  return (
    <span data-slot="status-pill" data-tone={tone} data-status={key} className="inline-flex align-middle">
      <motion.span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full border font-medium shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors duration-300",
          appearance === "solid" ? SOLID[tone] : SOFT[tone],
          SIZE_CLASS[size],
          className,
        )}
        initial={false}
        animate={width === undefined ? undefined : { width: width + (size === "sm" ? 20 : 24) + 2 }}
        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={key}
            ref={contentRef}
            aria-hidden="true"
            className="inline-flex shrink-0 items-center gap-[inherit] whitespace-nowrap"
            {...enter}
          >
            {leading}
            <span>{label}</span>
            {detail != null && detail !== false ? (
              <span className="tabular-nums opacity-70">{detail}</span>
            ) : null}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      {/* Read the state once; the visible copy above is decorative motion. */}
      <span className="sr-only">
        {announce && spoken ? null : label}
        {detail != null && detail !== false ? <> {detail}</> : null}
      </span>
      {announce && spoken ? (
        <span className="sr-only" role="status" aria-live="polite">
          {spoken}
        </span>
      ) : null}
    </span>
  );
}

export default StatusPill;
