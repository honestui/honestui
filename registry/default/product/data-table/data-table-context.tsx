import * as React from "react"
import type { Row } from "@tanstack/react-table"

export type DataTableDensity = "default" | "compact"

export type DataTableContextValue<TData> = {
  table: import("@tanstack/react-table").Table<TData>
  caption?: string
  getRowLabel?: (row: Row<TData>) => string
  loading: boolean
  error: string | null
  onRetry?: () => void
  rowCount?: number
  emptyState?: React.ReactNode
  noResultsState?: React.ReactNode
  selectable: boolean
  density: DataTableDensity
}

const DataTableContext =
  React.createContext<DataTableContextValue<unknown> | null>(null)

export function DataTableProvider<TData>({
  value,
  children,
}: {
  value: DataTableContextValue<TData>
  children: React.ReactNode
}) {
  return (
    <DataTableContext.Provider
      value={value as unknown as DataTableContextValue<unknown>}
    >
      {children}
    </DataTableContext.Provider>
  )
}

export function useDataTableContext<
  TData,
>(): DataTableContextValue<TData> {
  const context = React.useContext(DataTableContext)

  if (!context) {
    throw new Error(
      "DataTable parts must be rendered inside <DataTable>.",
    )
  }

  return context as DataTableContextValue<TData>
}

export function getColumnTitle(column: {
  id: string
  columnDef: { header?: unknown; meta?: unknown }
}): string {
  const meta = (column.columnDef.meta ?? {}) as { label?: string }

  if (meta.label) {
    return meta.label
  }

  if (typeof column.columnDef.header === "string") {
    return column.columnDef.header
  }

  return column.id
}
