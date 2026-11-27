import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface MeteorsProps {
  /** Number of streaks. */
  number?: number;
  /** Direction of travel in degrees. 215 falls down and to the left. */
  angle?: number;
  /** Shortest and longest delay before a streak first appears, in seconds. */
  minDelay?: number;
  maxDelay?: number;
  /** Shortest and longest time for one fall, in seconds. */
  minDuration?: number;
  maxDuration?: number;
  /** Length of each tail, in px. */
  tailLength?: number;
  /** Changes the layout of the streaks. The same seed always gives the same layout. */
  seed?: number;
  className?: string;
}

// mulberry32: a tiny seeded generator. Server and client produce the same
// sequence, so the streaks render identically on both and never cause a
// hydration mismatch.
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Thin streaks of light that fall diagonally across their parent. Render it
 * inside a `relative` element; it fills the parent, clips to it, and ignores
 * pointer events. Hidden when reduced motion is requested.
 */
export function Meteors({
  number = 14,
  angle = 215,
  minDelay = 0.2,
  maxDelay = 6,
  minDuration = 3,
  maxDuration = 8,
  tailLength = 64,
  seed = 7,
  className,
}: MeteorsProps) {
  const random = createRandom(seed);
  const meteors = Array.from({ length: Math.max(0, Math.floor(number)) }, () => ({
    // Start along the top edge and a little beyond the right side, so streaks
    // travelling left still cross the whole box.
    left: random() * 130 - 10,
    top: random() * 30 - 20,
    delay: minDelay + random() * Math.max(0, maxDelay - minDelay),
    duration: minDuration + random() * Math.max(0, maxDuration - minDuration),
  }));

  return (
    <>
      <style>
        {`@keyframes beui-meteor{0%{transform:rotate(var(--meteor-angle)) translateX(0);opacity:0}8%{opacity:1}70%{opacity:1}100%{transform:rotate(var(--meteor-angle)) translateX(-900px);opacity:0}}.beui-meteor{opacity:0;animation:beui-meteor var(--meteor-duration) linear infinite;animation-delay:var(--meteor-delay)}@media(prefers-reduced-motion:reduce){.beui-meteors{display:none}}`}
      </style>
      <div
        aria-hidden
        className={cn("beui-meteors pointer-events-none absolute inset-0 overflow-hidden", className)}
      >
        {meteors.map((meteor, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: streaks are generated from a fixed seed and never reordered.
            key={index}
            className="beui-meteor absolute size-[3px] rounded-full bg-foreground/70 shadow-[0_0_0_1px_color-mix(in_oklch,var(--foreground)_8%,transparent)]"
            style={
              {
                top: `${meteor.top}%`,
                left: `${meteor.left}%`,
                "--meteor-angle": `${angle}deg`,
                "--meteor-delay": `${meteor.delay.toFixed(2)}s`,
                "--meteor-duration": `${meteor.duration.toFixed(2)}s`,
              } as CSSProperties
            }
          >
            {/* The tail trails behind the head along the direction of travel. */}
            <span
              className="absolute top-1/2 left-full h-px -translate-y-1/2 bg-linear-to-r from-foreground/50 to-transparent"
              style={{ width: tailLength }}
            />
          </span>
        ))}
      </div>
    </>
  );
}
