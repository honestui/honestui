"use client";

import { useInView, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

export interface TypewriterProps {
  /** One phrase, or several to type, erase, and cycle through. */
  text: string | string[];
  as?: ElementType;
  /** Milliseconds per typed character. Default 55. */
  typeSpeed?: number;
  /** Milliseconds per erased character. Default 28. */
  deleteSpeed?: number;
  /** Milliseconds a finished phrase stays before erasing. Default 1600. */
  pause?: number;
  /** Milliseconds before typing starts. Default 0. */
  startDelay?: number;
  /**
   * Cycle back to the first phrase after the last. Defaults to true when
   * `text` is an array. A single phrase is typed once and stays.
   */
  loop?: boolean;
  /** Wait until the element scrolls into view before typing. Default false. */
  startOnView?: boolean;
  /** Show the caret. Default true. */
  cursor?: boolean;
  /** Keep the caret after the last phrase is typed. Default true. */
  keepCursor?: boolean;
  className?: string;
  cursorClassName?: string;
  /** Called after each phrase finishes typing, with its index. */
  onPhraseComplete?: (index: number) => void;
}

type TypewriterRootProps = {
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
};

type Phase = "typing" | "holding" | "deleting" | "done";

const CARET_KEYFRAMES =
  "@keyframes hui-typewriter-caret{0%,45%{opacity:1}55%,100%{opacity:0}}@media(prefers-reduced-motion:reduce){.hui-typewriter-caret{animation:none!important}}";

export function Typewriter({
  text,
  as: Comp = "span",
  typeSpeed = 55,
  deleteSpeed = 28,
  pause = 1600,
  startDelay = 0,
  loop,
  startOnView = false,
  cursor = true,
  keepCursor = true,
  className,
  cursorClassName,
  onPhraseComplete,
}: TypewriterProps) {
  const Root = Comp as ComponentType<TypewriterRootProps>;
  const phrases = Array.isArray(text) ? text : [text];
  const phraseKey = phrases.join("\u0000");
  const shouldLoop = loop ?? Array.isArray(text);
  const rootRef = useRef<HTMLElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const armed = !startOnView || inView;

  const [state, setState] = useState<{ index: number; length: number; phase: Phase }>({
    index: 0,
    length: 0,
    phase: "typing",
  });
  const onCompleteRef = useRef(onPhraseComplete);
  useEffect(() => {
    onCompleteRef.current = onPhraseComplete;
  }, [onPhraseComplete]);

  // Start over when the phrases change.
  const [prevKey, setPrevKey] = useState(phraseKey);
  if (prevKey !== phraseKey) {
    setPrevKey(phraseKey);
    setState({ index: 0, length: 0, phase: "typing" });
  }

  const startedRef = useRef(false);

  useEffect(() => {
    if (!armed) return;
    const list = phraseKey.split("\u0000");
    const current = list[state.index] ?? "";
    const isLast = state.index === list.length - 1;
    let delay: number;
    let next: (prev: typeof state) => typeof state;

    if (state.phase === "done") return;

    if (state.phase === "typing") {
      if (state.length < current.length) {
        // Reduced motion: the whole phrase appears in one step.
        delay = startedRef.current ? typeSpeed : startDelay;
        next = (prev) => ({
          ...prev,
          length: reduce ? current.length : prev.length + 1,
        });
      } else {
        onCompleteRef.current?.(state.index);
        const finished = isLast && !shouldLoop;
        delay = 0;
        next = (prev) => ({ ...prev, phase: finished ? "done" : "holding" });
      }
    } else if (state.phase === "holding") {
      delay = pause;
      next = (prev) => ({ ...prev, phase: "deleting" });
    } else if (state.length > 0) {
      delay = deleteSpeed;
      next = (prev) => ({ ...prev, length: reduce ? 0 : prev.length - 1 });
    } else {
      delay = typeSpeed * 4;
      next = (prev) => ({
        index: (prev.index + 1) % list.length,
        length: 0,
        phase: "typing",
      });
    }

    const timer = window.setTimeout(() => {
      startedRef.current = true;
      setState(next);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [armed, state, phraseKey, typeSpeed, deleteSpeed, pause, startDelay, shouldLoop, reduce]);

  const current = phrases[state.index] ?? "";
  const visible = current.slice(0, state.length);
  const showCursor = cursor && (state.phase !== "done" || keepCursor);
  // Blink only while idle; a caret that blinks mid-keystroke looks broken.
  const blinking = state.phase === "holding" || state.phase === "done" || !armed;

  return (
    <Root ref={rootRef} className={cn("inline", className)}>
      {showCursor ? <style>{CARET_KEYFRAMES}</style> : null}
      {/* Assistive technology gets every phrase once instead of a stream of
          partial words. */}
      <span className="sr-only">{phrases.join(", ")}</span>
      <span aria-hidden="true" className="whitespace-pre-wrap">
        {visible}
        {showCursor ? (
          <span
            className={cn(
              "hui-typewriter-caret ms-[0.05em] inline-block h-[1.1em] w-[0.08em] min-w-[2px] translate-y-[0.15em] rounded-full bg-current align-baseline",
              cursorClassName,
            )}
            style={
              blinking ? { animation: "hui-typewriter-caret 1.05s steps(1, end) infinite" } : undefined
            }
          />
        ) : null}
      </span>
    </Root>
  );
}
