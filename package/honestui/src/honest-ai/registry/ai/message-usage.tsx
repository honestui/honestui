"use client"

import * as React from "react"
import { ChevronDown as ChevronDownIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { formatTokenCount, TabularDigits } from "./context-meter.js"
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover.js"

/**
 * The token counts a provider reports for one model call. `cachedInput` is the
 * part of `input` read from the prompt cache, and `reasoning` is the part of
 * `output` the model spent thinking, as most providers report them.
 */
export type MessageUsageTokens = {
  input: number
  output: number
  cachedInput?: number
  reasoning?: number
}

/** List prices, in `currency` per `per` tokens. Defaults to US dollars per million tokens. */
export type ModelPricing = {
  input: number
  output: number
  /** The price of cached input tokens. Without it, cached tokens cost the same as input. */
  cachedInput?: number
  /** How many tokens each price covers. Defaults to 1,000,000. */
  per?: number
  /** An ISO 4217 code, such as "USD" or "EUR". Defaults to "USD". */
  currency?: string
}

export type MessageUsageItem = "tokens" | "cost" | "latency" | "model"

export type MessageUsageLabels = {
  title: string
  threadTitle: string
  /** The trigger's prefix for assistive technology, before the visible summary. */
  details: string
  tokens: (count: string) => string
  messages: (count: number) => string
  model: string
  input: string
  cached: string
  output: string
  reasoning: string
  total: string
  cost: string
  latency: string
  /** Marks a cost worked out from list prices, not billed by the provider. */
  estimatedCost: (cost: string) => string
  estimatedNote: string
  rates: (input: string, output: string, per: string) => string
  /** Formats every token count. */
  number: (value: number) => string
  /** Formats every cost. */
  currency: (value: number, currency: string) => string
  /** Formats a latency in milliseconds. */
  duration: (ms: number) => string
}

const costFormats = new Map<string, Intl.NumberFormat>()

/**
 * Formats a cost so that a small one is still visible: "$0.0042" rather than
 * "$0.00". Costs of a cent or more use two decimals.
 */
export function formatUsageCost(value: number, currency = "USD", locale = "en-US") {
  const small = value !== 0 && Math.abs(value) < 0.01
  const key = `${locale}|${currency}|${small}`
  let format = costFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...(small
        ? { minimumSignificantDigits: 2, maximumSignificantDigits: 2 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    })
    costFormats.set(key, format)
  }
  return format.format(value)
}

/** "820 ms" under a second, "2.4 s" under a minute, "1 min 12 s" beyond. */
export function formatUsageDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min ${Math.round(seconds - minutes * 60)} s`
}

export const defaultMessageUsageLabels: MessageUsageLabels = {
  title: "Usage",
  threadTitle: "Thread total",
  details: "Usage details",
  tokens: (count) => `${count} tokens`,
  messages: (count) => (count === 1 ? "1 message" : `${count} messages`),
  model: "Model",
  input: "Input",
  cached: "Cached",
  output: "Output",
  reasoning: "Reasoning",
  total: "Total",
  cost: "Cost",
  latency: "Latency",
  estimatedCost: (cost) => `~${cost}`,
  estimatedNote: "Estimated from list prices. Your bill may differ.",
  rates: (input, output, per) => `${input} in · ${output} out per ${per} tokens`,
  number: formatTokenCount,
  currency: (value, currency) => formatUsageCost(value, currency),
  duration: formatUsageDuration,
}

/**
 * The cost of one call at list prices. Cached input is billed at its own price
 * when you give one; reasoning is part of output and is billed with it.
 */
export function estimateCost(usage: MessageUsageTokens, pricing: ModelPricing) {
  const per = pricing.per ?? 1_000_000
  const cached = Math.min(Math.max(usage.cachedInput ?? 0, 0), Math.max(usage.input, 0))
  const freshInput = Math.max(usage.input, 0) - cached
  const cachedPrice = pricing.cachedInput ?? pricing.input
  return (
    (freshInput * pricing.input + cached * cachedPrice + Math.max(usage.output, 0) * pricing.output) / per
  )
}

/** Adds several calls' counts, such as every message in a thread. */
export function sumUsage(usages: MessageUsageTokens[]): MessageUsageTokens {
  return usages.reduce<MessageUsageTokens>(
    (total, usage) => ({
      input: total.input + usage.input,
      output: total.output + usage.output,
      cachedInput: (total.cachedInput ?? 0) + (usage.cachedInput ?? 0),
      reasoning: (total.reasoning ?? 0) + (usage.reasoning ?? 0),
    }),
    { input: 0, output: 0, cachedInput: 0, reasoning: 0 }
  )
}

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

export type MessageUsageProps = Omit<React.ComponentProps<"button">, "children"> & {
  usage: MessageUsageTokens
  /** The billed cost, if your provider reports one. Takes precedence over `pricing`. */
  cost?: number
  /** List prices to estimate the cost from. The estimate is marked as one. */
  pricing?: ModelPricing
  /** The currency of `cost`. Defaults to `pricing.currency`, then "USD". */
  currency?: string
  /** Time to the last token, in milliseconds. */
  latency?: number
  /** The model that answered, such as "gpt-5-mini". */
  model?: string
  /** "message" sits under one reply. "thread" totals a conversation. */
  variant?: "message" | "thread"
  /** With `variant="thread"`, how many messages the total covers. */
  messageCount?: number
  /** What the collapsed row shows, in order. */
  show?: MessageUsageItem[]
  labels?: Partial<MessageUsageLabels>
}

/**
 * Tokens, cost, and latency for one message or a whole thread, as a quiet row
 * that opens the breakdown. It shows the figures your provider reported and
 * prices nothing unless you pass `pricing`.
 */
function MessageUsage({
  usage,
  cost: costProp,
  pricing,
  currency: currencyProp,
  latency,
  model,
  variant = "message",
  messageCount,
  show = ["tokens", "cost", "latency"],
  labels: labelsProp,
  className,
  ...props
}: MessageUsageProps) {
  const labels = { ...defaultMessageUsageLabels, ...labelsProp }
  const titleId = React.useId()

  const currency = currencyProp ?? pricing?.currency ?? "USD"
  const estimated = costProp === undefined && pricing !== undefined
  const costValue = costProp ?? (pricing ? estimateCost(usage, pricing) : undefined)
  const costText =
    costValue === undefined
      ? undefined
      : estimated
        ? labels.estimatedCost(labels.currency(costValue, currency))
        : labels.currency(costValue, currency)
  const total = Math.max(usage.input, 0) + Math.max(usage.output, 0)
  const isThread = variant === "thread"

  const items: string[] = []
  if (isThread && messageCount !== undefined) items.push(labels.messages(messageCount))
  for (const item of show) {
    if (item === "tokens") items.push(labels.tokens(labels.number(total)))
    if (item === "cost" && costText) items.push(costText)
    if (item === "latency" && latency !== undefined && !isThread) items.push(labels.duration(latency))
    if (item === "model" && model) items.push(model)
  }

  const rows: { label: string; value: string; indent?: boolean; strong?: boolean }[] = [
    { label: labels.input, value: labels.number(usage.input) },
    ...(usage.cachedInput
      ? [{ label: labels.cached, value: labels.number(usage.cachedInput), indent: true }]
      : []),
    { label: labels.output, value: labels.number(usage.output) },
    ...(usage.reasoning
      ? [{ label: labels.reasoning, value: labels.number(usage.reasoning), indent: true }]
      : []),
    { label: labels.total, value: labels.number(total), strong: true },
  ]

  const per = pricing?.per ?? 1_000_000
  const perText = per === 1_000_000 ? "1M" : labels.number(per)

  return (
    <Popover>
      <PopoverTrigger
        data-slot="message-usage"
        data-variant={variant}
        className={cn(
          "group/usage inline-flex min-h-[var(--hui-control-height-sm,28px)] max-w-full cursor-pointer items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)] data-popup-open:text-[var(--hui-color-foreground-base-primary)]",
          metaText,
          className
        )}
        // One name built from the same strings, so it reads "Usage details: 19,604 tokens, ~$0.0042, 2.4 s".
        aria-label={`${labels.details}: ${isThread ? `${labels.threadTitle}, ` : ""}${items.join(", ")}`}
        {...props}
      >
        {isThread && (
          <span className="shrink-0 [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-primary)]">
            {labels.threadTitle}
          </span>
        )}
        <span data-slot="message-usage-summary" className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-2)]">
          {items.map((item, index) => (
            <React.Fragment key={`${item}-${index}`}>
              {index > 0 && (
                <span aria-hidden="true" className="select-none">
                  ·
                </span>
              )}
              <span className="whitespace-nowrap">
                <TabularDigits text={item} />
              </span>
            </React.Fragment>
          ))}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-3 shrink-0 opacity-70 motion-safe:transition-transform group-data-popup-open/usage:rotate-180"
        />
      </PopoverTrigger>
      <PopoverPopup align="start" aria-labelledby={titleId} className="w-72 max-w-[calc(100vw-2rem)]">
        <div data-slot="message-usage-details" className="flex flex-col gap-[var(--hui-space-3)]">
          <div className="flex items-baseline justify-between gap-[var(--hui-space-3)]">
            <p id={titleId} className="m-0 [font-weight:var(--hui-font-weight-medium)]">
              {isThread ? labels.threadTitle : labels.title}
            </p>
            {isThread && messageCount !== undefined ? (
              <span className="text-[var(--hui-color-foreground-base-secondary)] tabular-nums">
                {labels.messages(messageCount)}
              </span>
            ) : model ? (
              <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]" title={model}>
                <span className="sr-only">{`${labels.model}: `}</span>
                {model}
              </span>
            ) : null}
          </div>

          <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-y-[var(--hui-space-1)]">
            {rows.map((row) => (
              <React.Fragment key={row.label}>
                <dt
                  className={cn(
                    "min-w-0 break-words pe-[var(--hui-space-4)]",
                    row.strong
                      ? "mt-[var(--hui-space-1)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]"
                      : "text-[var(--hui-color-foreground-base-secondary)]",
                    row.indent && "ps-[var(--hui-space-4)]"
                  )}
                >
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "m-0 text-end",
                    row.strong &&
                      "mt-[var(--hui-space-1)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]",
                    row.indent && "text-[var(--hui-color-foreground-base-secondary)]"
                  )}
                >
                  <TabularDigits text={row.value} />
                </dd>
              </React.Fragment>
            ))}
            {costText !== undefined && (
              <>
                <dt className="pe-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)]">{labels.cost}</dt>
                <dd className="m-0 text-end">
                  <TabularDigits text={costText} />
                </dd>
              </>
            )}
            {latency !== undefined && !isThread && (
              <>
                <dt className="pe-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)]">{labels.latency}</dt>
                <dd className="m-0 text-end">
                  <TabularDigits text={labels.duration(latency)} />
                </dd>
              </>
            )}
          </dl>

          {estimated && pricing && (
            <p className={cn("m-0 break-words text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
              <TabularDigits
                text={labels.rates(
                  labels.currency(pricing.input, currency),
                  labels.currency(pricing.output, currency),
                  perText
                )}
              />
              <br />
              {labels.estimatedNote}
            </p>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  )
}

export { MessageUsage }
