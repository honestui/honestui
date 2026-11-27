"use client";

import { useInView, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ElementType,
  type FocusEventHandler,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

export type TextScrambleTrigger = "mount" | "view" | "hover";

export interface TextScrambleProps {
  /** The final text. Changing it scrambles into the new value. */
  children: string;
  as?: ElementType;
  /** When the scramble plays. Default "mount". */
  trigger?: TextScrambleTrigger;
  /** Replays the scramble whenever this value changes. */
  replayKey?: unknown;
  /** Seconds until the last character resolves. Default 0.8. */
  duration?: number;
  /** Milliseconds between random-character swaps. Default 40. */
  speed?: number;
  /** Characters drawn while scrambling. */
  characters?: string;
  /** Scramble spaces too, instead of keeping word gaps visible. Default false. */
  scrambleSpaces?: boolean;
  /** Called once the text has fully resolved. */
  onComplete?: () => void;
  className?: string;
  /** Class for characters that are still scrambling. */
  scrambleClassName?: string;
}

type TextScrambleRootProps = {
  children?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
};

const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

type Frame = { resolved: number; glyphs: string[] } | null;

function randomGlyph(characters: string) {
  return characters.charAt(Math.floor(Math.random() * characters.length));
}

export function TextScramble({
  children,
  as: Comp = "span",
  trigger = "mount",
  replayKey,
  duration = 0.8,
  speed = 40,
  characters = DEFAULT_CHARACTERS,
  scrambleSpaces = false,
  onComplete,
  className,
  scrambleClassName,
}: TextScrambleProps) {
  const Root = Comp as ComponentType<TextScrambleRootProps>;
  const text = children;
  const rootRef = useRef<HTMLElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  // null means "show the final text". The server and the first client render
  // both show the final text, so there is nothing to hydrate differently.
  const [frame, setFrame] = useState<Frame>(null);
  const rafRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const play = useCallback(() => {
    stop();
    if (reduce) {
      // Reduced motion shows the final text at once.
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        setFrame(null);
        onCompleteRef.current?.();
      });
      return;
    }
    const chars = Array.from(text);
    const total = Math.max(duration, 0.05) * 1000;
    let start = 0;
    let lastSwap = -Infinity;
    let glyphs: string[] = [];

    const tick = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / total, 1);
      const resolved = Math.floor(progress * chars.length);
      if (now - lastSwap >= speed || progress === 1) {
        lastSwap = now;
        glyphs = chars.map((char) =>
          !scrambleSpaces && /\s/.test(char) ? char : randomGlyph(characters),
        );
      }
      if (progress < 1) {
        setFrame({ resolved, glyphs });
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        setFrame(null);
        onCompleteRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stop, reduce, text, duration, speed, scrambleSpaces, characters]);

  // Mount and text/replayKey changes. The "view" trigger waits for the
  // element to scroll in, then plays once; later text changes still play.
  const armed = trigger === "mount" || (trigger === "view" && inView);
  useEffect(() => {
    if (!armed) return;
    play();
    return stop;
  }, [armed, play, stop, replayKey]);

  const chars = Array.from(text);
  const words: { start: number; chars: string[] }[] = [];
  chars.forEach((char, index) => {
    const last = words[words.length - 1];
    const isSpace = /\s/.test(char);
    if (!last || isSpace || /\s/.test(last.chars[0])) {
      words.push({ start: index, chars: [char] });
    } else {
      last.chars.push(char);
    }
  });

  const replay = () => {
    if (!rafRef.current) play();
  };

  return (
    <Root
      ref={rootRef}
      className={className}
      onMouseEnter={trigger === "hover" ? replay : undefined}
      onFocus={trigger === "hover" ? replay : undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {frame === null
          ? text
          : words.map((word) => {
              // Plain spaces stay ordinary text so long lines still wrap.
              if (/\s/.test(word.chars[0]) && !scrambleSpaces) {
                return word.chars.join("");
              }
              return (
                <span key={word.start} className="whitespace-nowrap">
                  {runs(word.chars, word.start, frame).map((run) =>
                    run.glyph === null ? (
                      // Settled characters stay one text run, so the font
                      // keeps its kerning between them.
                      run.text
                    ) : (
                      // A scrambling glyph sits centered over an invisible
                      // copy of its final character, so wide random glyphs
                      // never widen the line. Only cross-character kerning
                      // is lost while it scrambles.
                      <span key={run.index} className="relative inline-block whitespace-pre">
                        <span className="invisible">{run.text}</span>
                        <span
                          className={cn("absolute inset-0 flex justify-center", scrambleClassName)}
                        >
                          {run.glyph}
                        </span>
                      </span>
                    ),
                  )}
                </span>
              );
            })}
      </span>
    </Root>
  );
}

type Run = { index: number; text: string; glyph: string | null };

/** Splits a word into settled text runs and single scrambling characters. */
function runs(chars: string[], start: number, frame: { resolved: number; glyphs: string[] }) {
  const out: Run[] = [];
  chars.forEach((char, offset) => {
    const index = start + offset;
    const glyph = frame.glyphs[index];
    const settled = index < frame.resolved || glyph === undefined || glyph === char;
    const last = out[out.length - 1];
    if (settled && last && last.glyph === null) {
      last.text += char;
    } else {
      out.push({ index, text: char, glyph: settled ? null : glyph });
    }
  });
  return out;
}
