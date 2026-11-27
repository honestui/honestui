"use client"

import * as React from "react"

import {
  RecordsTable,
  type GeneratedCell,
  type RecordsTableRow,
} from "@/registry/honest-ai/ai/records-table"
import { Button } from "@/registry/default/ui/button"

// Sample records and the summary each row resolves to.
const sampleRecords = [
  { id: "a", name: "Northwind Dairy", region: "EMEA", summary: "Pays on time; two open invoices." },
  { id: "b", name: "Harbor Paper Co.", region: "APAC", summary: "One invoice 14 days late." },
  { id: "c", name: "Ridge Tooling", region: "AMER", summary: "No open invoices." },
]

const CELL_MILLISECONDS = 1100

/**
 * No model fills these cells. A timer completes one cell at a time, and the
 * second one fails on its first pass to show the error state and Try again.
 * The first cell starts done so the opening view shows a finished summary;
 * running the sample again replays every cell from the start.
 */
export default function RecordsTableDemo() {
  const [completed, setCompleted] = React.useState(1)
  const [isRetried, setIsRetried] = React.useState(false)
  const isRunning = completed < sampleRecords.length

  React.useEffect(() => {
    if (!isRunning) return
    const timer = window.setTimeout(() => setCompleted((count) => count + 1), CELL_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [completed, isRunning])

  const rows = sampleRecords.map((record, index): RecordsTableRow => {
    let cell: GeneratedCell = { status: "queued" }
    if (index < completed) {
      cell =
        record.id === "b" && !isRetried
          ? { status: "error", message: "Timed out" }
          : { status: "done", value: record.summary }
    } else if (index === completed) {
      cell = { status: "running" }
    }
    return {
      id: record.id,
      name: record.name,
      cells: { name: record.name, region: record.region },
      generated: { summary: cell },
    }
  })

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      <RecordsTable
        label="Suppliers"
        columns={[
          { id: "name", header: "Supplier" },
          { id: "region", header: "Region" },
          { id: "summary", header: "Payment summary", isGenerated: true },
        ]}
        rows={rows}
        onRetry={() => setIsRetried(true)}
      />
      <Button
        variant="ghost"
        size="sm"
        className="text-[var(--hui-color-foreground-base-secondary)]"
        disabled={isRunning}
        onClick={() => {
          setIsRetried(false)
          setCompleted(0)
        }}
      >
        Run the sample again
      </Button>
    </div>
  )
}
