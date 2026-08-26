"use client"

import * as React from "react"
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"

type Order = {
  id: string
  number: string
  customer: string
  status: "Fulfilled" | "Processing" | "Cancelled"
  total: number
}

const ALL_ORDERS: Order[] = Array.from({ length: 37 }, (_, index) => {
  const statuses = ["Fulfilled", "Processing", "Cancelled"] as const
  const customers = [
    "Acme Forge",
    "Northwind Labs",
    "Globex Studio",
    "Initech Co",
    "Umbrella AI",
    "Hooli Networks",
  ]

  return {
    id: String(index + 1),
    number: `SO-${4100 + index}`,
    customer: customers[index % customers.length],
    status: statuses[index % statuses.length],
    total: ((index * 137) % 900) + 60,
  }
})

const PAGE_SIZE = 10

const columns: DataTableProps<Order>["columns"] = [
  { accessorKey: "number", header: "Order" },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "total",
    header: "Total",
    meta: { align: "right" },
    cell: ({ row }) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(row.original.total),
  },
]

function fetchOrders(
  sorting: SortingState,
  globalFilter: string,
  columnFilters: ColumnFiltersState,
  pagination: PaginationState,
  onDone: (rows: Order[], total: number) => void,
) {
  const timeout = setTimeout(() => {
    let rows = [...ALL_ORDERS]

    if (globalFilter) {
      const query = globalFilter.toLowerCase()

      rows = rows.filter((order) =>
        [order.number, order.customer]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    }

    for (const filter of columnFilters) {
      if (filter.id === "status" && Array.isArray(filter.value)) {
        const allowed = filter.value as string[]

        rows = rows.filter((order) => allowed.includes(order.status))
      }
    }

    const sort = sorting[0]

    if (sort) {
      const key = sort.id as keyof Order

      rows.sort((first, second) => {
        const result =
          typeof first[key] === "number"
            ? (first[key] as number) - (second[key] as number)
            : String(first[key]).localeCompare(String(second[key]))

        return sort.desc ? -result : result
      })
    }

    const total = rows.length
    const pageStart = pagination.pageIndex * pagination.pageSize

    onDone(rows.slice(pageStart, pageStart + pagination.pageSize), total)
  }, 600)

  return () => clearTimeout(timeout)
}

export default function DataTableServer() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [result, setResult] = React.useState<{
    rows: Order[]
    total: number
    requestKey: string
  } | null>(null)

  const requestKey = JSON.stringify([
    sorting,
    globalFilter,
    columnFilters,
    pagination,
  ])
  const loading = result?.requestKey !== requestKey

  React.useEffect(() => {
    return fetchOrders(
      sorting,
      globalFilter,
      columnFilters,
      pagination,
      (rows, total) => {
        setResult({ rows, total, requestKey })
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={result?.rows ?? []}
        caption="Orders"
        getRowId={(row) => row.id}
        search={{ placeholder: "Search orders...", debounceMs: 250 }}
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Fulfilled", value: "Fulfilled" },
              { label: "Processing", value: "Processing" },
              { label: "Cancelled", value: "Cancelled" },
            ],
          },
        ]}
        rowCount={result?.total ?? 0}
        loading={loading}
        manualSorting
        manualFiltering
        manualPagination
        sorting={sorting}
        onSortingChange={(updater) => {
          const next = typeof updater === "function" ? updater(sorting) : updater

          setSorting(next)
          setPagination((previous) => ({ ...previous, pageIndex: 0 }))
        }}
        globalFilter={globalFilter}
        onGlobalFilterChange={(updater) => {
          const next =
            typeof updater === "function"
              ? updater(globalFilter)
              : String(updater)

          setGlobalFilter(next)
          setPagination((previous) => ({ ...previous, pageIndex: 0 }))
        }}
        columnFilters={columnFilters}
        onColumnFiltersChange={(updater) => {
          const next =
            typeof updater === "function" ? updater(columnFilters) : updater

          setColumnFilters(next)
          setPagination((previous) => ({ ...previous, pageIndex: 0 }))
        }}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  )
}
