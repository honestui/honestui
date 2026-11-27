"use client"

import * as React from "react"

import { FilterTable } from "@/registry/honest-ai/ai/filter-table"

type Run = { id: string; name: string; result: "passed" | "failed" }

// Sample runs.
const sampleRuns: Run[] = [
  { id: "r1", name: "Export totals", result: "passed" },
  { id: "r2", name: "Staging migration", result: "failed" },
  { id: "r3", name: "Ticket triage", result: "passed" },
]

export default function FilterTableControlledExample() {
  const [filter, setFilter] = React.useState<string | null>("failed")

  return (
    <div className="w-full max-w-lg min-w-0">
      <FilterTable
        label="Agent runs"
        rows={sampleRuns}
        getRowId={(row) => row.id}
        activeFilter={filter}
        onActiveFilterChange={setFilter}
        columns={[
          { id: "name", header: "Run", cell: (row) => row.name },
          {
            id: "result",
            header: "Result",
            cell: (row) => (
              <span className="inline-flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]">
                <span
                  aria-hidden="true"
                  className={
                    row.result === "passed"
                      ? "size-1.5 shrink-0 rounded-full bg-[var(--hui-color-foreground-base-primary)]"
                      : "size-1.5 shrink-0 rounded-full bg-[var(--hui-color-foreground-danger-primary)]"
                  }
                />
                {row.result === "passed" ? "Passed" : "Failed"}
              </span>
            ),
          },
        ]}
        filters={[
          { id: "passed", label: "Passed", matches: (row) => row.result === "passed" },
          { id: "failed", label: "Failed", matches: (row) => row.result === "failed" },
        ]}
      />
    </div>
  )
}
