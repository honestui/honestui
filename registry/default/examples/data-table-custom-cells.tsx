"use client"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/registry/default/ui/avatar"
import { Badge } from "@/registry/default/ui/badge"

type Deal = {
  id: string
  name: string
  username: string
  avatar: string
  initials: string
  status: "Won" | "In progress" | "Lost"
  value: number
  closeDate: Date
}

const deals: Deal[] = [
  { id: "1", name: "Olivia Rhye", username: "@olivia", avatar: "https://i.pravatar.cc/64?img=1", initials: "OR", status: "Won", value: 12400, closeDate: new Date("2026-01-12T00:00:00Z") },
  { id: "2", name: "Phoenix Baker", username: "@phoenix", avatar: "https://i.pravatar.cc/64?img=2", initials: "PB", status: "In progress", value: 8200, closeDate: new Date("2026-02-03T00:00:00Z") },
  { id: "3", name: "Liam Carter", username: "@liam", avatar: "https://i.pravatar.cc/64?img=3", initials: "LC", status: "Lost", value: 3100, closeDate: new Date("2026-02-18T00:00:00Z") },
  { id: "4", name: "Sofia Reyes", username: "@sofia", avatar: "https://i.pravatar.cc/64?img=4", initials: "SR", status: "In progress", value: 15750, closeDate: new Date("2026-03-02T00:00:00Z") },
  { id: "5", name: "Ethan Brooks", username: "@ethan", avatar: "https://i.pravatar.cc/64?img=5", initials: "EB", status: "Won", value: 4300, closeDate: new Date("2026-03-21T00:00:00Z") },
]

const statusVariant = {
  Won: "success",
  "In progress": "info",
  Lost: "neutral",
} as const

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
})

const columns: DataTableProps<Deal>["columns"] = [
  {
    accessorKey: "name",
    header: "Deal owner",
    cell: ({ row }) => (
      <div className="flex items-center gap-[var(--hui-space-3)]">
        <Avatar size="4">
          <AvatarImage src={row.original.avatar} alt="" />
          <AvatarFallback>{row.original.initials}</AvatarFallback>
        </Avatar>
        <span>
          <span className="block text-[var(--hui-color-foreground-base-primary)]">
            {row.original.name}
          </span>
          <span className="block text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-micro)]">
            {row.original.username}
          </span>
        </span>
      </div>
    ),
  },
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
    accessorKey: "value",
    header: "Value",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className="tracking-[-0.02em]">
        {currency.format(row.original.value)}
      </span>
    ),
  },
  {
    accessorKey: "closeDate",
    header: "Close date",
    sortingFn: "datetime",
    cell: ({ row }) => (
      <span className="tracking-[-0.02em] [word-spacing:-0.06em]">
        {date.format(row.original.closeDate)}
      </span>
    ),
  },
]

export default function DataTableCustomCells() {
  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={deals}
        caption="Deals"
        getRowId={(row) => row.id}
        pagination
      />
    </div>
  )
}
