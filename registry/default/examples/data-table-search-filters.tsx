"use client"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"
import { Badge } from "@/registry/default/ui/badge"

type Invoice = {
  id: string
  number: string
  customer: string
  status: "Paid" | "Open" | "Overdue" | "Draft"
  amount: number
}

const invoices: Invoice[] = [
  { id: "1", number: "INV-1042", customer: "Acme Forge", status: "Paid", amount: 2400 },
  { id: "2", number: "INV-1043", customer: "Northwind Labs", status: "Open", amount: 1180 },
  { id: "3", number: "INV-1044", customer: "Globex Studio", status: "Overdue", amount: 760 },
  { id: "4", number: "INV-1045", customer: "Initech Co", status: "Paid", amount: 3250 },
  { id: "5", number: "INV-1046", customer: "Umbrella AI", status: "Draft", amount: 940 },
  { id: "6", number: "INV-1047", customer: "Hooli Networks", status: "Open", amount: 1520 },
  { id: "7", number: "INV-1048", customer: "Vandelay Imports", status: "Paid", amount: 640 },
  { id: "8", number: "INV-1049", customer: "Duff Brewing", status: "Overdue", amount: 2810 },
]

const statusVariant = {
  Paid: "success",
  Open: "info",
  Overdue: "error",
  Draft: "neutral",
} as const

const columns: DataTableProps<Invoice>["columns"] = [
  { accessorKey: "number", header: "Invoice" },
  { accessorKey: "customer", header: "Customer" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: { align: "right" },
    cell: ({ row }) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(row.original.amount),
  },
]

export default function DataTableSearchFilters() {
  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={invoices}
        caption="Invoices"
        getRowId={(row) => row.id}
        search={{ placeholder: "Search invoices..." }}
        filters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Paid", value: "Paid" },
              { label: "Open", value: "Open" },
              { label: "Overdue", value: "Overdue" },
              { label: "Draft", value: "Draft" },
            ],
          },
        ]}
        pagination
      />
    </div>
  )
}
