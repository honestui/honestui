"use client"

import * as React from "react"
import {
  Ban as BanIcon,
  ChevronDown as ChevronDownIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Flag as FlagIcon,
  LoaderCircle as LoaderCircleIcon,
  ShieldCheck as ShieldCheckIcon,
  TriangleAlert as TriangleAlertIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover.js"

/**
 * What a guardrail did. `masked` hid part of the text, `blocked` stopped a
 * request or reply, `flagged` let it through and marked it for review, and
 * `allowed` let it through with a warning.
 */
export type GuardrailAction = "masked" | "blocked" | "flagged" | "allowed"

export type GuardrailSeverity = "low" | "medium" | "high"

export type GuardrailEvent = {
  id: string
  action: GuardrailAction
  /** A machine name for what was found, such as "email", "card", "secret", or "policy". */
  category: string
  /** The name people read, such as "Email address". Defaults to `category`. */
  categoryLabel?: string
  /** The rule or policy that fired, such as "pii.email" or "No medical advice". */
  rule: string
  /** Why it fired, in plain words. */
  reason?: string
  severity?: GuardrailSeverity
  /** Where it fired, such as "Your message", "Reply", or a tool's name. */
  source?: string
  /** What a masked span shows in place of the text, such as "email". Defaults to `categoryLabel`. */
  placeholder?: string
  /** Whether this person may see the original. Reveal is offered only when this is true and you handle `onReveal`. */
  revealable?: boolean
}

/** A masked span in a piece of text, from `start` (inclusive) to `end` (exclusive), in UTF-16 code units. */
export type GuardrailRange = {
  start: number
  end: number
  eventId: string
}

export type GuardrailSegment =
  | { type: "text"; text: string }
  | { type: "redaction"; text: string; eventId: string; start: number; end: number }

/**
 * Splits text into plain runs and masked spans. Ranges are sorted, clamped to
 * the text, and any that overlap an earlier range are dropped, so every
 * character belongs to exactly one segment.
 */
export function toGuardrailSegments(text: string, ranges: GuardrailRange[]): GuardrailSegment[] {
  const sorted = ranges
    .map((range) => ({
      ...range,
      start: Math.max(0, Math.min(range.start, text.length)),
      end: Math.max(0, Math.min(range.end, text.length)),
    }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const segments: GuardrailSegment[] = []
  let cursor = 0
  for (const range of sorted) {
    if (range.start < cursor) continue
    if (range.start > cursor) segments.push({ type: "text", text: text.slice(cursor, range.start) })
    segments.push({
      type: "redaction",
      text: text.slice(range.start, range.end),
      eventId: range.eventId,
      start: range.start,
      end: range.end,
    })
    cursor = range.end
  }
  if (cursor < text.length) segments.push({ type: "text", text: text.slice(cursor) })
  return segments
}

/** How many events took each action. */
export function summarizeGuardrailEvents(events: GuardrailEvent[]) {
  const counts: Record<GuardrailAction, number> = { masked: 0, blocked: 0, flagged: 0, allowed: 0 }
  for (const event of events) counts[event.action] += 1
  return counts
}

export type GuardrailNoticeLabels = {
  title: string
  /** The summary for each action with a count, such as "2 items masked". */
  summary: Record<GuardrailAction, (count: number) => string>
  /** The short name of each action, shown on each event. */
  action: Record<GuardrailAction, string>
  severity: Record<GuardrailSeverity, string>
  rule: string
  reason: string
  source: string
  /** Read before a masked span, such as "Masked: Email address". */
  maskedSpan: (category: string) => string
  reveal: string
  revealing: string
  hide: string
  revealFailed: string
  /** Said after the original is shown, so the person knows the reveal is recorded. */
  revealNote: string
}

export const defaultGuardrailNoticeLabels: GuardrailNoticeLabels = {
  title: "Guardrails",
  summary: {
    masked: (count) => (count === 1 ? "1 item masked" : `${count} items masked`),
    blocked: (count) => (count === 1 ? "1 request blocked" : `${count} requests blocked`),
    flagged: (count) => (count === 1 ? "1 flagged for review" : `${count} flagged for review`),
    allowed: (count) => (count === 1 ? "1 warning" : `${count} warnings`),
  },
  action: {
    masked: "Masked",
    blocked: "Blocked",
    flagged: "Flagged",
    allowed: "Allowed with warning",
  },
  severity: { low: "Low", medium: "Medium", high: "High" },
  rule: "Rule",
  reason: "Why",
  source: "Where",
  maskedSpan: (category) => `Masked: ${category}`,
  reveal: "Reveal",
  revealing: "Revealing…",
  hide: "Hide",
  revealFailed: "The original could not be shown.",
  revealNote: "Revealing is recorded.",
}

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const bodyText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

// Color only for real state: a block is danger, a flag or warning is attention, a mask is neutral.
const actionTone: Record<GuardrailAction, string> = {
  masked: "text-[var(--hui-color-foreground-base-secondary)]",
  blocked: "text-[var(--hui-color-foreground-danger-primary)]",
  flagged: "text-[var(--hui-color-foreground-attention-primary-hover)]",
  allowed: "text-[var(--hui-color-foreground-attention-primary-hover)]",
}

const actionIcon: Record<GuardrailAction, typeof BanIcon> = {
  masked: EyeOffIcon,
  blocked: BanIcon,
  flagged: FlagIcon,
  allowed: TriangleAlertIcon,
}

const actionOrder: GuardrailAction[] = ["blocked", "masked", "flagged", "allowed"]

const iconStroke = { strokeWidth: 1.5, strokeLinecap: "round" } as const

function categoryName(event: GuardrailEvent) {
  return event.categoryLabel ?? event.category
}

/* -------------------------------------------------------------------------------------------------
 * Event details, shared by a masked span's popover and the notice's list
 * -----------------------------------------------------------------------------------------------*/

function EventFacts({ event, labels }: { event: GuardrailEvent; labels: GuardrailNoticeLabels }) {
  return (
    <dl
      className={cn(
        "m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-1)]",
        metaText
      )}
    >
      <dt className="text-[var(--hui-color-foreground-base-secondary)]">{labels.rule}</dt>
      <dd className="m-0 min-w-0 break-words font-mono">{event.rule}</dd>
      {event.reason && (
        <>
          <dt className="text-[var(--hui-color-foreground-base-secondary)]">{labels.reason}</dt>
          <dd className="m-0 min-w-0 break-words">{event.reason}</dd>
        </>
      )}
      {event.source && (
        <>
          <dt className="text-[var(--hui-color-foreground-base-secondary)]">{labels.source}</dt>
          <dd className="m-0 min-w-0 break-words">{event.source}</dd>
        </>
      )}
    </dl>
  )
}

function ActionLabel({
  event,
  labels,
  className,
}: {
  event: GuardrailEvent
  labels: GuardrailNoticeLabels
  className?: string
}) {
  const Icon = actionIcon[event.action]
  return (
    <span className={cn("inline-flex items-center gap-[var(--hui-space-2)]", actionTone[event.action], className)}>
      <Icon {...iconStroke} aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="[font-weight:var(--hui-font-weight-medium)]">{labels.action[event.action]}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * RedactedText
 * -----------------------------------------------------------------------------------------------*/

export type RedactedTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The text as the person may see it. A masked span's characters are never shown; its chip is. */
  text: string
  ranges: GuardrailRange[]
  events: GuardrailEvent[]
  /**
   * Fetches the original of a revealable span. Record the reveal on your
   * server before you return it. Without this, no Reveal is offered.
   */
  onReveal?: (event: GuardrailEvent, range: GuardrailRange) => string | Promise<string>
  labels?: Partial<GuardrailNoticeLabels>
}

/**
 * Text with its masked spans shown as chips. Each chip opens what was found,
 * the rule that fired, and why. The original is never in the text you pass:
 * Reveal asks `onReveal` for it, so your server decides and records who saw it.
 */
function RedactedText({ text, ranges, events, onReveal, labels: labelsProp, className, ...props }: RedactedTextProps) {
  const labels = { ...defaultGuardrailNoticeLabels, ...labelsProp }
  const segments = React.useMemo(() => toGuardrailSegments(text, ranges), [text, ranges])
  const eventsById = React.useMemo(() => new Map(events.map((event) => [event.id, event])), [events])

  return (
    <span data-slot="redacted-text" className={cn("whitespace-pre-wrap break-words", className)} {...props}>
      {segments.map((segment, index) => {
        if (segment.type === "text") return <React.Fragment key={`t-${index}`}>{segment.text}</React.Fragment>
        const event = eventsById.get(segment.eventId)
        if (!event) return <React.Fragment key={`r-${segment.start}`}>{segment.text}</React.Fragment>
        return (
          <RedactedSpan
            key={`r-${segment.start}`}
            event={event}
            range={{ start: segment.start, end: segment.end, eventId: segment.eventId }}
            onReveal={onReveal}
            labels={labels}
          />
        )
      })}
    </span>
  )
}

function RedactedSpan({
  event,
  range,
  onReveal,
  labels,
}: {
  event: GuardrailEvent
  range: GuardrailRange
  onReveal?: RedactedTextProps["onReveal"]
  labels: GuardrailNoticeLabels
}) {
  const [revealed, setRevealed] = React.useState<string | null>(null)
  const [state, setState] = React.useState<"idle" | "loading" | "error">("idle")
  const titleId = React.useId()
  const canReveal = Boolean(event.revealable && onReveal)
  const placeholder = event.placeholder ?? categoryName(event)

  const reveal = async () => {
    if (!onReveal) return
    setState("loading")
    try {
      const original = await onReveal(event, range)
      setRevealed(original)
      setState("idle")
    } catch {
      setState("error")
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        data-slot="redacted-span"
        data-action={event.action}
        data-revealed={revealed !== null || undefined}
        className={cn(
          "mx-[1px] inline cursor-pointer rounded-[var(--hui-radius-1)] border-[0.5px] px-[var(--hui-space-2)] align-baseline outline-none [box-decoration-break:clone] motion-safe:[transition:var(--hui-transition-interactive)] focus-visible:[outline:var(--hui-focus-ring)]",
          revealed === null
            ? // A hatched chip, so a mask reads as removed text in any color mode.
              "border-[var(--hui-color-border-base-secondary)] bg-[repeating-linear-gradient(135deg,var(--hui-color-background-neutral-primary)_0_4px,var(--hui-color-background-base-secondary)_4px_8px)] text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)] [font-size:0.92em]"
            : "border-dashed border-[var(--hui-color-border-attention-emphasis,var(--hui-color-border-base-secondary))] bg-[var(--hui-color-background-attention-primary,var(--hui-color-background-neutral-primary))] text-[var(--hui-color-foreground-base-primary)]"
        )}
      >
        <span className="sr-only">{`${labels.maskedSpan(categoryName(event))}. `}</span>
        {revealed === null ? (
          <span aria-hidden="true">{placeholder}</span>
        ) : (
          revealed
        )}
      </PopoverTrigger>
      <PopoverPopup align="start" aria-labelledby={titleId} className="w-72 max-w-[calc(100vw-2rem)]">
        <div data-slot="redacted-span-details" className="flex flex-col gap-[var(--hui-space-3)]">
          <div className="flex items-baseline justify-between gap-[var(--hui-space-3)]">
            <p id={titleId} className="m-0 min-w-0 break-words [font-weight:var(--hui-font-weight-medium)]">
              {categoryName(event)}
            </p>
            <ActionLabel event={event} labels={labels} className={cn("shrink-0", metaText)} />
          </div>
          <EventFacts event={event} labels={labels} />
          {canReveal && (
            <div className="flex flex-col gap-[var(--hui-space-2)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-3)]">
              {state === "error" && (
                <p role="alert" className={cn("m-0 text-[var(--hui-color-foreground-danger-primary)]", metaText)}>
                  {labels.revealFailed}
                </p>
              )}
              <div className="flex items-center justify-between gap-[var(--hui-space-3)]">
                <p className={cn("m-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)} aria-live="polite">
                  {revealed !== null ? labels.revealNote : ""}
                </p>
                {revealed === null ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-disabled={state === "loading" || undefined}
                    className="aria-disabled:cursor-progress"
                    onClick={() => {
                      if (state !== "loading") void reveal()
                    }}
                  >
                    {state === "loading" ? (
                      <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
                    ) : (
                      <EyeIcon {...iconStroke} aria-hidden="true" className="size-3.5" />
                    )}
                    {state === "loading" ? labels.revealing : labels.reveal}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setRevealed(null)}>
                    <EyeOffIcon {...iconStroke} aria-hidden="true" className="size-3.5" />
                    {labels.hide}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  )
}

/* -------------------------------------------------------------------------------------------------
 * GuardrailNotice
 * -----------------------------------------------------------------------------------------------*/

export type GuardrailNoticeProps = Omit<React.ComponentProps<"div">, "children"> & {
  events: GuardrailEvent[]
  /** Whether the list of events starts open. Defaults to open when anything was blocked. */
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  labels?: Partial<GuardrailNoticeLabels>
}

/**
 * A message-level line that says what guardrails did, such as "2 items masked ·
 * 1 request blocked", and opens each event with its rule, reason, and severity.
 * It reports the events you pass; it detects nothing.
 */
function GuardrailNotice({
  events,
  defaultOpen,
  open: openProp,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: GuardrailNoticeProps) {
  const labels = { ...defaultGuardrailNoticeLabels, ...labelsProp }
  const counts = summarizeGuardrailEvents(events)
  const [openState, setOpenState] = React.useState(defaultOpen ?? counts.blocked > 0)
  const open = openProp ?? openState
  const listId = React.useId()

  if (events.length === 0) return null

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }

  const parts = actionOrder.filter((action) => counts[action] > 0)
  const lead: GuardrailAction = parts[0] ?? "masked"
  const LeadIcon = lead === "masked" ? ShieldCheckIcon : actionIcon[lead]
  const sorted = [...events].sort((a, b) => actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action))

  return (
    <div
      data-slot="guardrail-notice"
      data-blocked={counts.blocked > 0 || undefined}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        bodyText,
        className
      )}
      {...props}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${labels.title}: ${parts.map((action) => labels.summary[action](counts[action])).join(", ")}`}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-[var(--hui-space-3)] border-0 bg-transparent px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-start outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:-outline-offset-2"
      >
        <LeadIcon {...iconStroke} aria-hidden="true" className={cn("size-4 shrink-0", actionTone[lead])} />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[var(--hui-space-2)]">
          {parts.map((action, index) => (
            <React.Fragment key={action}>
              {index > 0 && (
                <span aria-hidden="true" className="text-[var(--hui-color-foreground-base-secondary)]">
                  ·
                </span>
              )}
              <span
                className={cn(
                  "whitespace-nowrap tabular-nums",
                  index === 0
                    ? "[font-weight:var(--hui-font-weight-medium)]"
                    : "text-[var(--hui-color-foreground-base-secondary)]"
                )}
              >
                {labels.summary[action](counts[action])}
              </span>
            </React.Fragment>
          ))}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-[var(--hui-color-foreground-base-secondary)] motion-safe:transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <ul
        id={listId}
        hidden={!open}
        data-slot="guardrail-notice-events"
        className="m-0 list-none border-t-[0.5px] border-[var(--hui-color-border-base-primary)] p-0"
      >
        {sorted.map((event) => (
          <li
            key={event.id}
            data-slot="guardrail-event"
            data-action={event.action}
            className="flex flex-col gap-[var(--hui-space-2)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] last:border-b-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-1)]">
              <span className="min-w-0 break-words [font-weight:var(--hui-font-weight-medium)]">
                {categoryName(event)}
              </span>
              <span className={cn("flex shrink-0 items-center gap-[var(--hui-space-3)]", metaText)}>
                {event.severity && (
                  <span className="inline-flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]">
                    <SeverityBars severity={event.severity} />
                    {labels.severity[event.severity]}
                  </span>
                )}
                <ActionLabel event={event} labels={labels} />
              </span>
            </div>
            <EventFacts event={event} labels={labels} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Three small bars, filled to the severity, so it reads without color. */
function SeverityBars({ severity }: { severity: GuardrailSeverity }) {
  const level = severity === "high" ? 3 : severity === "medium" ? 2 : 1
  return (
    <span aria-hidden="true" className="inline-flex items-end gap-[1.5px]">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-[3px] rounded-[1px]",
            bar === 1 ? "h-[5px]" : bar === 2 ? "h-[8px]" : "h-[11px]",
            bar <= level
              ? "bg-[var(--hui-color-foreground-base-primary)]"
              : "bg-[color-mix(in_oklch,var(--hui-color-foreground-base-primary)_18%,transparent)]"
          )}
        />
      ))}
    </span>
  )
}

export { GuardrailNotice, RedactedText }
