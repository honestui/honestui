"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface NumberTickerProps {
  value: number;
  /** Digits to pad to (left). */
  pad?: number;
  /** Per-digit roll duration in seconds. */
  duration?: number;
  /** Stagger between digits. */
  stagger?: number;
  /** Render only after the element enters the viewport. */
  startOnView?: boolean;
  prefix?: string;
  suffix?: string;
  /** Add a small blur during digit rolls. */
  blur?: boolean;
  className?: string;
  digitClassName?: string;
  /** Insert locale group separators (commas). Server-component safe. */
  locale?: boolean;
  /**
   * Fixed number of decimal places. The value is rounded to this many places
   * and every place, including fractional ones, rolls independently.
   * Default 0, which rounds to an integer.
   */
  decimals?: number;
  /**
   * Intl.NumberFormat options, such as `{ notation: "compact" }` or
   * `{ style: "percent" }`. Applied to the absolute value; the sign is drawn
   * separately so it can fade in and out. Pass `locales` with it to keep
   * server and client output identical.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** BCP 47 locale(s) for `locale` and `formatOptions`. */
  locales?: string | string[];
  /** Custom formatter. Client-only — server components must use `locale` instead. */
  format?: (value: number) => string;
}

const DIGIT_HEIGHT_EM = 1.1;
const DIGITS = Array.from({ length: 10 }, (_, n) => n);

export function NumberTicker({
  value,
  pad,
  duration = 0.9,
  stagger = 0.04,
  startOnView = true,
  prefix,
  suffix,
  blur = false,
  className,
  digitClassName,
  locale,
  decimals = 0,
  formatOptions,
  locales,
  format,
}: NumberTickerProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.6 });
  const armed = !startOnView || inView;

  // The sign is rendered apart from the digits: it fades in and out instead of
  // shifting every place value one slot when a value crosses zero.
  const places = Math.max(0, Math.floor(decimals));
  const factor = 10 ** places;
  const rounded = Math.round(value * factor) / factor;
  const negative = rounded < 0;
  const text = useMemo(() => {
    const magnitude = Math.abs(rounded);
    let formatted: string;
    if (format) {
      formatted = format(magnitude);
    } else if (formatOptions || locales) {
      // `decimals` only fills in fraction digits the options leave unset;
      // mixing the two could ask Intl for a minimum above the maximum.
      const ownsFraction =
        formatOptions?.minimumFractionDigits !== undefined ||
        formatOptions?.maximumFractionDigits !== undefined;
      formatted = new Intl.NumberFormat(locales, {
        ...(ownsFraction
          ? null
          : { minimumFractionDigits: places, maximumFractionDigits: places }),
        useGrouping: locale ?? true,
        ...formatOptions,
      }).format(magnitude);
    } else if (locale) {
      formatted = magnitude.toLocaleString(undefined, {
        minimumFractionDigits: places,
        maximumFractionDigits: places,
      });
    } else {
      formatted = magnitude.toFixed(places);
    }
    if (!pad) return formatted;
    // Pad the integer part only, so decimals keep their places.
    const [whole, ...rest] = formatted.split(".");
    return [whole.padStart(pad, "0"), ...rest].join(".");
  }, [rounded, places, pad, format, formatOptions, locales, locale]);
  const glyphs = useMemo(() => {
    const chars = text.split("");
    // Key by place value (position from the right): a changing digit keeps its
    // identity and rolls to the new value instead of remounting and replaying
    // from 0. Growing numbers add glyphs on the left without re-keying the
    // ones, tens, hundreds already on screen.
    return chars.map((char, i) => ({ char, id: `g-${chars.length - 1 - i}` }));
  }, [text]);
  const readableText = `${negative ? "-" : ""}${prefix ?? ""}${text}${suffix ?? ""}`;

  // Stagger is an entrance flourish. Once the reveal has played, value
  // changes roll every digit immediately — a per-digit delay on live updates
  // reads as lag.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!armed || entered) return;
    const total = (duration + glyphs.length * stagger) * 1000;
    const t = window.setTimeout(() => setEntered(true), total);
    return () => window.clearTimeout(t);
  }, [armed, entered, duration, stagger, glyphs.length]);

  return (
    <span
      ref={containerRef}
      className={cn("inline-flex items-center tabular-nums", className)}
    >
      <span className="sr-only">{readableText}</span>
      <span aria-hidden="true" className="inline-flex items-center">
        <AnimatePresence initial={false}>
          {negative ? <Sign key="sign" /> : null}
        </AnimatePresence>
        {prefix ? <span>{prefix}</span> : null}
        {glyphs.map(({ char, id }, i) => {
          const isDigit = /\d/.test(char);
          if (!isDigit) {
            return (
              <span key={id} className="inline-block">
                {char}
              </span>
            );
          }
          const digit = Number(char);
          return (
            <Digit
              key={id}
              digit={armed ? digit : 0}
              delay={entered ? 0 : i * stagger}
              duration={duration}
              blur={blur}
              className={digitClassName}
            />
          );
        })}
        {suffix ? <span>{suffix}</span> : null}
      </span>
    </span>
  );
}

function Digit({
  digit,
  delay,
  duration,
  blur,
  className,
}: {
  digit: number;
  delay: number;
  duration: number;
  blur: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const columnRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce || !blur || !columnRef.current || !Number.isFinite(digit)) {
      return;
    }

    const node = columnRef.current;
    const controls = animate(
      node,
      { filter: ["blur(10px)", "blur(0px)"] },
      {
        duration: Math.min(duration * 0.75, 0.32),
        delay,
        ease: EASE_OUT,
      },
    );

    return () => {
      controls.stop();
      node.style.filter = "blur(0px)";
    };
  }, [blur, delay, digit, duration, reduce]);

  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      style={{ height: `${DIGIT_HEIGHT_EM}em`, width: "1ch" }}
    >
      <motion.span
        ref={columnRef}
        initial={{ y: 0 }}
        animate={{ y: `-${digit * DIGIT_HEIGHT_EM}em` }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration, delay, ease: EASE_OUT }
        }
        className="absolute inset-x-0 top-0 flex flex-col items-center will-change-[transform,filter]"
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            className="flex h-[1.1em] items-center justify-center leading-none"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** Minus sign that slides open and closed when a value crosses zero. */
function Sign() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? { opacity: 0 } : { opacity: 0, width: 0 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, width: "auto" }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, width: 0 }}
      transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT }}
      className="inline-block overflow-hidden"
    >
      {"\u2212"}
    </motion.span>
  );
}
