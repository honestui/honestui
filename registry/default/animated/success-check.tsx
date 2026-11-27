"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";

export interface SuccessCheckProps {
  /** Draws the check when true and clears it when false. Default true. */
  show?: boolean;
  /** Change this value to play the animation again. */
  playKey?: string | number;
  /** Diameter in pixels. Default 56. */
  size?: number;
  /** Stroke and burst color. Any CSS color. Defaults to the theme's success color. */
  color?: string;
  /** Soft fill behind the check. Any CSS color. Defaults to a tint of the success color. */
  background?: string;
  /** Plays the ring of particles behind the circle. Default true. */
  burst?: boolean;
  /** Accessible name, such as "Payment sent". Without it the check is decorative. */
  label?: string;
  /** Called once the check has finished drawing. */
  onComplete?: () => void;
  className?: string;
}

const PARTICLES = 10;

function Drawing({
  size,
  color,
  background,
  burst,
  reduce,
  onComplete,
}: {
  size: number;
  color: string;
  background: string;
  burst: boolean;
  reduce: boolean;
  onComplete?: () => void;
}) {
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });

  // Reduced motion shows the finished check, so it is complete right away.
  useEffect(() => {
    if (!reduce) return;
    const id = window.setTimeout(() => completeRef.current?.(), 150);
    return () => window.clearTimeout(id);
  }, [reduce]);

  if (reduce) {
    return (
      <motion.svg
        viewBox="0 0 56 56"
        width={size}
        height={size}
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <circle cx="28" cy="28" r="26" fill={background} />
        <circle cx="28" cy="28" r="26" stroke={color} strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M18 28.5 24.5 35 38 21" stroke={color} strokeWidth="3.25" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    );
  }

  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      {burst ? (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 0 1.5px ${color}` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.9, 1.15, 1.55] }}
            transition={{ duration: 0.7, delay: 0.42, ease: EASE_OUT, times: [0, 0.25, 1] }}
          />
          {Array.from({ length: PARTICLES }, (_, index) => {
            const angle = (index / PARTICLES) * Math.PI * 2 - Math.PI / 2;
            const distance = size * (index % 2 === 0 ? 0.78 : 0.66);
            const dot = Math.max(2.5, size * (index % 2 === 0 ? 0.07 : 0.05));
            return (
              <motion.span
                key={index}
                aria-hidden="true"
                className="absolute rounded-full"
                style={{ width: dot, height: dot, background: color, left: "50%", top: "50%", marginLeft: -dot / 2, marginTop: -dot / 2 }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  opacity: [0, 0.9, 0],
                  scale: [0.4, 1, 0.3],
                }}
                transition={{ duration: 0.75, delay: 0.4 + (index % 2) * 0.04, ease: EASE_OUT, times: [0, 0.3, 1] }}
              />
            );
          })}
        </>
      ) : null}
      <motion.svg
        viewBox="0 0 56 56"
        width={size}
        height={size}
        fill="none"
        className="relative"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING_PRESS, opacity: { duration: 0.15 } }}
      >
        <motion.circle
          cx="28"
          cy="28"
          r="26"
          fill={background}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          style={{ transformOrigin: "28px 28px" }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        />
        <motion.circle
          cx="28"
          cy="28"
          r="26"
          stroke={color}
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ rotate: -90, transformOrigin: "28px 28px" }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        />
        <motion.path
          d="M18 28.5 24.5 35 38 21"
          stroke={color}
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 0.34, delay: 0.28, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.01, delay: 0.28 } }}
          onAnimationComplete={() => completeRef.current?.()}
        />
      </motion.svg>
    </span>
  );
}

export function SuccessCheck({
  show = true,
  playKey,
  size = 56,
  color = "var(--hui-color-foreground-success-primary)",
  background = "color-mix(in oklab, var(--hui-color-foreground-success-primary) 12%, transparent)",
  burst = true,
  label,
  onComplete,
  className,
}: SuccessCheckProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <span
      data-slot="success-check"
      data-state={show ? "shown" : "hidden"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {show ? (
        <Drawing
          key={playKey ?? "check"}
          size={size}
          color={color}
          background={background}
          burst={burst}
          reduce={reduce}
          onComplete={onComplete}
        />
      ) : null}
    </span>
  );
}

export default SuccessCheck;
