"use client"

import * as React from "react"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"
import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import { SAMPLE_ORDERS, STATUS_OPTIONS } from "./filter-bar-example-data"

type Order = (typeof SAMPLE_ORDERS)[number]

const columns: DataTableProps<Order>["columns"] = [
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: { align: "right" as const, label: "Amount" },
    cell: ({ row }) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(row.original.amount),
  },
]

function rowMatches(order: Order, filters: FilterValue[]) {
  return filters.every((filter) => {
    if (filter.key === "status" && Array.isArray(filter.value)) {
      return filter.value.includes(order.status.toLowerCase())
    }

    if (filter.key === "customer" && typeof filter.value === "string") {
      return order.customer.toLowerCase().includes(filter.value.toLowerCase())
    }

    if (filter.key === "amount") {
      if (typeof filter.value === "number") {
        return order.amount === filter.value
      }

      if (typeof filter.value === "object" && filter.value != null) {
        const { min, max } = filter.value as { min?: number; max?: number }

        if (min != null && order.amount < min) return false
        if (max != null && order.amount > max) return false

        return true
      }
    }

    // Unhandled keys are the application's problem; keep rows visible.
    return true
  })
}

/**
 * Filter Bar stays generic: values in, callbacks out. Mapping those values to
 * a Data Table's rows takes six lines here and zero Filter Bar changes.
 */
export default function FilterBarDataTable() {
  const [filters, setFilters] = React.useState<FilterValue[]>([])

  const rows = React.useMemo(
    () => SAMPLE_ORDERS.filter((order) => rowMatches(order, filters)),
    [filters]
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            type: "multi-select",
            options: STATUS_OPTIONS,
          },
          {
            key: "customer",
            label: "Customer",
            type: "text",
            meta: { placeholder: "Search customer..." },
          },
          { key: "amount", label: "Amount", type: "number", meta: { prefix: "$" } },
        ]}
        value={filters}
        onValueChange={setFilters}
      />
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {rows.length} of {SAMPLE_ORDERS.length} orders
      </p>
      <DataTable columns={columns} data={rows} caption="Orders" />
    </div>
  )
}
