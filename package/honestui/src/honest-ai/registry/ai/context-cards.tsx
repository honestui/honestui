import * as React from "react"
import { ArrowUpRight as ArrowUpRightIcon, FileText as FileTextIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"

export type ContextChunk = {
  id: string
  title: string
  /** The retrieved passage. */
  body: string
  /** A size or score shown beside the title, such as "290 characters". */
  meta?: string
  /** Where the passage came from. With `href`, it is a link. */
  source?: { label: string; href?: string }
}

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

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
        smallText,
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-[var(--hui-space-3)]">
        <p id={headingId} className="m-0 [font-weight:var(--hui-font-weight-semibold)]">
          {title}
        </p>
        <span className="rounded-[var(--hui-radius-1)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-2)] tabular-nums text-[var(--hui-color-foreground-base-secondary)]">
          {chunks.length}
        </span>
      </div>

      {chunks.length === 0 ? (
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)]">{emptyMessage}</p>
      ) : (
        <ul role="list" className="m-0 flex list-none flex-col gap-[var(--hui-space-3)] p-0">
          {chunks.map((chunk) => (
            <li
              key={chunk.id}
              data-slot="context-card"
              className="min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]"
            >
              <div className="flex min-w-0 items-baseline gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
                <span className="min-w-0 truncate [font-weight:var(--hui-font-weight-medium)]">
                  {chunk.title}
                </span>
                {chunk.meta && (
                  <span className="ms-auto shrink-0 text-[var(--hui-color-foreground-base-secondary)]">
                    {chunk.meta}
                  </span>
                )}
              </div>
              <p className="m-0 break-words px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [line-height:var(--hui-line-height-regular)]">
                {chunk.body}
              </p>
              {chunk.source && (
                <div className="px-[var(--hui-space-4)] pb-[var(--hui-space-4)]">
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
  const layout =
    "inline-flex max-w-full items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-full)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-3)] py-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]"
  const content = (
    <>
      <FileTextIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{source.label}</span>
    </>
  )

  if (!source.href) {
    return <span className={layout}>{content}</span>
  }

  return (
    <a
      href={source.href}
      className={cn(
        layout,
        "underline decoration-[var(--hui-color-border-base-secondary)] underline-offset-2 outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)]"
      )}
    >
      {content}
      <ArrowUpRightIcon aria-hidden="true" className="size-3 shrink-0" />
    </a>
  )
}

export { ContextCards }
