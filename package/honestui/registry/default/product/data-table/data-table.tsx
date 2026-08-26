"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanStackTable,
  type VisibilityState,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Checkbox } from "@/registry/default/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/registry/default/ui/empty"
import { Skeleton } from "@/registry/default/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/default/ui/table"

import {
  DataTableProvider,
  getColumnTitle,
  useDataTableContext,
  type DataTableContextValue,
  type DataTableDensity,
} from "./data-table-context"
import { DataTableColumnHeader } from "./data-table-column-header"
import {
  DataTableFilter,
  type DataTableFilterConfig,
} from "./data-table-filter"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableSearch, DataTableToolbar } from "./data-table-toolbar"
import { DataTableViewOptions } from "./data-table-view-options"

type SearchConfig = {
  placeholder?: string
  debounceMs?: number
  ariaLabel?: string
}

type PageSizeConfig = {
  pageSizeOptions?: number[]
}

function isPaginationState(value: unknown): value is PaginationState {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PaginationState).pageIndex === "number" &&
    typeof (value as PaginationState).pageSize === "number"
  )
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  table?: TanStackTable<TData>
  children?: React.ReactNode

  search?: boolean | SearchConfig
  filters?: DataTableFilterConfig[]
  selectable?: boolean
  pagination?: boolean | PageSizeConfig | PaginationState
  pageSizeOptions?: number[]
  toolbarActions?: React.ReactNode
  density?: DataTableDensity
  framed?: boolean
  caption?: string
  getRowId?: (originalRow: TData, index: number) => string
  getRowLabel?: (row: Row<TData>) => string
  pageCount?: number

  loading?: boolean
  error?: string | null
  onRetry?: () => void
  rowCount?: number
  emptyState?: React.ReactNode
  noResultsState?: React.ReactNode

  manualSorting?: boolean
  manualFiltering?: boolean
  manualPagination?: boolean

  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  onPaginationChange?: OnChangeFn<PaginationState>
}

function resolveOnChange<T>(
  onChange: OnChangeFn<T> | undefined,
  getValue: () => T,
): OnChangeFn<T> | undefined {
  if (!onChange) {
    return undefined
  }

  return (updaterOrValue) => {
    const nextValue =
      typeof updaterOrValue === "function"
        ? (updaterOrValue as (previous: T) => T)(getValue())
        : updaterOrValue

    onChange(nextValue)
  }
}

export function dataTableFacetFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
) {
  if (!Array.isArray(filterValue) || filterValue.length === 0) {
    return true
  }

  return filterValue.includes(String(row.getValue(columnId)))
}

export function DataTable<TData>({
  columns,
  data,
  table: externalTable,
  children,

  search = false,
  filters,
  selectable = false,
  pagination: paginationProp = false,
  pageSizeOptions,
  toolbarActions,
  density = "default",
  framed = true,
  caption,
  getRowId,
  getRowLabel,
  pageCount,

  loading = false,
  error = null,
  onRetry,
  rowCount,
  emptyState,
  noResultsState,

  manualSorting = false,
  manualFiltering = false,
  manualPagination = false,

  sorting: controlledSorting,
  onSortingChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  onPaginationChange,
}: DataTableProps<TData>) {
  const facetIds = React.useMemo(
    () => new Set((filters ?? []).map((facet) => facet.columnId)),
    [filters],
  )

  const resolvedColumns = React.useMemo(() => {
    const prepared = columns.map((column) => {
      const id =
        (column as { id?: string }).id ??
        ("accessorKey" in column ? String(column.accessorKey) : undefined)

      if (
        id &&
        facetIds.has(id) &&
        !("filterFn" in column && column.filterFn)
      ) {
        return {
          ...column,
          filterFn: dataTableFacetFilterFn,
        } as ColumnDef<TData>
      }

      return column
    })

    if (selectable && !columns.some((column) => column.id === "select")) {
      prepared.unshift({
        id: "select",
        enableSorting: false,
        enableHiding: false,
        size: 44,
        cell: function SelectCell({ row }) {
          return <DataTableRowCheckbox row={row} getRowLabel={getRowLabel} />
        },
      } as ColumnDef<TData>)
    }

    return prepared
  }, [columns, facetIds, selectable, getRowLabel])

  const searchEnabled = !!search
  const searchConfig = typeof search === "object" ? search : undefined

  const paginationStateProvided = isPaginationState(paginationProp)
    ? paginationProp
    : undefined
  const pageSizeConfig =
    typeof paginationProp === "object" && !isPaginationState(paginationProp)
      ? paginationProp
      : undefined
  const paginationEnabled =
    paginationProp !== false ||
    !!paginationStateProvided ||
    !!onPaginationChange

  const state = {
    ...(controlledSorting !== undefined && { sorting: controlledSorting }),
    ...(controlledGlobalFilter !== undefined && {
      globalFilter: controlledGlobalFilter,
    }),
    ...(controlledColumnFilters !== undefined && {
      columnFilters: controlledColumnFilters,
    }),
    ...(controlledColumnVisibility !== undefined && {
      columnVisibility: controlledColumnVisibility,
    }),
    ...(controlledRowSelection !== undefined && {
      rowSelection: controlledRowSelection,
    }),
    ...(paginationStateProvided !== undefined && {
      pagination: paginationStateProvided,
    }),
  }

  const internalTable: TanStackTable<TData> = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting
      ? { manualSorting: true as const }
      : { getSortedRowModel: getSortedRowModel() }),
    ...(manualFiltering
      ? { manualFiltering: true as const }
      : { getFilteredRowModel: getFilteredRowModel() }),
    ...(manualPagination
      ? { manualPagination: true as const, pageCount }
      : paginationEnabled
        ? { getPaginationRowModel: getPaginationRowModel() }
        : {}),
    enableRowSelection: selectable,
    getRowId,
    ...(rowCount !== undefined && { rowCount }),
    state,
    ...(onSortingChange !== undefined && {
      onSortingChange: resolveOnChange(onSortingChange, () =>
        internalTable?.getState().sorting ?? [],
      ),
    }),
    ...(onGlobalFilterChange !== undefined && {
      onGlobalFilterChange: resolveOnChange(onGlobalFilterChange, () =>
        String(internalTable?.getState().globalFilter ?? ""),
      ),
    }),
    ...(onColumnFiltersChange !== undefined && {
      onColumnFiltersChange: resolveOnChange(onColumnFiltersChange, () =>
        internalTable?.getState().columnFilters ?? [],
      ),
    }),
    ...(onColumnVisibilityChange !== undefined && {
      onColumnVisibilityChange: resolveOnChange(
        onColumnVisibilityChange,
        () => internalTable?.getState().columnVisibility ?? {},
      ),
    }),
    ...(onRowSelectionChange !== undefined && {
      onRowSelectionChange: resolveOnChange(onRowSelectionChange, () =>
        internalTable?.getState().rowSelection ?? {},
      ),
    }),
    ...(onPaginationChange !== undefined && {
      onPaginationChange: resolveOnChange(onPaginationChange, () =>
        internalTable?.getState().pagination ?? { pageIndex: 0, pageSize: 10 },
      ),
    }),
  })

  const table = externalTable ?? internalTable

  const contextValue: DataTableContextValue<TData> = {
    table,
    caption,
    getRowLabel,
    loading,
    error,
    onRetry,
    rowCount,
    emptyState,
    noResultsState,
    selectable,
    density,
  }

  return (
    <DataTableProvider value={contextValue}>
      <div
        data-slot="data-table"
        data-density={density}
        className={cn(
          "w-full min-w-0",
          framed &&
            "overflow-clip rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]",
        )}
      >
        {children ?? (
          <>
            {(searchEnabled ||
              (filters && filters.length > 0) ||
              toolbarActions) && (
              <DataTableToolbar className="flex-wrap gap-[var(--hui-space-2)] border-b-[0.5px] p-[var(--hui-space-3)] sm:p-[var(--hui-space-4)]">
                {searchEnabled && (
                  <DataTableSearch
                    placeholder={searchConfig?.placeholder}
                    debounceMs={searchConfig?.debounceMs}
                    ariaLabel={searchConfig?.ariaLabel}
                  />
                )}
                {filters && filters.length > 0 && (
                  <DataTableFilter facets={filters} />
                )}
                <DataTableViewOptions />
                <div aria-hidden className="flex-1" />
                {toolbarActions}
              </DataTableToolbar>
            )}

            <DataTableContent />

            {(paginationEnabled || selectable) && (
              <DataTableFooter className="flex-wrap gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
                {selectable && <DataTableSelectionSummary />}
                {paginationEnabled && (
                  <DataTablePagination
                    pageSizeOptions={
                      pageSizeOptions ?? pageSizeConfig?.pageSizeOptions
                    }
                  />
                )}
              </DataTableFooter>
            )}
          </>
        )}
      </div>
    </DataTableProvider>
  )
}

function DataTableRowCheckbox<TData>({
  row,
  getRowLabel,
}: {
  row: Row<TData>
  getRowLabel?: (row: Row<TData>) => string
}) {
  return (
    <Checkbox
      aria-label={getRowLabel?.(row) ?? `Select row ${row.index + 1}`}
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  )
}

function DataTableEmptyMessage({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Empty className="p-[var(--hui-space-8)]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  )
}

function DataTableSelectAllCheckbox() {
  const { table } = useDataTableContext<unknown>()

  return (
    <Checkbox
      aria-label="Select all rows on this page"
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={
        table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    />
  )
}

export function DataTableContent({ className }: { className?: string }) {
  const {
    table,
    caption,
    loading,
    error,
    onRetry,
    emptyState,
    noResultsState,
    density,
  } = useDataTableContext<unknown>()

  const rows = table.getRowModel().rows
  const leafColumns = table.getVisibleLeafColumns()
  const columnCount = leafColumns.length

  const state = table.getState()
  const isFiltering =
    Boolean(state.globalFilter) ||
    Boolean(state.columnFilters && state.columnFilters.length > 0)

  const skeletonRowCount = Math.min(
    Math.max(state.pagination?.pageSize ?? 8, 6),
    10,
  )

  const alignClass = (align?: string) =>
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : undefined

  const headerMeta = (column: Column<unknown, unknown>) =>
    (column.columnDef.meta ?? {}) as {
      align?: "left" | "center" | "right"
    }

  return (
    <Table aria-label={caption} className={className}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {leafColumns.map((column) => {
            const sorted = column.getIsSorted()
            const meta = headerMeta(column)
            const canSort = column.getCanSort()

            return (
              <TableHead
                key={column.id}
                scope="col"
                aria-sort={
                  sorted === "asc"
                    ? "ascending"
                    : sorted === "desc"
                      ? "descending"
                      : undefined
                }
                className={alignClass(meta.align)}
              >
                {column.id === "select" ? (
                  <DataTableSelectAllCheckbox />
                ) : canSort ? (
                  <DataTableColumnHeader
                    column={column}
                    title={getColumnTitle(column)}
                    className={
                      meta.align === "right"
                        ? "justify-end"
                        : meta.align === "center"
                          ? "justify-center"
                          : undefined
                    }
                  />
                ) : (
                  getColumnTitle(column)
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>

      <TableBody>
        {error ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-28 text-center">
              <p>{error}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-[var(--hui-space-3)]"
                  onClick={onRetry}
                >
                  Try again
                </Button>
              )}
            </TableCell>
          </TableRow>
        ) : loading ? (
          Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
            <TableRow key={`loading-${rowIndex}`}>
              {leafColumns.map((column, columnIndex) => (
                <TableCell key={column.id}>
                  <Skeleton
                    className={cn(
                      "h-[var(--hui-space-5)]",
                      columnIndex % 3 === 1
                        ? "w-full max-w-24"
                        : columnIndex % 3 === 2
                          ? "w-12"
                          : "w-20",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="p-0">
              {isFiltering ? (
                noResultsState ?? (
                  <DataTableEmptyMessage
                    title="No results"
                    description="Nothing matches your current search and filters."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          table.setGlobalFilter("")
                          table.setColumnFilters([])
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                )
              ) : (
                emptyState ?? (
                  <DataTableEmptyMessage
                    title="No data yet"
                    description="Rows will appear here once they are added."
                  />
                )
              )}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              className="hover:bg-[var(--hui-color-background-base-primary-hover)]"
              data-state={row.getIsSelected() ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = (cell.column.columnDef.meta ?? {}) as {
                  align?: string
                }

                return (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      density === "compact" && "py-[var(--hui-space-2)]",
                      alignClass(meta.align),
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export function DataTableFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-footer"
      className={cn("flex items-center", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DataTableSelectionSummary({
  className,
  actions,
}: {
  className?: string
  actions?: React.ReactNode
}) {
  const { table } = useDataTableContext<unknown>()
  const selectedCount = Object.values(
    table.getState().rowSelection,
  ).filter(Boolean).length

  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      data-slot="data-table-selection-summary"
      className={cn(
        "flex flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-secondary)]",
        className,
      )}
    >
      <span>
        {selectedCount} {selectedCount === 1 ? "row" : "rows"} selected
      </span>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => table.resetRowSelection()}
      >
        Clear
      </Button>
      {actions}
    </div>
  )
}

export {
  DataTableColumnHeader,
  DataTableViewOptions,
  useDataTableContext,
  getColumnTitle,
  type DataTableDensity,
}
export {
  DataTableSearch,
  DataTableToolbar,
}
export { DataTableFilter, type DataTableFilterConfig }
export { DataTablePagination }
