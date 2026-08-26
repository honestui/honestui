"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type Column,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Checkbox } from "@/registry/default/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/registry/default/ui/empty"
import { Input } from "@/registry/default/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Skeleton } from "@/registry/default/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/default/ui/table"

import { DataGridColumnHeader } from "./data-grid-column-header"
import {
  DataGridProvider,
  getDataGridColumnMeta,
  getDataGridColumnTitle,
  useDataGridContext,
  type DataGridColumn,
  type DataGridColumnMeta,
  type DataGridDensity,
  type DataGridEditEvent,
  type DataGridFilterValue,
  type DataGridVirtualization,
} from "./data-grid-context"
import { DataGridPagination } from "./data-grid-pagination"
import {
  DataGridActiveFilters,
  DataGridColumnVisibility,
  DataGridExport,
  DataGridFilterTrigger,
  DataGridRefresh,
  DataGridSearch,
  DataGridToolbar,
  DataGridToolbarSpacer,
  type DataGridSearchProps,
} from "./data-grid-toolbar"
import { dataGridFilterFn, moveDataGridColumn } from "./data-grid-utils"

type DataGridSearchConfig = {
  placeholder?: string
  debounceMs?: number
  ariaLabel?: string
}

type DataGridPaginationConfig = {
  defaultPageSize?: number
  pageSizeOptions?: number[]
}

type DataGridToolbarConfig = {
  export?: boolean | { fileName?: string; onExport?: () => void }
  refresh?: { onRefresh: () => void | Promise<void> }
  actions?: React.ReactNode
}

function isPaginationState(value: unknown): value is PaginationState {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as PaginationState).pageIndex === "number" &&
      typeof (value as PaginationState).pageSize === "number",
  )
}

function isStateObject<T extends object>(value: unknown): value is T {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export interface DataGridProps<TData> {
  columns: DataGridColumn<TData, unknown>[]
  data: TData[]
  children?: React.ReactNode
  className?: string
  caption?: string
  getRowId?: (row: TData, index: number) => string
  getRowLabel?: (row: Row<TData>) => string
  getRowSelectionDisabledReason?: (row: Row<TData>) => string | undefined

  search?: boolean | DataGridSearchConfig
  sorting?: boolean | SortingState
  filters?: boolean | ColumnFiltersState
  inlineFilters?: boolean
  pagination?: boolean | DataGridPaginationConfig | PaginationState
  selection?: boolean | RowSelectionState | ((row: Row<TData>) => boolean)
  columnVisibility?: boolean | VisibilityState
  columnResize?: boolean
  columnReorder?: boolean
  columnPinning?: boolean | ColumnPinningState
  stickyHeader?: boolean
  keyboardNavigation?: boolean
  virtualize?: boolean | DataGridVirtualization
  density?: DataGridDensity
  maxHeight?: number | string
  toolbar?: DataGridToolbarConfig

  loading?: boolean
  refreshing?: boolean
  error?: string | null
  onRetry?: () => void
  rowCount?: number
  pageCount?: number
  emptyState?: React.ReactNode
  noResultsState?: React.ReactNode

  manualSorting?: boolean
  manualFiltering?: boolean
  manualPagination?: boolean

  defaultSorting?: SortingState
  defaultFilters?: ColumnFiltersState
  defaultGlobalSearch?: string
  defaultPagination?: PaginationState
  defaultSelection?: RowSelectionState
  defaultColumnVisibility?: VisibilityState
  defaultColumnOrder?: ColumnOrderState
  defaultColumnSizing?: ColumnSizingState
  defaultColumnPinning?: ColumnPinningState

  globalSearch?: string
  onGlobalSearchChange?: OnChangeFn<string>
  onSortingChange?: OnChangeFn<SortingState>
  onFiltersChange?: OnChangeFn<ColumnFiltersState>
  onPaginationChange?: OnChangeFn<PaginationState>
  onSelectionChange?: OnChangeFn<RowSelectionState>
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>
  columnSizing?: ColumnSizingState
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>
  onCellEdit?: (event: DataGridEditEvent<TData>) => void | Promise<void>
}

function normalizeColumns<TData>(
  columns: DataGridColumn<TData, unknown>[],
  selectable: boolean,
  pinSelection: boolean,
  getRowLabel?: (row: Row<TData>) => string,
  getRowSelectionDisabledReason?: (row: Row<TData>) => string | undefined,
) {
  const prepared = columns.map((column) => {
    const options = column as DataGridColumn<TData, unknown>
    const type = options.filter?.type ?? options.type ?? "text"
    const align =
      options.align ??
      (options.type === "number" || options.type === "currency" ? "right" : undefined)
    const meta: DataGridColumnMeta<TData> = {
      ...((column.meta ?? {}) as DataGridColumnMeta<TData>),
      ...(align && { align }),
      type,
      ...(options.filter && { filter: options.filter }),
      reorderable: options.reorderable ?? true,
      editable: options.editable ?? false,
      ...(options.edit && { edit: options.edit }),
      ...(options.hideBelow && { hideBelow: options.hideBelow }),
      ...(options.priority && { priority: options.priority }),
    }

    return {
      ...column,
      meta,
      enableSorting: options.sortable ?? column.enableSorting ?? true,
      enableColumnFilter:
        options.filterable ?? column.enableColumnFilter ?? Boolean(options.filter),
      enableHiding: options.hideable ?? column.enableHiding ?? true,
      enableResizing: options.resizable ?? column.enableResizing ?? true,
      enablePinning: options.pinnable ?? column.enablePinning ?? true,
      ...(options.filter && !column.filterFn && { filterFn: dataGridFilterFn }),
    } as DataGridColumn<TData, unknown>
  })

  if (selectable && !prepared.some((column) => column.id === "select")) {
    prepared.unshift({
      id: "select",
      header: "Select",
      size: 44,
      minSize: 44,
      maxSize: 44,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
      enableResizing: false,
      enablePinning: pinSelection,
      reorderable: false,
      meta: { align: "center", reorderable: false },
      cell: ({ row }) => {
        const label = getRowLabel?.(row) ?? `Select row ${row.index + 1}`
        const disabledReason = !row.getCanSelect()
          ? getRowSelectionDisabledReason?.(row)
          : undefined

        return (
          <Checkbox
            aria-label={disabledReason ? `${label}. ${disabledReason}` : label}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        )
      },
    } as DataGridColumn<TData, unknown>)
  }

  return prepared
}

export function DataGridRoot<TData>({
  columns,
  data,
  children,
  className,
  caption,
  getRowId,
  getRowLabel,
  getRowSelectionDisabledReason,
  search = false,
  sorting = true,
  filters = false,
  inlineFilters = false,
  pagination = false,
  selection = false,
  columnVisibility = false,
  columnResize = false,
  columnReorder = false,
  columnPinning = false,
  stickyHeader = false,
  keyboardNavigation = false,
  virtualize = false,
  density = "default",
  maxHeight,
  toolbar,
  loading = false,
  refreshing = false,
  error = null,
  onRetry,
  rowCount,
  pageCount,
  emptyState,
  noResultsState,
  manualSorting = false,
  manualFiltering = false,
  manualPagination = false,
  defaultSorting = [],
  defaultFilters = [],
  defaultGlobalSearch = "",
  defaultPagination,
  defaultSelection = {},
  defaultColumnVisibility = {},
  defaultColumnOrder = [],
  defaultColumnSizing = {},
  defaultColumnPinning = {},
  globalSearch,
  onGlobalSearchChange,
  onSortingChange,
  onFiltersChange,
  onPaginationChange,
  onSelectionChange,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnSizing,
  onColumnSizingChange,
  onColumnPinningChange,
  onCellEdit,
}: DataGridProps<TData>) {
  const selectable = selection !== false
  const filtersEnabled = filters !== false
  const paginationEnabled = pagination !== false
  const columnVisibilityEnabled = columnVisibility !== false
  const columnPinningEnabled = columnPinning !== false
  const virtualization: false | DataGridVirtualization =
    virtualize === false ? false : virtualize === true ? {} : virtualize
  const pageConfig =
    typeof pagination === "object" && !isPaginationState(pagination)
      ? pagination
      : undefined
  const initialPageSize = pageConfig?.defaultPageSize ?? 25
  const viewportRef = React.useRef<HTMLDivElement>(null)

  const resolvedColumns = React.useMemo(
    () =>
      normalizeColumns(
        columns,
        selectable,
        columnPinningEnabled,
        getRowLabel,
        getRowSelectionDisabledReason,
      ),
    [
      columns,
      selectable,
      columnPinningEnabled,
      getRowLabel,
      getRowSelectionDisabledReason,
    ],
  )

  const controlledSorting = Array.isArray(sorting) ? sorting : undefined
  const controlledFilters = Array.isArray(filters) ? filters : undefined
  const controlledPagination = isPaginationState(pagination)
    ? pagination
    : undefined
  const controlledSelection = isStateObject<RowSelectionState>(selection)
    ? selection
    : undefined
  const controlledVisibility = isStateObject<VisibilityState>(columnVisibility)
    ? columnVisibility
    : undefined
  const controlledPinning = isStateObject<ColumnPinningState>(columnPinning)
    ? columnPinning
    : undefined

  const table = useReactTable({
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
    enableSorting: sorting !== false,
    enableMultiSort: true,
    enableRowSelection: typeof selection === "function" ? selection : selectable,
    enableColumnResizing: columnResize,
    columnResizeMode: "onChange",
    getRowId,
    ...(rowCount !== undefined && { rowCount }),
    initialState: {
      sorting: defaultSorting,
      columnFilters: defaultFilters,
      globalFilter: defaultGlobalSearch,
      pagination:
        defaultPagination ?? { pageIndex: 0, pageSize: initialPageSize },
      rowSelection: defaultSelection,
      columnVisibility: defaultColumnVisibility,
      columnOrder: defaultColumnOrder,
      columnSizing: defaultColumnSizing,
      columnPinning: {
        ...defaultColumnPinning,
        ...(columnPinningEnabled && selectable
          ? {
              left: Array.from(
                new Set(["select", ...(defaultColumnPinning.left ?? [])]),
              ),
            }
          : {}),
      },
    },
    state: {
      ...(controlledSorting !== undefined && { sorting: controlledSorting }),
      ...(controlledFilters !== undefined && { columnFilters: controlledFilters }),
      ...(controlledPagination !== undefined && { pagination: controlledPagination }),
      ...(controlledSelection !== undefined && { rowSelection: controlledSelection }),
      ...(controlledVisibility !== undefined && { columnVisibility: controlledVisibility }),
      ...(controlledPinning !== undefined && { columnPinning: controlledPinning }),
      ...(globalSearch !== undefined && { globalFilter: globalSearch }),
      ...(columnOrder !== undefined && { columnOrder }),
      ...(columnSizing !== undefined && { columnSizing }),
    },
    ...(onSortingChange && { onSortingChange }),
    ...(onFiltersChange && { onColumnFiltersChange: onFiltersChange }),
    ...(onPaginationChange && { onPaginationChange }),
    ...(onSelectionChange && { onRowSelectionChange: onSelectionChange }),
    ...(onColumnVisibilityChange && { onColumnVisibilityChange }),
    ...(onColumnOrderChange && { onColumnOrderChange }),
    ...(onColumnSizingChange && { onColumnSizingChange }),
    ...(onColumnPinningChange && { onColumnPinningChange }),
    ...(onGlobalSearchChange && { onGlobalFilterChange: onGlobalSearchChange }),
  })

  const resetView = React.useCallback(() => {
    table.resetColumnOrder()
    table.resetColumnVisibility()
    table.resetColumnSizing()
    table.resetColumnPinning()
    table.resetSorting()
  }, [table])

  const contextValue = {
    table,
    caption,
    density,
    selectable,
    filtersEnabled,
    paginationEnabled,
    inlineFilters,
    columnVisibilityEnabled,
    columnReorderEnabled: columnReorder,
    columnPinningEnabled,
    columnResizeEnabled: columnResize,
    stickyHeader,
    keyboardNavigation,
    virtualization,
    viewportRef,
    loading,
    refreshing,
    error,
    onRetry,
    rowCount,
    emptyState,
    noResultsState,
    getRowLabel,
    getRowSelectionDisabledReason,
    onCellEdit,
    resetView,
  }

  const searchConfig = typeof search === "object" ? search : undefined
  const exportConfig = typeof toolbar?.export === "object" ? toolbar.export : undefined

  return (
    <DataGridProvider value={contextValue}>
      <div
        data-slot="data-grid"
        data-density={density}
        className={cn("w-full min-w-0 space-y-[var(--hui-space-3)]", className)}
      >
        {children ?? (
          <>
            {(search || filtersEnabled || columnVisibilityEnabled || toolbar) && (
              <DataGridToolbar>
                {search && (
                  <DataGridSearch
                    placeholder={searchConfig?.placeholder}
                    debounceMs={searchConfig?.debounceMs}
                    ariaLabel={searchConfig?.ariaLabel}
                  />
                )}
                <DataGridActiveFilters />
                {filtersEnabled && <DataGridFilterTrigger />}
                <DataGridToolbarSpacer />
                {columnVisibilityEnabled && <DataGridColumnVisibility />}
                {toolbar?.export && (
                  <DataGridExport
                    fileName={exportConfig?.fileName}
                    onExport={exportConfig?.onExport}
                  />
                )}
                {toolbar?.refresh && (
                  <DataGridRefresh onRefresh={toolbar.refresh.onRefresh} />
                )}
                {toolbar?.actions}
              </DataGridToolbar>
            )}
            <DataGridFrame>
              <DataGridViewport maxHeight={maxHeight}>
                <DataGridTable />
              </DataGridViewport>
              {(paginationEnabled || selectable) && (
                <DataGridFooter>
                  {selectable && <DataGridSelectionStatus />}
                  {paginationEnabled && (
                    <DataGridPagination
                      pageSizeOptions={pageConfig?.pageSizeOptions}
                    />
                  )}
                </DataGridFooter>
              )}
            </DataGridFrame>
          </>
        )}
      </div>
    </DataGridProvider>
  )
}

export function DataGridFrame({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-grid-frame"
      className={cn(
        "min-w-0 overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)]",
        className,
      )}
      {...props}
    />
  )
}

export function DataGridViewport({
  className,
  maxHeight,
  style,
  ...props
}: React.ComponentProps<"div"> & { maxHeight?: number | string }) {
  const { viewportRef, loading, refreshing, virtualization } =
    useDataGridContext<unknown>()
  const resolvedMaxHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight
  return (
    <div
      ref={viewportRef}
      data-slot="data-grid-viewport"
      aria-busy={loading || refreshing || undefined}
      className={cn(
        "relative min-w-0 overflow-auto [&>[data-slot=table-container]]:overflow-visible",
        className,
      )}
      style={{
        containerType: "inline-size",
        ...(virtualization && resolvedMaxHeight
          ? { height: resolvedMaxHeight }
          : {}),
        maxHeight: resolvedMaxHeight,
        ...style,
      }}
      {...props}
    />
  )
}

function getResponsiveClass(hideBelow?: "sm" | "md" | "lg") {
  if (hideBelow === "sm") return "hidden sm:table-cell"
  if (hideBelow === "md") return "hidden md:table-cell"
  if (hideBelow === "lg") return "hidden lg:table-cell"
  return undefined
}

function getAlignmentClass(align?: string) {
  if (align === "right") return "text-right"
  if (align === "center") return "text-center"
  return "text-left"
}

function getPinnedStyles<TData>(column: Column<TData, unknown>) {
  const pinned = column.getIsPinned()
  return {
    ...(pinned === "left" && { left: `${column.getStart("left")}px` }),
    ...(pinned === "right" && { right: `${column.getAfter("right")}px` }),
    ...(pinned && { position: "sticky" as const, zIndex: 2 }),
    width: `${column.getSize()}px`,
  }
}

function getPinnedBoundaryClass<TData>(column: Column<TData, unknown>) {
  if (column.id === "select") return undefined

  const pinned = column.getIsPinned()
  if (pinned === "left" && column.getIsLastColumn("left")) {
    return "border-e border-e-[var(--hui-color-border-base-secondary)]"
  }
  if (pinned === "right" && column.getIsFirstColumn("right")) {
    return "border-s border-s-[var(--hui-color-border-base-secondary)]"
  }
  return undefined
}

function DataGridSelectAllCheckbox() {
  const { table } = useDataGridContext<unknown>()
  return (
    <Checkbox
      aria-label="Select all rows on this page"
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={
        table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
      }
      onCheckedChange={(checked) =>
        table.toggleAllPageRowsSelected(Boolean(checked))
      }
    />
  )
}

function DataGridInlineFilter<TData>({
  column,
}: {
  column: Column<TData, unknown>
}) {
  const { table } = useDataGridContext<TData>()
  const config = getDataGridColumnMeta(column).filter
  const existing = column.getFilterValue() as DataGridFilterValue | undefined
  if (!config) return null

  const setValue = (value: unknown) => {
    column.setFilterValue(
      value === ""
        ? undefined
        : {
            operator:
              config.type === "text"
                ? "contains"
                : config.type === "enum" || config.type === "boolean"
                  ? "is"
                  : "equals",
            value,
          },
    )
    table.setPageIndex(0)
  }

  if (config.type === "enum" || config.type === "boolean") {
    const options =
      config.type === "boolean"
        ? [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]
        : (config.options ?? []).map((option) =>
            typeof option === "string" ? { label: option, value: option } : option,
          )
    const items = [{ label: "All", value: "__all__" }, ...options]
    return (
      <Select
        items={items}
        value={existing?.value == null ? "__all__" : String(existing.value)}
        onValueChange={(value) => setValue(value === "__all__" ? "" : value)}
      >
        <SelectTrigger size="sm" aria-label={`Filter ${getDataGridColumnTitle(column)}`} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      size="sm"
      type={config.type === "date" ? "date" : config.type === "number" || config.type === "currency" ? "number" : "search"}
      aria-label={`Filter ${getDataGridColumnTitle(column)}`}
      placeholder={config.type === "text" ? "Search..." : undefined}
      value={String(existing?.value ?? "")}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

type EditingCell = {
  rowId: string
  columnId: string
  value: unknown
  previousValue: unknown
  saving: boolean
  error: string | null
}

function DataGridEditableCell<TData>({
  cell,
  editing,
  setEditing,
  onMove,
}: {
  cell: Cell<TData, unknown>
  editing: EditingCell
  setEditing: React.Dispatch<React.SetStateAction<EditingCell | null>>
  onMove: (direction: -1 | 1) => void
}) {
  const { onCellEdit } = useDataGridContext<TData>()
  const meta = getDataGridColumnMeta(cell.column)

  const commit = async (
    moveDirection?: -1 | 1,
    valueOverride?: { value: unknown },
  ) => {
    if (!onCellEdit || editing.saving) return
    setEditing((current) => (current ? { ...current, saving: true, error: null } : current))
    try {
      await onCellEdit({
        row: cell.row,
        columnId: cell.column.id,
        value: valueOverride ? valueOverride.value : editing.value,
        previousValue: editing.previousValue,
      })
      setEditing(null)
      if (moveDirection) onMove(moveDirection)
    } catch (error) {
      setEditing((current) =>
        current
          ? {
              ...current,
              saving: false,
              error: error instanceof Error ? error.message : "Could not save this value. Try again.",
            }
          : current,
      )
    }
  }

  if (meta.edit) {
    return (
      <div
        onKeyDownCapture={(event) => {
          if (event.key === "Tab") {
            event.preventDefault()
            void commit(event.shiftKey ? -1 : 1)
          }
          if (event.key === "Escape") {
            event.preventDefault()
            setEditing(null)
          }
        }}
      >
        {meta.edit({
          row: cell.row,
          value: editing.value,
          onChange: (value) =>
            setEditing((current) =>
              current ? { ...current, value } : current,
            ),
          onCommit: (...args) =>
            void commit(
              undefined,
              args.length > 0 ? { value: args[0] } : undefined,
            ),
          onCancel: () => setEditing(null),
          saving: editing.saving,
          error: editing.error,
        })}
      </div>
    )
  }

  return (
    <span className="grid min-w-36 gap-[var(--hui-space-1)]">
      <Input
        autoFocus
        size="sm"
        value={String(editing.value ?? "")}
        disabled={editing.saving}
        aria-invalid={Boolean(editing.error) || undefined}
        aria-label={`Edit ${getDataGridColumnTitle(cell.column)}`}
        onChange={(event) =>
          setEditing((current) =>
            current ? { ...current, value: event.target.value } : current,
          )
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            void commit()
          }
          if (event.key === "Escape") {
            event.preventDefault()
            setEditing(null)
          }
          if (event.key === "Tab") {
            event.preventDefault()
            void commit(event.shiftKey ? -1 : 1)
          }
        }}
      />
      {editing.error && (
        <span role="alert" className="whitespace-normal text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-micro)]">
          {editing.error}
        </span>
      )}
    </span>
  )
}

export function DataGridTable({ className }: { className?: string }) {
  const {
    table,
    caption,
    density,
    inlineFilters,
    paginationEnabled,
    stickyHeader,
    columnReorderEnabled,
    keyboardNavigation,
    virtualization,
    viewportRef,
    loading,
    error,
    onRetry,
    rowCount,
    emptyState,
    noResultsState,
    onCellEdit,
  } = useDataGridContext<unknown>()
  const rows = table.getRowModel().rows
  const columns = table.getVisibleLeafColumns()
  const columnCount = Math.max(columns.length, 1)
  const tableState = table.getState()
  const isFiltering =
    Boolean(tableState.globalFilter) || tableState.columnFilters.length > 0
  const rowHeight = density === "compact" ? 44 : density === "comfortable" ? 64 : 56
  const rowVirtualizer = useVirtualizer({
    count: virtualization ? rows.length : 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => (virtualization ? virtualization.estimateSize : undefined) ?? rowHeight,
    initialRect: virtualization
      ? { width: 0, height: rowHeight * 8 }
      : undefined,
    overscan: (virtualization ? virtualization.overscan : undefined) ?? 8,
  })
  const virtualItems = virtualization ? rowVirtualizer.getVirtualItems() : []
  const renderedRows = virtualization
    ? virtualItems.map((item) => ({ row: rows[item.index], virtualItem: item }))
    : rows.map((row) => ({ row, virtualItem: null }))
  const topPadding = virtualItems[0]?.start ?? 0
  const bottomPadding = virtualItems.length
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0
  const [activeCell, setActiveCell] = React.useState({ row: 0, column: 0 })
  const [editing, setEditing] = React.useState<EditingCell | null>(null)
  const draggedColumn = React.useRef<string | null>(null)

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const nextRow = Math.max(0, Math.min(rowIndex, rows.length - 1))
    const nextColumn = Math.max(0, Math.min(columnIndex, columns.length - 1))
    setActiveCell({ row: nextRow, column: nextColumn })
    if (virtualization) rowVirtualizer.scrollToIndex(nextRow, { align: "auto" })
    window.requestAnimationFrame(() => {
      const target = viewportRef.current?.querySelector<HTMLElement>(
        `[data-grid-row-index="${nextRow}"][data-grid-column-index="${nextColumn}"]`,
      )
      target?.focus()
    })
  }

  const beginEditing = (cell: Cell<unknown, unknown>) => {
    const meta = getDataGridColumnMeta(cell.column)
    if (!meta.editable || !onCellEdit) return false
    const value = cell.getValue()
    setEditing({
      rowId: cell.row.id,
      columnId: cell.column.id,
      value,
      previousValue: value,
      saving: false,
      error: null,
    })
    return true
  }

  const handleCellKeyDown = (
    event: React.KeyboardEvent<HTMLTableCellElement>,
    cell: Cell<unknown, unknown>,
    rowIndex: number,
    columnIndex: number,
  ) => {
    if (event.target !== event.currentTarget) return
    let nextRow = rowIndex
    let nextColumn = columnIndex

    if (event.key === "ArrowDown") nextRow += 1
    else if (event.key === "ArrowUp") nextRow -= 1
    else if (event.key === "ArrowRight") nextColumn += 1
    else if (event.key === "ArrowLeft") nextColumn -= 1
    else if (event.key === "Home") nextColumn = event.ctrlKey ? 0 : 0
    else if (event.key === "End") nextColumn = columns.length - 1
    else if (event.key === "Enter") {
      if (!beginEditing(cell)) {
        event.currentTarget.querySelector<HTMLElement>(
          "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        )?.focus()
      }
      event.preventDefault()
      return
    } else if (event.key === " " && cell.row.getCanSelect()) {
      cell.row.toggleSelected()
      event.preventDefault()
      return
    } else return

    if (event.ctrlKey && event.key === "Home") nextRow = 0
    if (event.ctrlKey && event.key === "End") nextRow = rows.length - 1
    event.preventDefault()
    focusCell(nextRow, nextColumn)
  }

  const skeletonRows = Math.min(
    Math.max(tableState.pagination?.pageSize ?? 8, 6),
    10,
  )
  const headerRowCount = 1 + (inlineFilters ? 1 : 0)
  const dataRowOffset = paginationEnabled
    ? tableState.pagination.pageIndex * tableState.pagination.pageSize
    : 0
  const availableDataRowCount =
    rowCount ??
    (paginationEnabled
      ? table.getPrePaginationRowModel().rows.length
      : rows.length)

  return (
    <Table
      aria-label={caption}
      aria-rowcount={
        virtualization ? headerRowCount + availableDataRowCount : undefined
      }
      className={cn("table-fixed", className)}
      style={{ width: `${Math.max(table.getTotalSize(), 1)}px`, minWidth: "100%" }}
    >
      <TableHeader className={cn(!stickyHeader && "static")}>
        <TableRow
          aria-rowindex={virtualization ? 1 : undefined}
          className="hover:bg-transparent"
        >
          {columns.map((column) => {
            const meta = getDataGridColumnMeta(column)
            const sorted = column.getIsSorted()
            const canReorder =
              columnReorderEnabled && meta.reorderable !== false
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
                className={cn(
                  "group/header relative h-12 overflow-visible px-[var(--hui-space-4)] py-0",
                  density === "compact" && "h-10",
                  density === "comfortable" && "h-[3.25rem]",
                  getAlignmentClass(meta.align),
                  getResponsiveClass(meta.hideBelow),
                  getPinnedBoundaryClass(column),
                  column.getIsResizing() && "border-e border-e-[var(--hui-color-border-accent-emphasis)]",
                )}
                style={getPinnedStyles(column)}
              >
                {column.id === "select" ? (
                  <DataGridSelectAllCheckbox />
                ) : (
                  <DataGridColumnHeader
                    column={column}
                    draggable={canReorder}
                    onDragStart={(event) => {
                      draggedColumn.current = column.id
                      event.dataTransfer.effectAllowed = "move"
                      event.dataTransfer.setData("text/plain", column.id)
                    }}
                    onDragOver={(event) => {
                      if (!draggedColumn.current) return
                      event.preventDefault()
                      event.dataTransfer.dropEffect = "move"
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const source =
                        draggedColumn.current ??
                        event.dataTransfer.getData("text/plain")
                      const order = table.getState().columnOrder.length
                        ? table.getState().columnOrder
                        : table.getAllLeafColumns().map((item) => item.id)
                      table.setColumnOrder(
                        moveDataGridColumn(order, source, column.id),
                      )
                      draggedColumn.current = null
                    }}
                    onDragEnd={() => {
                      draggedColumn.current = null
                    }}
                  />
                )}
              </TableHead>
            )
          })}
        </TableRow>
        {inlineFilters && (
          <TableRow
            aria-rowindex={virtualization ? 2 : undefined}
            className="hover:bg-transparent"
          >
            {columns.map((column) => {
              const meta = getDataGridColumnMeta(column)
              return (
                <TableHead
                  key={column.id}
                  className={cn(
                    "h-[3.875rem] px-[var(--hui-space-3)] py-[var(--hui-space-3)]",
                    getResponsiveClass(meta.hideBelow),
                    getPinnedBoundaryClass(column),
                  )}
                  style={getPinnedStyles(column)}
                >
                  <DataGridInlineFilter column={column} />
                </TableHead>
              )
            })}
          </TableRow>
        )}
      </TableHeader>
      <TableBody>
        {error ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-60 overflow-visible p-0">
              <DataGridStateViewport>
                <DataGridStateMessage
                  title="Could not load data"
                  description={error}
                  action={
                    onRetry ? (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Try again
                      </Button>
                    ) : undefined
                  }
                />
              </DataGridStateViewport>
            </TableCell>
          </TableRow>
        ) : loading ? (
          Array.from({ length: skeletonRows }).map((_, rowIndex) => (
            <TableRow key={`loading-${rowIndex}`} style={{ height: rowHeight }}>
              {columns.map((column, columnIndex) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    "px-[var(--hui-space-4)] py-0",
                    getResponsiveClass(getDataGridColumnMeta(column).hideBelow),
                  )}
                  style={getPinnedStyles(column)}
                >
                  <Skeleton
                    className={cn(
                      "h-[var(--hui-space-4)]",
                      columnIndex % 3 === 0 ? "w-24" : columnIndex % 3 === 1 ? "w-32" : "w-16",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-60 overflow-visible p-0">
              <DataGridStateViewport>
                {isFiltering ? (
                  noResultsState ?? (
                    <DataGridStateMessage
                      title="No matching rows"
                      description="Try changing or clearing your filters."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            table.setGlobalFilter("")
                            table.resetColumnFilters()
                          }}
                        >
                          Clear filters
                        </Button>
                      }
                    />
                  )
                ) : (
                  emptyState ?? (
                    <DataGridStateMessage
                      title="No data yet"
                      description="Rows will appear here once they are added."
                    />
                  )
                )}
              </DataGridStateViewport>
            </TableCell>
          </TableRow>
        ) : (
          <>
            {topPadding > 0 && (
              <tr aria-hidden="true">
                <td colSpan={columnCount} style={{ height: topPadding, padding: 0, border: 0 }} />
              </tr>
            )}
            {renderedRows.map(({ row, virtualItem }) => {
              const rowPosition = virtualItem?.index ?? rows.indexOf(row)
              return (
                <TableRow
                  key={row.id}
                  aria-rowindex={
                    virtualization
                      ? headerRowCount + dataRowOffset + rowPosition + 1
                      : undefined
                  }
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  data-index={virtualItem?.index}
                  className="transition-colors duration-100 hover:bg-[var(--hui-color-background-base-primary-hover)]"
                  style={{ height: rowHeight }}
                >
                  {row.getVisibleCells().map((cell, columnIndex) => {
                    const meta = getDataGridColumnMeta(cell.column)
                    const isEditing =
                      editing?.rowId === row.id &&
                      editing.columnId === cell.column.id
                    return (
                      <TableCell
                        key={cell.id}
                        data-grid-row-index={rowPosition}
                        data-grid-column-index={columnIndex}
                        tabIndex={
                          keyboardNavigation &&
                          activeCell.row === rowPosition &&
                          activeCell.column === columnIndex
                            ? 0
                            : keyboardNavigation
                              ? -1
                              : undefined
                        }
                        className={cn(
                          "px-[var(--hui-space-4)] py-0 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--hui-color-border-accent-emphasis)]",
                          getAlignmentClass(meta.align),
                          getResponsiveClass(meta.hideBelow),
                          getPinnedBoundaryClass(cell.column),
                          cell.column.getIsResizing() &&
                            "border-e border-e-[var(--hui-color-border-accent-emphasis)]",
                        )}
                        style={getPinnedStyles(cell.column)}
                        onFocus={() =>
                          setActiveCell({
                            row: rowPosition,
                            column: columnIndex,
                          })
                        }
                        onDoubleClick={() => beginEditing(cell)}
                        onKeyDown={(event) =>
                          handleCellKeyDown(
                            event,
                            cell,
                            rowPosition,
                            columnIndex,
                          )
                        }
                      >
                        {isEditing && editing ? (
                          <DataGridEditableCell
                            cell={cell}
                            editing={editing}
                            setEditing={setEditing}
                            onMove={(direction) =>
                              focusCell(rowPosition, columnIndex + direction)
                            }
                          />
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
            {bottomPadding > 0 && (
              <tr aria-hidden="true">
                <td colSpan={columnCount} style={{ height: bottomPadding, padding: 0, border: 0 }} />
              </tr>
            )}
          </>
        )}
      </TableBody>
    </Table>
  )
}

function DataGridStateViewport({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="data-grid-state"
      className="sticky start-0 flex min-h-60 w-[100cqw]"
    >
      {children}
    </div>
  )
}

export function DataGridStateMessage({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Empty className={cn("min-h-60 rounded-none border-0 p-[var(--hui-space-8)]", className)}>
      <EmptyHeader>
        <EmptyTitle className="font-sans [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)]">
          {title}
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

export function DataGridFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { table, loading, error } = useDataGridContext<unknown>()
  if (!loading && (error || table.getFilteredRowModel().rows.length === 0)) {
    return null
  }

  return (
    <div
      data-slot="data-grid-footer"
      className={cn(
        "flex min-h-14 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
        className,
      )}
      {...props}
    />
  )
}

export function DataGridSelectionStatus({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { table } = useDataGridContext<unknown>()
  const selectedCount = Object.values(table.getState().rowSelection).filter(Boolean).length
  if (selectedCount === 0) return null

  return (
    <div
      data-slot="data-grid-selection-status"
      className={cn(
        "flex flex-wrap items-center gap-[var(--hui-space-3)] [font-size:var(--hui-font-size-small)] text-[var(--hui-color-foreground-base-secondary)]",
        className,
      )}
    >
      <span role="status">
        {selectedCount} {selectedCount === 1 ? "row" : "rows"} selected
      </span>
      {children}
      <Button variant="link" size="xs" onClick={() => table.resetRowSelection()}>
        Clear
      </Button>
    </div>
  )
}

export function DataGridRowActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-grid-row-actions"
      className={cn("flex justify-end", className)}
      onClick={(event) => event.stopPropagation()}
      {...props}
    />
  )
}

export const DataGrid = Object.assign(DataGridRoot, {
  Root: DataGridRoot,
  Toolbar: DataGridToolbar,
  ToolbarSpacer: DataGridToolbarSpacer,
  Search: DataGridSearch,
  Filters: DataGridActiveFilters,
  FilterTrigger: DataGridFilterTrigger,
  ColumnVisibility: DataGridColumnVisibility,
  Export: DataGridExport,
  Refresh: DataGridRefresh,
  Frame: DataGridFrame,
  Viewport: DataGridViewport,
  Table: DataGridTable,
  Footer: DataGridFooter,
  SelectionStatus: DataGridSelectionStatus,
  Pagination: DataGridPagination,
  RowActions: DataGridRowActions,
})

export {
  DataGridActiveFilters,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridExport,
  DataGridFilterTrigger,
  DataGridPagination,
  DataGridRefresh,
  DataGridSearch,
  DataGridToolbar,
  DataGridToolbarSpacer,
  getDataGridColumnMeta,
  getDataGridColumnTitle,
  useDataGridContext,
}
export type {
  DataGridColumn,
  DataGridDensity,
  DataGridEditEvent,
  DataGridSearchProps,
}
