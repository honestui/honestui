"use client"

import * as React from "react"

import {
  PasteTable,
  type PasteTableColumn,
} from "@/registry/default/product/paste-table/paste-table"

import { PasteTableSampleButton } from "./paste-table-sample-button"

const columns: PasteTableColumn[] = [
  { key: "code", label: "Code", required: true },
  { key: "discount", label: "Discount", type: "number", required: true },
]

// Sample discount codes with no header row, so fields are assigned by column order.
const sampleRows = [
  ["SPRING", "15"],
  ["LOYAL", "20"],
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * There is no server behind this preview. The first attempt is rejected on
 * purpose to show the failure state; the next attempt resolves.
 */
export default function PasteTableFailureExample() {
  const attempts = React.useRef(0)

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <PasteTableSampleButton rows={sampleRows} />
      <PasteTable
        aria-label="Import discount codes"
        columns={columns}
        onImport={async () => {
          attempts.current += 1
          await wait(600)
          if (attempts.current === 1) {
            throw new Error("This preview rejects the first attempt.")
          }
        }}
      />
    </div>
  )
}
