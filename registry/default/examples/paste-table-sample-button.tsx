"use client"

import * as React from "react"
import { Check as CheckIcon, Copy as CopyIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"

/**
 * Docs affordance: puts prepared rows on the clipboard, so a visitor without
 * a spreadsheet open can paste something real into the importer. With a
 * `title`, it renders as the preview's header row: title and description on
 * the left, the copy action on the right.
 */
export function PasteTableSampleButton({
  rows,
  title,
  description,
}: {
  rows: string[][]
  title?: React.ReactNode
  description?: React.ReactNode
}) {
  const [status, setStatus] = React.useState<"idle" | "copied" | "blocked">("idle")

  React.useEffect(() => {
    if (status !== "copied") return
    const timer = window.setTimeout(() => setStatus("idle"), 2400)
    return () => window.clearTimeout(timer)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(rows.map((cells) => cells.join("\t")).join("\n"))
      setStatus("copied")
    } catch {
      setStatus("blocked")
    }
  }

  const helper =
    status === "copied"
      ? "Copied. Paste into the field below."
      : status === "blocked"
        ? "The browser blocked copying. Paste rows from your own spreadsheet instead."
        : description

  return (
    <div className="flex flex-col gap-[var(--hui-space-3)] sm:flex-row sm:items-center sm:justify-between sm:gap-[var(--hui-space-5)]">
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-1)]">
        {title && (
          <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]">
            {title}
          </p>
        )}
        <span
          role="status"
          className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] empty:hidden"
        >
          {helper}
        </span>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 self-start sm:self-center" onClick={copy}>
        {status === "copied" ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        Copy sample rows
      </Button>
    </div>
  )
}
