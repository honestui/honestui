"use client"

import * as React from "react"
import { TriangleAlert as TriangleAlertIcon } from "honestui/icons"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"

import { EASE_OUT } from "../../lib/ease.js"
import { cn } from "../../lib/utils.js"
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover.js"

export type ContextMeterStatus = "ok" | "near" | "full"

export type ContextMeterPart = {
  /** What these tokens are, such as "Messages" or "Files". */
  label: string
  tokens: number
}

export type ContextMeterLabels = {
  title: string
  /** The trigger's name, such as "42% of context used". */
  summary: (percent: number) => string
  tokens: (used: string, limit: string) => string
  remaining: (tokens: string) => string
  near: string
  full: string
  cost: string
  /** Formats every token count. Replace it to match the person's locale. */
  number: (value: number) => string
}

const numberFormat = new Intl.NumberFormat("en-US")

export const defaultContextMeterLabels: ContextMeterLabels = {
  title: "Context window",
  summary: (percent) => `${percent}% of context used`,
  tokens: (used, limit) => `${used} of ${limit} tokens`,
  remaining: (tokens) => `${tokens} left`,
  near: "Near the limit",
  full: "At the limit",
  cost: "Cost",
  number: (value) => numberFormat.format(value),
}

const RING_RADIUS = 6
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const CHANGE_SECONDS = 0.6

// The icon's dot is a line too short to see until its ends are rounded.
const warningStroke = { strokeWidth: 1.5, strokeLinecap: "round" } as const

// Round down below the limit, so "100%" is shown only when the window is full.
const toPercent = (ratio: number) => (ratio >= 1 ? Math.round(ratio * 100) : Math.floor(ratio * 100))

const statusTone: Record<ContextMeterStatus, string> = {
  ok: "text-[var(--hui-color-foreground-base-primary)]",
  near: "text-[var(--hui-color-foreground-base-primary)]",
  // The darker danger step, which stays readable as small text.
  full: "text-[var(--hui-color-foreground-danger-primary-hover)]",
}

export type ContextMeterProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** Tokens in the context now. */
  used: number
  /** The size of the model's context window, in tokens. */
  limit: number
  /** What the tokens are made of. Listed in the details. */
  parts?: ContextMeterPart[]
  /** A cost you have already formatted, such as "$0.42". The meter does no pricing. */
  cost?: string
  /** The share of the limit, from 0 to 1, at which the meter says it is near the limit. */
  nearAt?: number
  /** Set false to show the ring without the percentage beside it. */
  showPercent?: boolean
  /** A line under the numbers, such as what your product does when the window fills. */
  note?: React.ReactNode
  labels?: Partial<ContextMeterLabels>
}

/**
 * How full a model's context window is, as a small ring and a percentage that
 * open the exact numbers. It counts nothing itself: `used` and `limit` are the
 * figures your model or tokenizer reported. A change glides from the old
 * figure to the new one.
 */
function ContextMeter({
  used,
  limit,
  parts = [],
  cost,
  nearAt = 0.8,
  showPercent = true,
  note,
  labels: labelsProp,
  className,
  ...props
}: ContextMeterProps) {
  const labels = { ...defaultContextMeterLabels, ...labelsProp }
  const titleId = React.useId()

  const usedTokens = Math.max(used, 0)
  const ratio = limit > 0 ? usedTokens / limit : 0
  const percent = toPercent(ratio)
  const status: ContextMeterStatus = ratio >= 1 ? "full" : ratio >= nearAt ? "near" : "ok"
  const statusLabel = status === "full" ? labels.full : status === "near" ? labels.near : null

  // What the ring, the number, and the bar show while they move to a new figure.
  // The name read by assistive technology changes at once, with no steps between.
  const shouldReduceMotion = useReducedMotion() ?? false
  const shownRatio = useMotionValue(ratio)
  React.useEffect(() => {
    if (shouldReduceMotion) {
      shownRatio.set(ratio)
      return
    }
    const controls = animate(shownRatio, ratio, { duration: CHANGE_SECONDS, ease: EASE_OUT })
    return () => controls.stop()
  }, [ratio, shouldReduceMotion, shownRatio])
  const ringDash = useTransform(
    shownRatio,
    (value) => `${Math.min(value, 1) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`
  )
  const shownPercent = useTransform(shownRatio, (value) => `${toPercent(value)}%`)
  const barWidth = useTransform(shownRatio, (value) => `${Math.min(value, 1) * 100}%`)
  const tokensText = labels.tokens(labels.number(usedTokens), labels.number(limit))

  return (
    <Popover>
      <PopoverTrigger
        data-slot="context-meter"
        data-status={status}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-2)] tabular-nums outline-none [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)] motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)]",
          statusTone[status],
          className
        )}
        {...props}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 -rotate-90">
          <circle cx="8" cy="8" r={RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <motion.circle
            cx="8"
            cy="8"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ strokeDasharray: ringDash }}
          />
        </svg>
        {showPercent && (
          <motion.span aria-hidden="true" data-slot="context-meter-percent">
            {shownPercent}
          </motion.span>
        )}
        {/* The warning is a shape and a word, so it does not depend on the color. */}
        {statusLabel && <TriangleAlertIcon {...warningStroke} aria-hidden="true" className="size-3.5 shrink-0" />}
        <span className="sr-only">
          {labels.summary(percent)}
          {statusLabel && `. ${statusLabel}`}
        </span>
      </PopoverTrigger>
      <PopoverPopup align="end" aria-labelledby={titleId} className="w-64 max-w-[calc(100vw-2rem)]">
        <div data-slot="context-meter-details" className="flex flex-col gap-[var(--hui-space-3)]">
          <p id={titleId} className="m-0 [font-weight:var(--hui-font-weight-medium)]">
            {labels.title}
          </p>

          <div className="flex flex-col gap-[var(--hui-space-2)]">
            <div
              role="meter"
              aria-labelledby={titleId}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={Math.min(usedTokens, limit)}
              aria-valuetext={tokensText}
              className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--hui-color-background-base-secondary)]"
            >
              {/* A border, not a fill, so the bar survives forced colors. */}
              <motion.div
                className={cn("h-full rounded-full border-t-[6px] border-current", statusTone[status])}
                style={{ width: barWidth }}
              />
            </div>
            <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-[var(--hui-space-3)]">
              <span>{tokensText}</span>
              <span className="text-[var(--hui-color-foreground-base-secondary)]">
                {labels.remaining(labels.number(Math.max(limit - usedTokens, 0)))}
              </span>
            </p>
            {statusLabel && (
              <p className={cn("m-0 flex items-center gap-[var(--hui-space-2)]", statusTone[status])}>
                <TriangleAlertIcon {...warningStroke} aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="[font-weight:var(--hui-font-weight-medium)]">{statusLabel}</span>
              </p>
            )}
          </div>

          {(parts.length > 0 || cost !== undefined) && (
            <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-1)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-3)]">
              {parts.map((part) => (
                <React.Fragment key={part.label}>
                  <dt className="min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]">
                    {part.label}
                  </dt>
                  <dd className="m-0 text-end tabular-nums">{labels.number(part.tokens)}</dd>
                </React.Fragment>
              ))}
              {cost !== undefined && (
                <>
                  <dt className="text-[var(--hui-color-foreground-base-secondary)]">{labels.cost}</dt>
                  <dd className="m-0 text-end tabular-nums">{cost}</dd>
                </>
              )}
            </dl>
          )}

          {note && (
            <p className="m-0 break-words text-[var(--hui-color-foreground-base-secondary)]">{note}</p>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  )
}

export { ContextMeter }
