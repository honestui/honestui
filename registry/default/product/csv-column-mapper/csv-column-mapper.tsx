"use client"

import * as React from "react"
import {
  ArrowRight as ArrowRightIcon,
  LoaderCircle as LoaderCircleIcon,
  TriangleAlert as TriangleAlertIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/default/ui/table"

import type {
  CsvColumnMapperLabels,
  CsvColumnMapping,
  CsvColumnProfile,
  CsvMapperField,
  CsvMappingResult,
} from "./csv-column-mapper-types"
import {
  createMappingResult,
  defaultCsvColumnMapperLabels,
  getMissingRequiredFields,
  isTypeCompatible,
  profileColumns,
  setColumnField,
  suggestMapping,
} from "./csv-column-mapper-utils"

export type {
  CsvColumnMapperLabels,
  CsvColumnMapping,
  CsvColumnProfile,
  CsvColumnSuggestion,
  CsvDetectedType,
  CsvMapperField,
  CsvMappingResult,
  CsvMatchReason,
  CsvValueType,
} from "./csv-column-mapper-types"
export {
  applyMapping,
  createMappingResult,
  defaultCsvColumnMapperLabels,
  detectColumnType,
  detectValueType,
  getMissingRequiredFields,
  headerSimilarity,
  isTypeCompatible,
  normalizeHeader,
  profileColumns,
  setColumnField,
  suggestMapping,
  toMappedTable,
} from "./csv-column-mapper-utils"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
/** Table headings default to the tertiary text color, which is too faint for 12px text. */
const headText = "text-[var(--hui-color-foreground-base-secondary)]"
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"
/** Select treats `null` as "nothing chosen" and dims it, but skipping a column is a real choice. */
const SKIP = "\u0000skip"

export type CsvColumnMapperProps = Omit<React.ComponentProps<"section">, "onChange"> & {
  /** Column names from the file's first row. */
  headers: string[]
  /** Data rows, without the header row. */
  rows: string[][]
  /** The fields a column can be mapped to. Define them outside the component. */
  fields: CsvMapperField[]
  /** Controlled mapping: one field key, or `null`, per column. */
  mapping?: CsvColumnMapping | undefined
  /** Initial mapping when uncontrolled. Defaults to the suggested matches. */
  defaultMapping?: CsvColumnMapping | undefined
  onMappingChange?: ((mapping: CsvColumnMapping) => void) | undefined
  /**
   * Receives the mapping and the mapped rows. Return a promise to keep the
   * controls disabled until it settles.
   */
  onConfirm?: ((result: CsvMappingResult) => void | Promise<void>) | undefined
  /** Shows a Cancel button that calls this. */
  onCancel?: (() => void) | undefined
  /** Non-empty values shown for each column. */
  sampleCount?: number
  /** How alike a header and a field name must be, from 0 to 1, to match on open. */
  matchThreshold?: number
  disabled?: boolean
  labels?: Partial<CsvColumnMapperLabels> | undefined
}

function CsvColumnMapper({
  headers,
  rows,
  fields,
  mapping: mappingProp,
  defaultMapping,
  onMappingChange,
  onConfirm,
  onCancel,
  sampleCount = 3,
  matchThreshold = 0.72,
  disabled = false,
  labels: labelsProp,
  className,
  ...props
}: CsvColumnMapperProps) {
  const labels = React.useMemo(() => ({ ...defaultCsvColumnMapperLabels, ...labelsProp }), [labelsProp])
  const titleId = React.useId()
  const problemsRef = React.useRef<HTMLDivElement>(null)

  const profiles = React.useMemo(
    () => profileColumns(headers, rows, { sampleCount }),
    [headers, rows, sampleCount]
  )
  const suggested = React.useMemo(
    () => suggestMapping(headers, fields, { threshold: matchThreshold, profiles }),
    [headers, fields, matchThreshold, profiles]
  )

  const [uncontrolled, setUncontrolled] = React.useState<CsvColumnMapping>(
    () => defaultMapping ?? suggested.mapping
  )
  const mapping = mappingProp ?? uncontrolled
  const [status, setStatus] = React.useState<"idle" | "blocked" | "confirming">("idle")

  const missing = React.useMemo(() => getMissingRequiredFields(mapping, fields), [mapping, fields])
  const mappedCount = mapping.filter((key) => key !== null).length
  const isLocked = disabled || status === "confirming"

  function changeMapping(column: number, field: string | null) {
    const next = setColumnField(mapping, column, field)
    if (mappingProp === undefined) setUncontrolled(next)
    onMappingChange?.(next)
    setStatus("idle")
  }

  async function confirm() {
    if (isLocked || !onConfirm) return
    if (missing.length > 0) {
      setStatus("blocked")
      problemsRef.current?.focus()
      return
    }
    setStatus("confirming")
    try {
      await onConfirm(createMappingResult(rows, mapping, fields))
    } finally {
      setStatus("idle")
    }
  }

  const showProblems = missing.length > 0 && (status === "blocked" || mappedCount > 0)

  return (
    <section
      data-slot="csv-column-mapper"
      aria-labelledby={props["aria-label"] ? undefined : titleId}
      className={cn(
        "@container flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)]",
        className
      )}
      {...props}
    >
      <div
        data-slot="csv-column-mapper-header"
        className="flex min-h-12 flex-wrap items-center justify-between gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-1)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]"
      >
        <p
          id={titleId}
          className={cn(
            "m-0 text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]",
            regularText
          )}
        >
          {labels.title}
        </p>
        <p
          role="status"
          data-slot="csv-column-mapper-summary"
          className={cn("m-0 tabular-nums text-[var(--hui-color-foreground-base-secondary)]", smallText)}
        >
          {labels.summary({ mapped: mappedCount, columns: headers.length, rows: rows.length })}
        </p>
      </div>

      <div
        ref={problemsRef}
        data-slot="csv-column-mapper-problems"
        role="alert"
        tabIndex={-1}
        hidden={!showProblems}
        className={cn(
          "flex items-start gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:[outline-offset:-2px]",
          smallText
        )}
      >
        {showProblems && (
          <>
            <TriangleAlertIcon
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
            />
            <ul className="m-0 flex min-w-0 list-none flex-col gap-[var(--hui-space-1)] p-0">
              {missing.map((field) => (
                <li key={field.key}>{labels.missingRequired(field.label)}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Table data-slot="csv-column-mapper-table" className="table-fixed">
        <TableHeader className="static bg-[var(--hui-color-background-base-secondary)]">
          <TableRow className="bg-[var(--hui-color-background-base-secondary)]">
            <TableHead scope="col" className={cn("ps-[var(--hui-space-5)] pe-[var(--hui-space-3)]", headText, smallText)}>
              {labels.columnHeading}
            </TableHead>
            <TableHead scope="col" className={cn("hidden w-[34%] px-[var(--hui-space-3)] @2xl:table-cell", headText, smallText)}>
              {labels.samplesHeading}
            </TableHead>
            <TableHead scope="col" className="w-7 p-0" aria-hidden="true" />
            <TableHead scope="col" className={cn("w-[46%] ps-[var(--hui-space-3)] pe-[var(--hui-space-5)] @2xl:w-[16rem]", headText, smallText)}>
              {labels.fieldHeading}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <MapperRow
              key={profile.index}
              profile={profile}
              fields={fields}
              headers={headers}
              mapping={mapping}
              suggestion={suggested.suggestions[profile.index]}
              labels={labels}
              disabled={isLocked}
              onChange={(field) => changeMapping(profile.index, field)}
            />
          ))}
        </TableBody>
      </Table>

      {(onConfirm || onCancel) && (
        <div
          data-slot="csv-column-mapper-actions"
          className="flex flex-wrap items-center justify-between gap-[var(--hui-space-2)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)]"
        >
          {onCancel ? (
            <Button variant="ghost" size="sm" className="-ms-[var(--hui-space-3)]" disabled={isLocked} onClick={onCancel}>
              {labels.cancel}
            </Button>
          ) : (
            <span />
          )}
          {onConfirm && (
            <Button size="sm" className={forcedColorsBorder} disabled={isLocked} onClick={confirm}>
              {status === "confirming" && (
                <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
              )}
              {status === "confirming" ? labels.confirming : labels.confirm(rows.length)}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

function Samples({ profile, labels }: { profile: CsvColumnProfile; labels: CsvColumnMapperLabels }) {
  const text = profile.samples.join(", ")
  return (
    <span
      data-slot="csv-column-mapper-samples"
      title={text || undefined}
      className={cn("block min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]", smallText)}
    >
      {text || labels.noSamples}
    </span>
  )
}

function MapperRow({
  profile,
  fields,
  headers,
  mapping,
  suggestion,
  labels,
  disabled,
  onChange,
}: {
  profile: CsvColumnProfile
  fields: CsvMapperField[]
  headers: string[]
  mapping: CsvColumnMapping
  suggestion: { field: string; reason: "name" | "alias" | "similar" } | null | undefined
  labels: CsvColumnMapperLabels
  disabled: boolean
  onChange: (field: string | null) => void
}) {
  const hintId = React.useId()
  const value = mapping[profile.index] ?? null
  const field = fields.find((candidate) => candidate.key === value)
  const name = profile.header || `#${profile.index + 1}`
  const typeName = labels.typeNames[profile.type]
  const mismatch = field && !isTypeCompatible(field.type, profile.type)

  const items = React.useMemo(
    () => [
      { label: labels.skipColumn, value: SKIP },
      ...fields.map((candidate) => ({ label: candidate.label, value: candidate.key })),
    ],
    [fields, labels.skipColumn]
  )

  let hint: React.ReactNode = null
  if (!field) {
    hint = labels.notImported
  } else if (mismatch) {
    hint = (
      <>
        <TriangleAlertIcon
          aria-hidden="true"
          className="mt-[3px] size-3 shrink-0 text-[var(--hui-color-foreground-attention-primary)]"
        />
        {labels.typeMismatch({
          detected: typeName,
          field: field.label,
          expected: labels.typeNames[field.type ?? "text"],
        })}
      </>
    )
  } else if (suggestion && suggestion.field === value) {
    hint = labels.matchedBy[suggestion.reason]
  }

  return (
    <TableRow
      data-slot="csv-column-mapper-row"
      data-skipped={field ? undefined : ""}
      data-mismatch={mismatch ? "" : undefined}
    >
      <TableCell className="py-[var(--hui-space-4)] ps-[var(--hui-space-5)] pe-[var(--hui-space-3)] align-top whitespace-normal">
        <span className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
          <span
            className={cn(
              "truncate [font-weight:var(--hui-font-weight-medium)]",
              field
                ? "text-[var(--hui-color-foreground-base-primary)]"
                : "text-[var(--hui-color-foreground-base-secondary)]",
              regularText
            )}
            title={name}
          >
            {name}
          </span>
          <span className={cn("text-[var(--hui-color-foreground-base-secondary)]", smallText)}>
            {labels.columnMeta({ type: typeName, empty: profile.emptyCount })}
          </span>
          <span className="@2xl:hidden">
            <Samples profile={profile} labels={labels} />
          </span>
        </span>
      </TableCell>
      <TableCell className={cn("hidden px-[var(--hui-space-3)] py-[var(--hui-space-4)] align-top whitespace-normal @2xl:table-cell", smallText)}>
        <Samples profile={profile} labels={labels} />
      </TableCell>
      <TableCell className="px-0 py-[var(--hui-space-4)] text-center align-top" aria-hidden="true">
        <ArrowRightIcon
          className={cn(
            "mt-[9px] size-3.5 rtl:rotate-180",
            field ? "text-[var(--hui-color-foreground-base-secondary)]" : "text-[var(--hui-color-foreground-base-tertiary)]"
          )}
        />
      </TableCell>
      <TableCell className="py-[var(--hui-space-3)] ps-[var(--hui-space-3)] pe-[var(--hui-space-5)] align-top whitespace-normal">
        <span className="flex min-w-0 flex-col gap-[var(--hui-space-2)]">
          <Select
            items={items}
            value={value ?? SKIP}
            onValueChange={(next) => onChange(next === SKIP || next == null ? null : String(next))}
            disabled={disabled}
          >
            <SelectTrigger size="sm" aria-label={labels.fieldFor(name)} aria-describedby={hint ? hintId : undefined} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {items.map((item) => {
                const candidate = fields.find((entry) => entry.key === item.value)
                const usedAt = item.value === SKIP ? -1 : mapping.indexOf(item.value)
                const usedElsewhere = usedAt !== -1 && usedAt !== profile.index
                return (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="flex min-w-0 items-baseline gap-[var(--hui-space-2)]">
                      <span className="truncate">{item.label}</span>
                      {(candidate?.required || usedElsewhere) && (
                        <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-micro)]">
                          {[
                            candidate?.required ? labels.requiredSuffix : null,
                            usedElsewhere ? labels.usedBy(headers[usedAt] || `#${usedAt + 1}`) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectPopup>
          </Select>
          {hint && (
            <span
              id={hintId}
              data-slot="csv-column-mapper-hint"
              className={cn(
                "flex items-start gap-[var(--hui-space-2)] px-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)]",
                smallText
              )}
            >
              {hint}
            </span>
          )}
        </span>
      </TableCell>
    </TableRow>
  )
}

export { CsvColumnMapper }
