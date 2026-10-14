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
        "flex w-full min-w-0 flex-col gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-[var(--hui-space-3)]">
        <p id={headingId} className="m-0 [font-weight:var(--hui-font-weight-semibold)]">
          {title}
        </p>
        {cards.length > 1 && (
          <>
            <span
              aria-live="polite"
              className="text-[var(--hui-color-foreground-base-secondary)]"
            >
              {labels.position(current + 1, cards.length)}
            </span>
            <div className="ms-auto flex items-center gap-[var(--hui-space-1)]">
              <Button
                variant="link"
                size="icon-sm"
                aria-label={labels.previous}
                // aria-disabled keeps focus on the button at either end.
                aria-disabled={current === 0}
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                onClick={() => setIndex(Math.max(current - 1, 0))}
              >
                <ChevronLeftIcon aria-hidden="true" />
              </Button>
              <Button
                variant="link"
                size="icon-sm"
                aria-label={labels.next}
                aria-disabled={current === cards.length - 1}
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                onClick={() => setIndex(Math.min(current + 1, cards.length - 1))}
              >
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </div>
          </>
        )}
      </div>
      {cards[current]}
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
        "flex min-w-0 flex-col gap-[var(--hui-space-4)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-5)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <p className="m-0 break-words [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]">
        {title}
      </p>
      {children}
    </article>
  )
}

export { InsightCards, InsightCard }
