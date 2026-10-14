"use client"

import * as React from "react"

import { cn } from "../../lib/utils.js"
import { TextShimmer } from "../../components/animated/text-shimmer.js"

export type LoadingPattern =
  | "drive"
  | "dots"
  | "orbit"
  | "diagonal"
  | "diamond"
  | "square"
  | "pulse"

// Each cell's delay in the cycle. `null` leaves a cell unlit.
const waveDelays = Array.from({ length: 9 }, (_, index) => {
  const row = Math.floor(index / 3)
  const column = index % 3
  return (column + Math.abs(row - 1)) * 90
})

const perimeter = [0, 1, 2, 5, 8, 7, 6, 3]
const orbitDelays = Array.from({ length: 9 }, (_, index) => {
  const position = perimeter.indexOf(index)
  return position === -1 ? null : position * 110
})

const patterns: Record<
  LoadingPattern,
  {
    delays: (number | null)[]
    durationMs: number
    isRound?: boolean
    hideEmpty?: boolean
    animationName?: string
  }
> = {
  drive: { delays: waveDelays, durationMs: 650, isRound: false },
  dots: { delays: waveDelays, durationMs: 650, isRound: true },
  orbit: { delays: orbitDelays, durationMs: 950, isRound: false },
  diagonal: {
    delays: Array.from({ length: 9 }, (_, index) =>
      -1200 + (Math.floor(index / 3) + (index % 3)) * 150
    ),
    durationMs: 1200,
  },
  diamond: {
    // Top, right, bottom, and left travel around a softly pulsing center.
    delays: [null, -1200, null, -300, -750, -900, null, -600, null],
    durationMs: 1200,
    hideEmpty: true,
  },
  square: {
    delays: Array.from({ length: 9 }, (_, index) => {
      const position = perimeter.indexOf(index)
      return position === -1 ? null : -1200 + position * 150
    }),
    durationMs: 1200,
    hideEmpty: true,
  },
  pulse: {
    delays: [-1200, -1000, -800],
    durationMs: 1200,
    animationName: "hui-loading-pulse",
  },
}

const gridStyles = `
@keyframes hui-loading-cell{0%,100%{opacity:.15}40%{opacity:1}}
@keyframes hui-loading-pulse{0%,70%,100%{opacity:.25;transform:scale(.85)}35%{opacity:1;transform:scale(1)}}
@media(prefers-reduced-motion:reduce){.hui-loading-cell{animation:none!important;transform:none!important}}
@media(forced-colors:active){.hui-loading-cell{background:CanvasText}}
`

function formatElapsed(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

/** Seconds since `startedAt`, updated once a second. */
function useElapsed(startedAt: number | Date | undefined, isEnabled: boolean) {
  const [mountedAt] = React.useState(() => Date.now())
  const start = startedAt === undefined ? mountedAt : new Date(startedAt).getTime()
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (!isEnabled) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isEnabled])

  return formatElapsed(now - start)
}

export type LoadingStateProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What is in progress, such as "Building the export". */
  label: string
  pattern?: LoadingPattern
  /** Shows the time since `startedAt`. */
  showElapsed?: boolean
  /** When the work began. Defaults to when the component mounted. */
  startedAt?: number | Date
}

/**
 * A small animated mark, a label, and the time elapsed, for work that takes
 * more than a moment. Render it while the work runs and remove it when it ends.
 */
function LoadingState({
  label,
  pattern = "drive",
  showElapsed = true,
  startedAt,
  className,
  ...props
}: LoadingStateProps) {
  const elapsed = useElapsed(startedAt, showElapsed)
  const { delays, durationMs, isRound, hideEmpty, animationName = "hui-loading-cell" } = patterns[pattern]

  return (
    <div
      data-slot="loading-state"
      className={cn(
        "flex w-fit max-w-full items-center gap-[var(--hui-space-3)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    >
      <style>{gridStyles}</style>
      <span
        aria-hidden="true"
        data-slot="loading-state-mark"
        data-pattern={pattern}
        className="grid size-[15px] shrink-0 content-center grid-cols-[repeat(3,4px)] gap-[1.5px]"
      >
        {delays.map((delay, index) => (
          <span
            key={index}
            className={cn(
              "hui-loading-cell size-[4px] bg-[var(--hui-color-foreground-base-primary)]",
              isRound ? "rounded-full" : "rounded-[1px]"
            )}
            style={{
              opacity: delay === null ? 0.08 : 0.15,
              visibility: delay === null && hideEmpty ? "hidden" : undefined,
              animation:
                delay === null
                  ? undefined
                  : `${animationName} ${durationMs}ms ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </span>
      {/* Only the label is a status. A ticking timer would be announced every second. */}
      <span role="status" className="min-w-0">
        <TextShimmer
          duration={1.6}
          className="[font-weight:var(--hui-font-weight-medium)]"
        >
          {label}
        </TextShimmer>
      </span>
      {showElapsed && (
        <span
          aria-hidden="true"
          // The server and the browser read the clock at different moments.
          suppressHydrationWarning
          data-slot="loading-state-elapsed"
          className="shrink-0 font-mono tabular-nums text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mono-mini)]"
        >
          {elapsed}
        </span>
      )}
    </div>
  )
}

export { LoadingState }
