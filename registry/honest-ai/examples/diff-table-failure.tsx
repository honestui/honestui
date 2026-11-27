"use client"

import * as React from "react"

import { DiffTable } from "@/registry/honest-ai/ai/diff-table"

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * There is no server behind this preview. The first apply is rejected on
 * purpose to show the failure state; the next one resolves.
 */
export default function DiffTableFailureExample() {
  const attempts = React.useRef(0)

  return (
    <div className="w-full max-w-lg min-w-0">
      <DiffTable
        title="Proposed tag cleanup"
        columns={[{ id: "tag", header: "Tag" }]}
        rows={[
          { id: "dup", change: "removed", name: "billing-old", cells: { tag: "billing-old" } },
          { id: "new", change: "added", name: "billing", cells: { tag: "billing" } },
        ]}
        onApply={async () => {
          attempts.current += 1
          await wait(900)
          if (attempts.current === 1) throw new Error("This preview rejects the first apply.")
        }}
      />
    </div>
  )
}
