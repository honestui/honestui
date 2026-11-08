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
import { Toggle, ToggleGroup } from "../../components/ui/toggle.js"

// The frame is drawn here rather than by a Table variant, so the component
// keeps it when Table is installed from Honest UI. Cells wrap between words
// first, so short values such as "EMEA" do not split at narrow widths.
const tableFrame =
  "overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)] [&_thead]:bg-[var(--hui-color-background-base-secondary)] [&_th]:bg-[var(--hui-color-background-base-secondary)] [&_td]:text-[var(--hui-color-foreground-base-primary)] [&_td]:[overflow-wrap:break-word] [&_tbody>tr:last-child>td]:border-b-0"

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
  /** Announced when the filter changes. Defaults to "Showing 3 of 12 rows". */
  countLabel?: (shown: number, total: number) => string
  activeFilter?: string | null
  defaultActiveFilter?: string | null
  onActiveFilterChange?: (filterId: string | null) => void
  className?: string
}

/**
 * A table with a segmented row of filters above it. Counts are computed from the
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
  countLabel = (shown, total) => `Showing ${shown} of ${total} rows`,
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

  // Segments are keyed by position, so a filter id can never collide with All.
  const chips = [
    { id: null as string | null, label: allLabel, count: rows.length },
    ...filters.map((filter) => ({
      id: filter.id as string | null,
      label: filter.label,
      count: rows.filter(filter.matches).length,
    })),
  ].map((chip, index) => ({ ...chip, value: String(index) }))
  const activeValue = chips.find((chip) => chip.id === (active?.id ?? null))?.value ?? "0"

  // Keep the chosen segment in view when the strip scrolls. Only the strip
  // scrolls; the page never moves. Skipped on first render.
  const stripRef = React.useRef<HTMLDivElement>(null)
  const shownValue = React.useRef(activeValue)
  React.useEffect(() => {
    if (shownValue.current === activeValue) return
    shownValue.current = activeValue
    const strip = stripRef.current
    const segment = strip?.querySelector<HTMLElement>("[data-pressed]")
    if (!strip || !segment) return
    const stripBox = strip.getBoundingClientRect()
    const segmentBox = segment.getBoundingClientRect()
    const inset = 32
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth"
    if (segmentBox.left < stripBox.left + inset) {
      strip.scrollBy({ left: segmentBox.left - stripBox.left - inset, behavior })
    } else if (segmentBox.right > stripBox.right - inset) {
      strip.scrollBy({ left: segmentBox.right - stripBox.right + inset, behavior })
    }
  }, [activeValue])

  return (
    <div data-slot="filter-table" className={cn("flex w-full min-w-0 flex-col gap-[var(--hui-space-3)]", className)}>
      {/* Scrolls sideways on narrow screens instead of wrapping above the table.
          A fade at the end edge shows more filters are out of view; set
          --filter-table-surface when the table sits on another surface. It follows
          the scroll position and clears at the end; where scroll-driven
          animation is unsupported, or nothing overflows, it stays hidden. */}
      <div className="relative min-w-0 [timeline-scope:--filter-table-scroll]">
        <div ref={stripRef} className="-m-[var(--hui-space-1)] flex min-w-0 overflow-x-auto p-[var(--hui-space-1)] [scroll-timeline:--filter-table-scroll_inline] [scrollbar-width:none]">
          <ToggleGroup
            size="sm"
            aria-label={filtersLabel}
            value={[activeValue]}
            onValueChange={(next) => {
              // Pressing the active segment would clear it; one filter always stays chosen.
              const chosen = chips.find((chip) => chip.value === next[0])
              if (chosen) select(chosen.id)
            }}
            className="shrink-0"
          >
            {chips.map((chip) => (
              <Toggle
                key={chip.value}
                value={chip.value}
                className="whitespace-nowrap"
              >
                {chip.label}
                <span className="tabular-nums text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-regular)]">
                  {chip.count}
                </span>
              </Toggle>
            ))}
          </ToggleGroup>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-[var(--hui-space-1)] -end-[var(--hui-space-1)] w-[var(--hui-space-9)] bg-[linear-gradient(to_left,var(--filter-table-surface,var(--hui-color-background-base-primary)),transparent)] opacity-0 rtl:bg-[linear-gradient(to_right,var(--filter-table-surface,var(--hui-color-background-base-primary)),transparent)]"
          style={{ animation: "hui-scroll-cue linear both", animationTimeline: "--filter-table-scroll" }}
        />
      </div>

      {/* The first and last cells clear the card's rounded corner. */}
      <div className={tableFrame}>
        <Table
          aria-label={label}
          className="[&_tr>*:first-child]:ps-[var(--hui-space-5)] [&_tr>*:last-child]:pe-[var(--hui-space-5)]"
        >
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
      </div>
      <p role="status" className="sr-only">
        {countLabel(visibleRows.length, rows.length)}
      </p>
    </div>
  )
}

export { FilterTable }
