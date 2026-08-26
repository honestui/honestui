"use client"

import * as React from "react"
import type {
  Column,
  ColumnDef,
  Row,
  Table,
} from "@tanstack/react-table"

export type DataGridDensity = "compact" | "default" | "comfortable"
export type DataGridAlignment = "left" | "center" | "right"
export type DataGridFilterType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "enum"
  | "boolean"

export type DataGridFilterOption = {
  label: string
  value: string
}

export type DataGridFilterConfig = {
  type: DataGridFilterType
  options?: DataGridFilterOption[] | string[]
}

export type DataGridFilterValue = {
  operator: string
  value?: unknown
  valueTo?: unknown
}

export type DataGridEditorProps<TData> = {
  row: Row<TData>
  value: unknown
  onChange: (value: unknown) => void
  onCommit: (value?: unknown) => void
  onCancel: () => void
  saving: boolean
  error: string | null
}

export type DataGridColumnOptions<TData> = {
  type?: DataGridFilterType
  align?: DataGridAlignment
  sortable?: boolean
  filterable?: boolean
  hideable?: boolean
  resizable?: boolean
  reorderable?: boolean
  pinnable?: boolean
  editable?: boolean
  filter?: DataGridFilterConfig
  edit?: (props: DataGridEditorProps<TData>) => React.ReactNode
  hideBelow?: "sm" | "md" | "lg"
  priority?: "primary" | "secondary" | "optional"
}

export type DataGridColumn<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> &
  DataGridColumnOptions<TData>

export type DataGridColumnMeta<TData> = {
  label?: string
  align?: DataGridAlignment
  type?: DataGridFilterType
  filter?: DataGridFilterConfig
  reorderable?: boolean
  editable?: boolean
  edit?: (props: DataGridEditorProps<TData>) => React.ReactNode
  hideBelow?: "sm" | "md" | "lg"
  priority?: "primary" | "secondary" | "optional"
}

export type DataGridEditEvent<TData> = {
  row: Row<TData>
  columnId: string
  value: unknown
  previousValue: unknown
}

export type DataGridVirtualization = {
  estimateSize?: number
  overscan?: number
}

export type DataGridContextValue<TData> = {
  table: Table<TData>
  caption?: string
  density: DataGridDensity
  selectable: boolean
  filtersEnabled: boolean
  paginationEnabled: boolean
  inlineFilters: boolean
  columnVisibilityEnabled: boolean
  columnReorderEnabled: boolean
  columnPinningEnabled: boolean
  columnResizeEnabled: boolean
  stickyHeader: boolean
  keyboardNavigation: boolean
  virtualization: false | DataGridVirtualization
  viewportRef: React.RefObject<HTMLDivElement | null>
  loading: boolean
  refreshing: boolean
  error: string | null
  onRetry?: () => void
  rowCount?: number
  emptyState?: React.ReactNode
  noResultsState?: React.ReactNode
  getRowLabel?: (row: Row<TData>) => string
  getRowSelectionDisabledReason?: (row: Row<TData>) => string | undefined
  onCellEdit?: (event: DataGridEditEvent<TData>) => void | Promise<void>
  resetView: () => void
}

const DataGridContext =
  React.createContext<DataGridContextValue<unknown> | null>(null)

export function DataGridProvider<TData>({
  value,
  children,
}: {
  value: DataGridContextValue<TData>
  children: React.ReactNode
}) {
  return (
    <DataGridContext.Provider
      value={value as unknown as DataGridContextValue<unknown>}
    >
      {children}
    </DataGridContext.Provider>
  )
}

export function useDataGridContext<TData>(): DataGridContextValue<TData> {
  const context = React.useContext(DataGridContext)

  if (!context) {
    throw new Error("DataGrid parts must be rendered inside <DataGrid>.")
  }

  return context as DataGridContextValue<TData>
}

export function getDataGridColumnMeta<TData>(
  column: Column<TData, unknown>,
): DataGridColumnMeta<TData> {
  return (column.columnDef.meta ?? {}) as DataGridColumnMeta<TData>
}

export function getDataGridColumnTitle(column: {
  id: string
  columnDef: { header?: unknown; meta?: unknown }
}) {
  const meta = (column.columnDef.meta ?? {}) as DataGridColumnMeta<unknown>

  if (meta.label) return meta.label
  if (typeof column.columnDef.header === "string") return column.columnDef.header
  return column.id
}
