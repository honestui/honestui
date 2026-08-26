"use client"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"

type Customer = {
  id: string
  name: string
  email: string
  status: "Active" | "Pending" | "Inactive"
  plan: string
  spent: number
}

const customers: Customer[] = [
  { id: "1", name: "Olivia Rhye", email: "olivia@acmeforge.com", status: "Active", plan: "Pro", spent: 1234 },
  { id: "2", name: "Phoenix Baker", email: "phoenix@northwind.io", status: "Active", plan: "Pro", spent: 2342 },
  { id: "3", name: "Liam Carter", email: "liam@globex.dev", status: "Pending", plan: "Starter", spent: 0 },
  { id: "4", name: "Sofia Reyes", email: "sofia@initech.co", status: "Inactive", plan: "Starter", spent: 480 },
  { id: "5", name: "Ethan Brooks", email: "ethan@umbrella.ai", status: "Active", plan: "Business", spent: 8210 },
  { id: "6", name: "Maya Patel", email: "maya@hooli.net", status: "Pending", plan: "Pro", spent: 990 },
  { id: "7", name: "Noah Thompson", email: "noah@vandelay.com", status: "Active", plan: "Starter", spent: 120 },
  { id: "8", name: "Isla Campbell", email: "isla@duffbrewing.com", status: "Inactive", plan: "Business", spent: 4120 },
  { id: "9", name: "Lucas Martin", email: "lucas@craytek.io", status: "Active", plan: "Pro", spent: 2675 },
  { id: "10", name: "Amelia Davis", email: "amelia@sterling.co", status: "Pending", plan: "Starter", spent: 45 },
  { id: "11", name: "Henry Wilson", email: "henry@massive.dev", status: "Active", plan: "Business", spent: 9870 },
  { id: "12", name: "Zara Ahmed", email: "zara@pixelworks.io", status: "Active", plan: "Pro", spent: 3310 },
]

const columns: DataTableProps<Customer>["columns"] = [
  { accessorKey: "name", header: "Customer" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "plan", header: "Plan" },
  {
    accessorKey: "spent",
    header: "Spent",
    meta: { align: "right", label: "Spent" },
    cell: ({ row }) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(row.original.spent),
  },
]

export default function DataTableDemo() {
  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={customers}
        caption="Customers"
        getRowId={(row) => row.id}
        pagination
      />
    </div>
  )
}
