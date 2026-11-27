"use client"

import * as React from "react"

import {
  CsvColumnMapper,
  type CsvMapperField,
  type CsvMappingResult,
} from "@/registry/default/product/csv-column-mapper/csv-column-mapper"

const fields: CsvMapperField[] = [
  { key: "name", label: "Name", aliases: ["Full name"], required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "company", label: "Company", aliases: ["Organization", "Account"] },
  { key: "dealValue", label: "Deal value", type: "currency" },
  { key: "seats", label: "Seats", type: "integer" },
  { key: "renewsOn", label: "Renewal date", type: "date", aliases: ["Renews on"] },
  { key: "newsletter", label: "Newsletter", type: "boolean", aliases: ["Opted in"] },
]

// A CRM export with its own column names. "Deal size" matches nothing on its own,
// and two Seats cells are words, so that column reads as text.
const headers = ["Full Name", "E-mail address", "Organisation", "Deal size", "Seats", "Renews on", "Opted in", "Internal notes"]
const rows = [
  ["Ana Ruiz", "ana@northwind.example", "Northwind", "$12,400", "12", "03/04/2026", "yes", "Met at the summit"],
  ["Li Wei", "li.wei@contoso.example", "Contoso", "$3,250", "5", "04/18/2026", "no", ""],
  ["Sam Cole", "sam@fabrikam.example", "Fabrikam", "$48,000", "ten", "05/01/2026", "yes", "Needs SSO"],
  ["Dee Park", "dee@tailspin.example", "Tailspin Toys", "$900", "2", "06/30/2026", "no", ""],
  ["Omar Haddad", "omar@adatum.example", "Adatum", "$7,800", "8", "07/12/2026", "yes", "Renewal risk"],
  ["Mia Chen", "mia@litware.example", "Litware", "$15,100", "a dozen", "08/01/2026", "", ""],
]

/** Nothing leaves the page: the readout shows the first row `onConfirm` received. */
export default function CsvColumnMapperDemo() {
  const [result, setResult] = React.useState<CsvMappingResult | null>(null)
  const first = result?.rows[0]

  return (
    <div className="flex w-full min-w-0 flex-col gap-[var(--hui-space-4)]">
      <CsvColumnMapper
        aria-label="Map columns from customers.csv"
        headers={headers}
        rows={rows}
        fields={fields}
        onConfirm={setResult}
      />
      <p
        role="status"
        className="m-0 px-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] empty:hidden [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {first &&
          `Mapped ${result.rows.length} rows. First row: ${Object.entries(first)
            .map(([key, value]) => `${key} “${value}”`)
            .join(", ")}.`}
      </p>
    </div>
  )
}
