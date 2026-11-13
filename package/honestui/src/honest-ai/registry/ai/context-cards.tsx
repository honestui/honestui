import * as React from "react"
import { ArrowUpRight as ArrowUpRightIcon, FileText as FileTextIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"

export type ContextChunk = {
  id: string
  title: string
  /** The retrieved passage. */
  body: string
  /** A rank, score, or size shown beside the title, such as "Rank 1" or "290 characters". */
  meta?: string
  /** Where the passage came from. With `href`, it is a link. */
  source?: { label: string; href?: string }
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/** Tabular figures on the digits only, since the tabular feature can also widen letters. */
function TabularDigits({ text }: { text: string }) {
  return text.split(/(\d[\d.,]*)/).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="tabular-nums">
        {part}
      </span>
    ) : (
      part
    )
  )
}

/** The host name of an absolute address, without "www.", or nothing for a relative one. */
function domainOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return undefined
  }
}

export type ContextCardsProps = Omit<React.ComponentProps<"section">, "children" | "title"> & {
  /** The heading, such as "Retrieved context". */
  title: string
  chunks: ContextChunk[]
  /** Shown when `chunks` is empty. */
  emptyMessage?: string
}

/** The passages an agent retrieved, each with its title, text, and source. */
function ContextCards({
  title,
  chunks,
  emptyMessage = "Nothing was retrieved.",
  className,
  ...props
}: ContextCardsProps) {
  const headingId = React.useId()

  return (
    <section
      data-slot="context-cards"
      aria-labelledby={headingId}
      className={cn(
        "flex w-full min-w-0 flex-col gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)]",
        regularText,
        className
      )}
      {...props}
    >
      <p className="m-0 flex items-baseline gap-[var(--hui-space-3)]">
        <span id={headingId} className="[font-weight:var(--hui-font-weight-medium)]">
          {title}
        </span>
        <span className="tabular-nums text-[var(--hui-color-foreground-base-secondary)]">{chunks.length}</span>
      </p>

      {chunks.length === 0 ? (
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)]">{emptyMessage}</p>
      ) : (
        <ul role="list" className="m-0 flex list-none flex-col gap-[var(--hui-space-3)] p-0">
          {chunks.map((chunk) => (
            <li
              key={chunk.id}
              data-slot="context-card"
              className="flex min-w-0 flex-col gap-[var(--hui-space-2)] overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-5)] shadow-[var(--hui-shadow-feather)]"
            >
              {/* Long metadata wraps under the title rather than truncating. */}
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-1)]">
                {/* Wraps to a second line before truncating, so close titles stay distinguishable. */}
                <span className="line-clamp-2 min-w-0 flex-1 basis-40 break-words [font-weight:var(--hui-font-weight-medium)]">
                  {chunk.title}
                </span>
                {chunk.meta && (
                  <span className={cn("min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
                    <TabularDigits text={chunk.meta} />
                  </span>
                )}
              </div>
              <p className="m-0 break-words text-[var(--hui-color-foreground-base-secondary)]">{chunk.body}</p>
              {chunk.source && (
                <div className="pt-[var(--hui-space-2)]">
                  <ContextSource source={chunk.source} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ContextSource({ source }: { source: NonNullable<ContextChunk["source"]> }) {
  const domain = source.href ? domainOf(source.href) : undefined
  const layout = cn(
    "inline-flex min-h-6 max-w-full items-center gap-x-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-3)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-primary)]",
    smallText
  )
  // The label wraps rather than truncating, so a long document name stays readable.
  const label = <span className="min-w-0 break-words">{source.label}</span>

  // Without a link there is nothing to press, so it reads as a plain note, not a chip.
  if (!source.href) {
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-start gap-x-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
          smallText
        )}
      >
        <FileTextIcon aria-hidden="true" className="mt-[var(--hui-space-1)] size-3 shrink-0" />
        {label}
      </span>
    )
  }

  return (
    <a
      href={source.href}
      className={cn(
        layout,
        "no-underline outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-neutral-secondary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"
      )}
    >
      {label}
      {domain && domain !== source.label && (
        <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">{domain}</span>
      )}
      <ArrowUpRightIcon aria-hidden="true" className="size-3 shrink-0 text-[var(--hui-color-foreground-base-secondary)]" />
    </a>
  )
}

export { ContextCards }
