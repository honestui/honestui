"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"

/**
 * Docs affordance: puts prepared rows on the clipboard, so a visitor without
 * a spreadsheet open can paste something real into the importer.
 */
export function PasteTableSampleButton({ rows }: { rows: string[][] }) {
  const [status, setStatus] = React.useState<"idle" | "copied" | "blocked">("idle")

  async function copy() {
    try {
      await navigator.clipboard.writeText(rows.map((cells) => cells.join("\t")).join("\n"))
      setStatus("copied")
    } catch {
      setStatus("blocked")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-[var(--hui-space-3)]">
      <Button variant="ghost" size="sm" onClick={copy}>
        Copy sample rows
      </Button>
      <span
        role="status"
        className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
      >
        {status === "copied" && "Sample rows copied. Paste them into the field."}
        {status === "blocked" && "The browser blocked copying. Paste rows from your own spreadsheet instead."}
      </span>
    </div>
  )
}
