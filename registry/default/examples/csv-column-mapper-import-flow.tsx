"use client"

import * as React from "react"
import { ArrowLeft as ArrowLeftIcon, FileSpreadsheet as FileSpreadsheetIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import {
  CsvColumnMapper,
  type CsvMappingResult,
} from "@/registry/default/product/csv-column-mapper/csv-column-mapper"
import {
  PasteTable,
  parseClipboardTable,
  type PasteTableColumn,
} from "@/registry/default/product/paste-table/paste-table"
import { Button } from "@/registry/default/ui/button"

// One schema for both steps: CSV Column Mapper reads key, label, type, aliases, and
// required; Paste Table also reads the parsing and validation settings.
const columns: PasteTableColumn[] = [
  { key: "name", label: "Name", required: true },
  {
    key: "email",
    label: "Email",
    required: true,
    validate: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? undefined : "Enter an email address, such as name@example.com",
  },
  { key: "company", label: "Company" },
  { key: "seats", label: "Seats", type: "number", aliases: ["Licenses"] },
  { key: "startDate", label: "Start date", type: "date", dateOrder: "mdy" },
]

const SAMPLE_FILE = `Contact,Work email,Company name,Licenses,Start
Ana Ruiz,ana@northwind.example,"Northwind, Inc.",12,3/4/2026
Li Wei,li.wei@northwind,Contoso,"1,250",03/18/2026
Sam Cole,sam@fabrikam.example,Fabrikam,five,2026-04-01
Dee Park,dee@tailspin.example,Tailspin Toys,3,4/31/2026`

type Step =
  | { name: "choose"; imported?: number }
  | { name: "map"; fileName: string; headers: string[]; rows: string[][] }
  | { name: "review"; fileName: string; headers: string[]; rows: string[][]; result: CsvMappingResult }

const STEPS = ["Choose file", "Map columns", "Review and import"] as const

/**
 * A complete import: read a CSV, map its columns with type hints, then fix
 * cells in Paste Table before importing. Nothing leaves the page.
 */
export default function CsvColumnMapperImportFlow() {
  const [step, setStep] = React.useState<Step>({ name: "choose" })
  const [readError, setReadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const current = step.name === "choose" ? 0 : step.name === "map" ? 1 : 2

  function open(fileName: string, text: string) {
    const table = parseClipboardTable(text, ",")
    if (table.length < 2) {
      setReadError(`${fileName} has no rows under its header.`)
      return
    }
    setReadError(null)
    setStep({ name: "map", fileName, headers: table[0], rows: table.slice(1) })
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-[var(--hui-space-5)]">
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-1)] p-0 [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "flex items-center gap-[var(--hui-space-2)]",
              index === current
                ? "text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]"
                : "text-[var(--hui-color-foreground-base-secondary)]"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 items-center justify-center rounded-full tabular-nums [font-size:var(--hui-font-size-mini)]",
                index === current
                  ? "bg-[var(--hui-color-background-neutral-emphasis,var(--hui-color-foreground-base-primary))] text-[var(--hui-color-background-base-primary)]"
                  : "border-[0.5px] border-[var(--hui-color-border-base-secondary)]"
              )}
            >
              {index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step.name === "choose" && (
        <div className="flex flex-col items-center gap-[var(--hui-space-4)] rounded-[var(--hui-radius-2)] border-[0.5px] border-dashed border-[var(--hui-color-border-base-secondary)] px-[var(--hui-space-6)] py-[var(--hui-space-8)] text-center">
          <FileSpreadsheetIcon aria-hidden="true" className="size-6 text-[var(--hui-color-foreground-base-secondary)]" />
          <div className="flex flex-col gap-[var(--hui-space-1)]">
            <p className="m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]">
              Import contacts from a CSV file
            </p>
            <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
              Any column names work. You will match them to fields next.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-[var(--hui-space-2)]">
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose CSV file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              tabIndex={-1}
              aria-hidden="true"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) open(file.name, await file.text())
              }}
            />
            <Button size="sm" onClick={() => open("contacts.csv", SAMPLE_FILE)}>
              Use sample file
            </Button>
          </div>
          <p role="status" className="m-0 text-[var(--hui-color-foreground-base-primary)] empty:hidden [font-size:var(--hui-font-size-small)]">
            {readError ??
              (step.imported !== undefined && `Imported ${step.imported} ${step.imported === 1 ? "contact" : "contacts"}.`)}
          </p>
        </div>
      )}

      {step.name === "map" && (
        <CsvColumnMapper
          aria-label={`Map columns from ${step.fileName}`}
          labels={{ title: step.fileName }}
          headers={step.headers}
          rows={step.rows}
          fields={columns}
          onCancel={() => setStep({ name: "choose" })}
          onConfirm={(result) => setStep({ ...step, name: "review", result })}
        />
      )}

      {step.name === "review" && (
        <div className="flex min-w-0 flex-col gap-[var(--hui-space-3)]">
          <Button
            variant="ghost"
            size="sm"
            className="-ms-[var(--hui-space-3)] self-start"
            onClick={() => setStep({ name: "map", fileName: step.fileName, headers: step.headers, rows: step.rows })}
          >
            <ArrowLeftIcon aria-hidden="true" className="rtl:rotate-180" />
            Back to mapping
          </Button>
          <PasteTable
            aria-label={`Review contacts from ${step.fileName}`}
            columns={columns}
            defaultRows={step.result.table}
            onImport={(rows) => setStep({ name: "choose", imported: rows.length })}
          />
        </div>
      )}
    </div>
  )
}
