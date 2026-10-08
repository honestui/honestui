"use client"

import * as React from "react"

import {
  PasteTable,
  type PasteTableColumn,
} from "@/registry/default/product/paste-table/paste-table"

import { PasteTableSampleButton } from "./paste-table-sample-button"

const columns: PasteTableColumn[] = [
  { key: "name", label: "Name", aliases: ["Full name"], required: true },
  {
    key: "email",
    label: "Email",
    aliases: ["E-mail"],
    required: true,
    validate: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? undefined : "Enter an email address, such as name@example.com",
  },
  { key: "seats", label: "Seats", type: "number" },
  { key: "startDate", label: "Start date", type: "date", dateOrder: "mdy" },
]

// Sample clipboard rows, as a spreadsheet would copy them. Three cells are wrong on purpose.
const sampleRows = [
  ["Full name", "E-mail", "Seats", "Start date"],
  ["Ana Ruiz", "ana@northwind.example", "12", "3/4/2026"],
  ["Li Wei", "li.wei@northwind", "1,250", "03/18/2026"],
  ["Sam Cole", "sam@northwind.example", "five", "2026-04-01"],
  ["Dee Park", "dee@northwind.example", "3", "4/31/2026"],
]

/** Nothing leaves the page: the readout shows the rows `onImport` received. */
export default function PasteTableDemo() {
  const [imported, setImported] = React.useState<Record<string, unknown>[] | null>(null)

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <PasteTableSampleButton rows={sampleRows} />
      <PasteTable aria-label="Import contacts" columns={columns} onImport={setImported} />
      {imported && (
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
          Last import: {imported.map((row) => `${row.name} (${row.startDate ?? "no start date"})`).join(", ")}.
        </p>
      )}
    </div>
  )
}
