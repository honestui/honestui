"use client"

import * as React from "react"
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type InsightCardsLabels = {
  previous: string
  next: string
  position: (current: number, total: number) => string
}

export const defaultInsightCardsLabels: InsightCardsLabels = {
  previous: "Previous insight",
  next: "Next insight",
  position: (current, total) => `${current} of ${total}`,
}

// The Button primitive's disabled look, kept focusable with aria-disabled.
// Shared with Chat Thread's version pager; the outline variant also keeps its edge.
const pagerDisabled =
  "aria-disabled:cursor-not-allowed aria-disabled:bg-transparent aria-disabled:text-[var(--hui-color-foreground-base-tertiary)] aria-disabled:shadow-none aria-disabled:hover:bg-transparent aria-disabled:active:scale-100!"

export type InsightCardsProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** The heading, such as "Insights". */
  title: string
  /** One `InsightCard` for each insight. */
  children: React.ReactNode
  labels?: Partial<InsightCardsLabels>
}

/**
 * A set of findings shown one at a time, with buttons to move between them.
 * It never advances by itself.
 */
function InsightCards({ title, children, labels: labelsProp, className, ...props }: InsightCardsProps) {
  const labels = { ...defaultInsightCardsLabels, ...labelsProp }
  const cards = React.Children.toArray(children)
  const [index, setIndex] = React.useState(0)
  const current = Math.min(index, Math.max(cards.length - 1, 0))
  const headingId = React.useId()

  if (cards.length === 0) return null

  return (
    <section
      aria-labelledby={headingId}
      data-slot="insight-cards"
      className={cn(
        "flex w-full min-w-0 flex-col gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
        className
      )}
      {...props}
    >
      <div className="flex min-h-[var(--hui-control-height-sm,var(--hui-space-8))] items-center gap-[var(--hui-space-3)]">
        <p id={headingId} title={title} className="m-0 min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]">
          {title}
        </p>
        {cards.length > 1 && (
          <div className="flex shrink-0 items-center gap-[var(--hui-space-1)]">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.previous}
              // aria-disabled keeps focus on the button at either end.
              aria-disabled={current === 0}
              className={cn(pagerDisabled, "aria-disabled:border-[var(--hui-color-border-base-primary)]")}
              onClick={() => setIndex(Math.max(current - 1, 0))}
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
            <span
              aria-live="polite"
              className="px-[var(--hui-space-2)] text-center whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
            >
              {/* Tabular figures on the digits only, since the tabular feature can also widen letters. */}
              {labels.position(current + 1, cards.length)
                .split(/(\d+)/)
                .map((part, partIndex) =>
                  partIndex % 2 === 1 ? (
                    <span key={partIndex} className="tabular-nums">
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.next}
              aria-disabled={current === cards.length - 1}
              className={cn(pagerDisabled, "aria-disabled:border-[var(--hui-color-border-base-primary)]")}
              onClick={() => setIndex(Math.min(current + 1, cards.length - 1))}
            >
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {/* Only the current card is mounted, so charts in the others do not run
          until a person reaches them. The pager sits above the card, so a
          shorter or taller card never moves it. A new card fades in. */}
      <div
        key={current}
        className="flex min-w-0 flex-col motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out motion-safe:starting:opacity-0"
      >
        {cards[current]}
      </div>
    </section>
  )
}

export type InsightCardProps = Omit<React.ComponentProps<"article">, "title"> & {
  /** The finding, stated as a sentence. */
  title: React.ReactNode
}

/** One insight: its finding, then the evidence, such as a chart or a figure. */
function InsightCard({ title, className, children, ...props }: InsightCardProps) {
  return (
    <article
      data-slot="insight-card"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-[var(--hui-space-4)] rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-5)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <p className="m-0 break-words [font-weight:var(--hui-font-weight-medium)]">
        {title}
      </p>
      {children}
    </article>
  )
}

export { InsightCards, InsightCard }
