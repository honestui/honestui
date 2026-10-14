"use client"

import * as React from "react"

import { cn } from "../../lib/utils.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.js"

export type FilterTableColumn<Row> = {
  id: string
  header: string
  cell: (row: Row) => React.ReactNode
}

export type FilterTableFilter<Row> = {
  id: string
  label: string
  matches: (row: Row) => boolean
}

export type FilterTableProps<Row> = {
  /** Names the table for screen readers. */
  label: string
  columns: FilterTableColumn<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  /** One chip each. A chip shows how many rows it matches. */
  filters: FilterTableFilter<Row>[]
  /** The chip that shows every row. */
  allLabel?: string
  /** The group name read before the chips. */
  filtersLabel?: string
  /** Shown when the chosen filter matches no rows. */
  emptyMessage?: string
  activeFilter?: string | null
  defaultActiveFilter?: string | null
  onActiveFilterChange?: (filterId: string | null) => void
  className?: string
}

const chipText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * A table with a row of filter chips above it. Counts are computed from the
 * rows you pass, so a chip never disagrees with what it shows.
 */
function FilterTable<Row>({
  label,
  columns,
  rows,
  getRowId,
  filters,
  allLabel = "All",
  filtersLabel = "Filter rows",
  emptyMessage = "No rows match this filter.",
  activeFilter: activeFilterProp,
  defaultActiveFilter = null,
  onActiveFilterChange,
  className,
}: FilterTableProps<Row>) {
  const [uncontrolledFilter, setUncontrolledFilter] = React.useState(defaultActiveFilter)
  const activeFilter = activeFilterProp !== undefined ? activeFilterProp : uncontrolledFilter
  const active = filters.find((filter) => filter.id === activeFilter)
  const visibleRows = active ? rows.filter(active.matches) : rows

  const select = (filterId: string | null) => {
    if (activeFilterProp === undefined) setUncontrolledFilter(filterId)
    onActiveFilterChange?.(filterId)
  }

  const chips = [
    { id: null as string | null, label: allLabel, count: rows.length },
    ...filters.map((filter) => ({
      id: filter.id as string | null,
      label: filter.label,
      count: rows.filter(filter.matches).length,
    })),
  ]

  return (
    <div data-slot="filter-table" className={cn("flex w-full min-w-0 flex-col gap-[var(--hui-space-3)]", className)}>
      <div
        role="group"
        aria-label={filtersLabel}
        className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-2)]"
      >
        {chips.map((chip) => {
          const isActive = chip.id === (active?.id ?? null)
          return (
            <button
              key={chip.id ?? "all"}
              type="button"
              aria-pressed={isActive}
              onClick={() => select(chip.id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-full)] border-[0.5px] border-transparent bg-transparent px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] outline-none [font-weight:var(--hui-font-weight-medium)] motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] aria-pressed:border-[var(--hui-color-border-base-secondary)] aria-pressed:bg-[var(--hui-color-background-base-primary)] aria-pressed:text-[var(--hui-color-foreground-base-primary)] aria-pressed:shadow-[var(--hui-shadow-feather)]",
                chipText
              )}
            >
              {chip.label}
              <span className="tabular-nums text-[var(--hui-color-foreground-base-secondary)]">
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>

      <Table variant="surface" aria-label={label}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} scope="col">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-[var(--hui-color-foreground-base-secondary)]"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            visibleRows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <p role="status" className="sr-only">
        {`${visibleRows.length} of ${rows.length}`}
      </p>
    </div>
  )
}

export { FilterTable }
