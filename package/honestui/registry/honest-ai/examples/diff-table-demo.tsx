"use client"

import * as React from "react"

import { DiffTable, type DiffTableRow } from "@/registry/honest-ai/ai/diff-table"

// Column names and types read as identifiers.
const mono = (value: string) => <code className="font-mono [font-size:13px]">{value}</code>

// Sample rows.
const sampleRows: DiffTableRow[] = [
  { id: "legacy", change: "removed", name: "legacy_region", cells: { column: mono("legacy_region"), type: mono("text") } },
  { id: "fax", change: "removed", name: "fax_number", cells: { column: mono("fax_number"), type: mono("text") } },
  { id: "email", change: "unchanged", name: "email", cells: { column: mono("email"), type: mono("text") } },
  { id: "region", change: "added", name: "region_id", cells: { column: mono("region_id"), type: mono("uuid") } },
]

/** This preview applies nothing. It shows the row ids your `onApply` receives. */
export default function DiffTableDemo() {
  const [applied, setApplied] = React.useState<string[] | null>(null)

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col gap-[var(--hui-space-3)]">
      <DiffTable
        title="Proposed changes to the customers table"
        columns={[
          { id: "column", header: "Column" },
          { id: "type", header: "Type" },
        ]}
        rows={sampleRows}
        onApply={setApplied}
      />
      <p
        role="status"
        className="m-0 min-h-[1lh] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {applied ? `onApply received: ${applied.join(", ")}` : ""}
      </p>
    </div>
  )
}
