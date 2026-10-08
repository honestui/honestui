"use client"

import * as React from "react"

import {
  PasteTable,
  type PasteTableColumn,
} from "@/registry/default/product/paste-table/paste-table"

import { PasteTableSampleButton } from "./paste-table-sample-button"

const statuses: Record<string, "active" | "paused"> = {
  active: "active",
  aktiv: "active",
  paused: "paused",
  pausiert: "paused",
}

const columns: PasteTableColumn[] = [
  {
    key: "sku",
    label: "SKU",
    aliases: ["Artikelnummer"],
    required: true,
    validate: (value) => (/^[A-Z]{2}-\d{4}$/.test(String(value)) ? undefined : "Use two letters, a hyphen, and four digits, such as KB-1042"),
  },
  {
    key: "price",
    label: "Price",
    aliases: ["Preis"],
    type: "number",
    decimalSeparator: ",",
    required: true,
    validate: (value) => (Number(value) > 0 ? undefined : "Enter a price above zero"),
  },
  { key: "validFrom", label: "Valid from", aliases: ["Gültig ab"], type: "date", dateOrder: "dmy" },
  {
    key: "validTo",
    label: "Valid to",
    aliases: ["Gültig bis"],
    type: "date",
    dateOrder: "dmy",
    // Both dates are ISO strings by now, so they compare as text.
    validate: (value, { row }) =>
      typeof row.validFrom === "string" && String(value) < row.validFrom
        ? "Choose a date on or after Valid from"
        : undefined,
  },
  {
    key: "status",
    label: "Status",
    parse: (raw) => {
      const status = statuses[raw.toLowerCase()]
      return status ? { value: status } : { error: "Enter Active or Paused" }
    },
  },
]

// Sample price list copied from a German-language sheet: comma decimals and day-first dates.
const sampleRows = [
  ["Artikelnummer", "Preis", "Gültig ab", "Gültig bis", "Status", "Notiz"],
  ["KB-1042", "1.249,90", "01.03.2026", "31.03.2026", "Aktiv", "Frühjahr"],
  ["KB-1043", "89,5", "15.03.2026", "01.03.2026", "Pausiert", ""],
  ["kb1044", "0", "01.04.2026", "", "Entwurf", ""],
]

export default function PasteTableValidationExample() {
  const [imported, setImported] = React.useState<Record<string, unknown>[] | null>(null)

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <PasteTableSampleButton rows={sampleRows} />
      <PasteTable aria-label="Import price list" columns={columns} onImport={setImported} />
      {imported && (
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
          Last import: {imported.map((row) => `${row.sku} at ${row.price} (${row.status ?? "no status"})`).join(", ")}.
        </p>
      )}
    </div>
  )
}
