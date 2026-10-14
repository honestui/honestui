"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  LoaderCircle as LoaderCircleIcon,
  Sparkles as SparklesIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.js"

export type RecordsTableColumn = {
  id: string
  header: string
  /** Marks a column whose cells an agent fills in. */
  isGenerated?: boolean
}

export type GeneratedCell =
  | { status: "queued" }
  | { status: "running" }
  | { status: "done"; value: React.ReactNode }
  | { status: "error"; message?: string }

export type RecordsTableRow = {
  id: string
  /** Names the row in button labels, such as the record's title. */
  name: string
  /** The cell for each ordinary column `id`. */
  cells: Record<string, React.ReactNode>
  /** The state of each generated column `id`. A missing entry reads as queued. */
  generated?: Record<string, GeneratedCell>
}

export type RecordsTableLabels = {
  generated: string
  queued: string
  running: string
  failed: string
  retry: string
  retryCell: (column: string, row: string) => string
  progress: (done: number, total: number) => string
}

export const defaultRecordsTableLabels: RecordsTableLabels = {
  generated: "Generated",
  queued: "Queued",
  running: "Working…",
  failed: "Failed",
  retry: "Retry",
  retryCell: (column, row) => `Retry ${column} for ${row}`,
  progress: (done, total) => `${done} of ${total} generated cells done`,
}

export type RecordsTableProps = {
  /** Names the table for screen readers. */
  label: string
  columns: RecordsTableColumn[]
  rows: RecordsTableRow[]
  /** Passing it shows Retry in every failed cell. */
  onRetry?: (rowId: string, columnId: string) => void
  labels?: Partial<RecordsTableLabels>
  className?: string
}

/**
 * A table of records where some columns are filled in by an agent, cell by
 * cell. Each generated cell shows the state you pass for it: queued, running,
 * done with a value, or failed.
 */
function RecordsTable({
  label,
  columns,
  rows,
  onRetry,
  labels: labelsProp,
  className,
}: RecordsTableProps) {
  const labels = { ...defaultRecordsTableLabels, ...labelsProp }
  const generatedColumns = columns.filter((column) => column.isGenerated)
  const total = generatedColumns.length * rows.length
  const done = rows.reduce(
    (count, row) =>
      count +
      generatedColumns.filter((column) => row.generated?.[column.id]?.status === "done").length,
    0
  )

  return (
    <div data-slot="records-table" className={cn("flex w-full min-w-0 flex-col gap-[var(--hui-space-3)]", className)}>
      <Table variant="surface" aria-label={label}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} scope="col">
                <span className="flex items-center gap-[var(--hui-space-2)]">
                  {column.isGenerated && (
                    <>
                      <SparklesIcon aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="sr-only">{labels.generated}: </span>
                    </>
                  )}
                  {column.header}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={column.id} data-generated={column.isGenerated ? "" : undefined}>
                  {column.isGenerated ? (
                    <GeneratedCellContent
                      cell={row.generated?.[column.id] ?? { status: "queued" }}
                      labels={labels}
                      retryLabel={labels.retryCell(column.header, row.name)}
                      onRetry={onRetry ? () => onRetry(row.id, column.id) : undefined}
                    />
                  ) : (
                    row.cells[column.id]
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {total > 0 && (
        // Announced as the count changes, so progress is heard without reading every cell.
        <p
          role="status"
          className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
        >
          {labels.progress(done, total)}
        </p>
      )}
    </div>
  )
}

function GeneratedCellContent({
  cell,
  labels,
  retryLabel,
  onRetry,
}: {
  cell: GeneratedCell
  labels: RecordsTableLabels
  retryLabel: string
  onRetry?: () => void
}) {
  if (cell.status === "done") return <>{cell.value}</>

  if (cell.status === "error") {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-2)]">
        <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
          aria-hidden="true"
          className="size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
        />
        <span className="min-w-0 break-words">{cell.message ?? labels.failed}</span>
        {onRetry && (
          <Button variant="secondary" size="xs" aria-label={retryLabel} onClick={onRetry}>
            {labels.retry}
          </Button>
        )}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]">
      {cell.status === "running" && (
        <LoaderCircleIcon aria-hidden="true" className="size-3.5 shrink-0 motion-safe:animate-spin" />
      )}
      {cell.status === "running" ? labels.running : labels.queued}
    </span>
  )
}

export { RecordsTable }
