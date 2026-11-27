"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  LoaderCircle as LoaderCircleIcon,
  RotateCcw as RetryIcon,
  Undo2 as UndoIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

import type { UndoBarLabels, UndoableAction, UndoableEntry } from "./undoable-action-types"
import {
  defaultUndoBarLabels,
  getCountdownFraction,
  getSecondsLeft,
} from "./undoable-action-utils"

export type {
  UndoBarLabels,
  UndoableAction,
  UndoableEntry,
  UndoableEntryPhase,
  UndoableEvent,
  UndoableQueueOptions,
  UndoableQueueState,
  UndoableRunOptions,
} from "./undoable-action-types"
export {
  createUndoableQueue,
  defaultUndoBarLabels,
  DEFAULT_UNDO_DURATION,
} from "./undoable-action-utils"
export { useUndoableAction } from "./use-undoable-action"

const bodyText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"

const barButton =
  "min-h-7 gap-[6px] px-[var(--hui-space-3)] shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] [&_svg]:size-3.5 [&_svg]:text-[var(--hui-color-foreground-base-secondary)]"

/** Filled buttons lose their fill in forced colors, so they get an edge instead. */
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)")
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                  */
/* -------------------------------------------------------------------------- */

const RING_RADIUS = 7
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/**
 * A ring that empties as the countdown runs, and the seconds beside Undo.
 * Drawn on each frame from the deadline, so a paused bar stops exactly where
 * it was. With reduced motion the ring steps once a second instead of sweeping.
 */
function useCountdown(entry: UndoableEntry, ring: React.RefObject<SVGCircleElement | null>) {
  const reducedMotion = usePrefersReducedMotion()
  const [seconds, setSeconds] = React.useState(() => Math.ceil(entry.remaining / 1000))

  React.useEffect(() => {
    let frame = 0
    let interval = 0
    const draw = () => {
      const now = Date.now()
      const fraction = getCountdownFraction(entry, now)
      const shown = reducedMotion ? Math.ceil(fraction * 10) / 10 : fraction
      ring.current?.setAttribute("stroke-dashoffset", String(RING_LENGTH * (1 - shown)))
      setSeconds(getSecondsLeft(entry, now))
    }
    draw()
    if (entry.phase === "waiting" && entry.deadline !== null) {
      if (reducedMotion) {
        interval = window.setInterval(draw, 250)
      } else {
        const loop = () => {
          draw()
          frame = window.requestAnimationFrame(loop)
        }
        frame = window.requestAnimationFrame(loop)
      }
    }
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(interval)
    }
  }, [entry, reducedMotion, ring])

  return seconds
}

function CountdownRing({ ring }: { ring: React.RefObject<SVGCircleElement | null> }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className="size-[18px] shrink-0 -rotate-90"
      data-slot="undo-bar-countdown"
    >
      <circle
        cx="9"
        cy="9"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="1.5"
        className="stroke-[var(--hui-color-border-base-primary)]"
      />
      <circle
        ref={ring}
        cx="9"
        cy="9"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={0}
        className="stroke-[var(--hui-color-foreground-base-primary)] forced-colors:stroke-[CanvasText]"
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Entry                                                                      */
/* -------------------------------------------------------------------------- */

function UndoBarEntry({
  entry,
  action,
  labels,
}: {
  entry: UndoableEntry
  action: UndoableAction
  labels: UndoBarLabels
}) {
  const ring = React.useRef<SVGCircleElement>(null)
  const seconds = useCountdown(entry, ring)

  return (
    <li
      data-slot="undo-bar-entry"
      data-phase={entry.phase}
      className={cn(
        "flex min-h-11 w-full min-w-0 items-center gap-[var(--hui-space-3)] py-[6px] ps-[var(--hui-space-4)] pe-[6px]",
        bodyText
      )}
    >
      {entry.phase === "waiting" && <CountdownRing ring={ring} />}
      {entry.phase === "committing" && (
        <LoaderCircleIcon
          aria-hidden="true"
          className="size-[18px] shrink-0 p-px text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin"
        />
      )}
      {entry.phase === "failed" && (
        <CircleAlertIcon
          aria-hidden="true"
          className="size-[18px] shrink-0 p-px text-[var(--hui-color-foreground-danger-primary)]"
        />
      )}

      <span className="min-w-0 flex-1 break-words">
        {entry.phase === "failed"
          ? labels.failed(entry.message, entry.error)
          : entry.phase === "committing"
            ? labels.committing(entry.message)
            : entry.message}
      </span>

      {entry.phase === "waiting" && (
        <span className="flex shrink-0 items-center gap-[var(--hui-space-1)]">
          <span
            aria-hidden="true"
            data-slot="undo-bar-seconds"
            className="min-w-[3ch] text-end text-[var(--hui-color-foreground-base-secondary)] tabular-nums [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
          >
            {labels.secondsLeft(seconds)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={labels.undoAction(entry.message)}
            className={cn(barButton, forcedColorsBorder)}
            onClick={() => action.undo(entry.id)}
          >
            <UndoIcon aria-hidden="true" />
            {labels.undo}
          </Button>
        </span>
      )}

      {entry.phase === "failed" && (
        <span className="flex shrink-0 items-center gap-[var(--hui-space-1)]">
          <Button
            variant="ghost"
            size="sm"
            className={cn(barButton, forcedColorsBorder)}
            onClick={() => action.retry(entry.id)}
          >
            <RetryIcon aria-hidden="true" />
            {labels.retry}
          </Button>
          <Button
            variant="link"
            size="icon-sm"
            aria-label={labels.dismiss}
            className="size-7 rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-secondary)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)]"
            onClick={() => action.dismiss(entry.id)}
          >
            <CloseIcon aria-hidden="true" />
          </Button>
        </span>
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Bar                                                                        */
/* -------------------------------------------------------------------------- */

export type UndoBarProps = Omit<React.ComponentProps<"section">, "children"> & {
  action: UndoableAction
  labels?: Partial<UndoBarLabels> | undefined
}

/**
 * Lists the actions that are waiting to be sent, each with a countdown and
 * Undo, and the ones that failed, with Retry. Pointing at the bar or moving
 * focus into it holds every countdown. Keep it mounted: it renders nothing
 * visible while the queue is empty, but its announcements need it in place.
 */
function UndoBar({ action, labels: labelsProp, className, ...props }: UndoBarProps) {
  const labels = React.useMemo(() => ({ ...defaultUndoBarLabels, ...labelsProp }), [labelsProp])
  const { entries, lastEvent, setPaused } = action
  const rootRef = React.useRef<HTMLElement>(null)

  // One sentence per event. Ticking seconds are never announced.
  const announcement = React.useMemo(() => {
    if (!lastEvent) return ""
    const { entry } = lastEvent
    switch (lastEvent.type) {
      case "added":
        return labels.added(entry.message, Math.round(entry.duration / 1000))
      case "undone":
        return labels.undone(entry.message)
      case "failed":
        return labels.failed(entry.message, entry.error)
      default:
        return ""
    }
  }, [lastEvent, labels])

  // Undo removes the button that was pressed. Keep focus inside the bar, or on
  // the bar itself, so the next Tab does not start from the top of the page.
  const lastFocusedInside = React.useRef(false)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || !lastFocusedInside.current) return
    if (root.contains(document.activeElement)) return
    const next = root.querySelector<HTMLElement>("button")
    ;(next ?? root).focus()
    if (!next) {
      lastFocusedInside.current = false
      setPaused("focus", false)
    }
  }, [entries, setPaused])

  // Releasing the holds when the bar goes away keeps the queue from stalling.
  React.useEffect(
    () => () => {
      setPaused("hover", false)
      setPaused("focus", false)
    },
    [setPaused]
  )

  return (
    <section
      ref={rootRef}
      aria-label={labels.region}
      tabIndex={-1}
      data-slot="undo-bar"
      data-empty={entries.length === 0 ? "" : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setPaused("hover", true)
      }}
      onPointerLeave={() => setPaused("hover", false)}
      onFocus={() => {
        lastFocusedInside.current = true
        setPaused("focus", true)
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        lastFocusedInside.current = false
        setPaused("focus", false)
      }}
      className={cn(
        "w-full min-w-0 text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] rounded-[var(--hui-radius-3)]",
        className
      )}
      {...props}
    >
      <p role="status" className="sr-only" data-slot="undo-bar-announcement">
        {announcement}
      </p>
      {entries.length > 0 && (
        <ol
          className={cn(
            "m-0 list-none overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0 shadow-[var(--hui-shadow-floating,var(--hui-shadow-soft))]",
            "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"
          )}
        >
          {entries.map((entry) => (
            <UndoBarEntry key={entry.id} entry={entry} action={action} labels={labels} />
          ))}
        </ol>
      )}
    </section>
  )
}

export { UndoBar }
