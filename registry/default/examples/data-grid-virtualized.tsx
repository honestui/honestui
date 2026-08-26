"use client"

import * as React from "react"

import {
  DataGrid,
  type DataGridColumn,
} from "@/registry/default/product/data-grid/data-grid"
import { Badge } from "@/registry/default/ui/badge"

type LogRow = {
  id: string
  time: string
  service: string
  level: "Info" | "Warning" | "Error"
  message: string
}

const columns: DataGridColumn<LogRow, unknown>[] = [
  { accessorKey: "time", header: "Time", size: 120 },
  { accessorKey: "service", header: "Service", size: 160, filter: { type: "text" } },
  {
    accessorKey: "level",
    header: "Level",
    size: 120,
    filter: { type: "enum", options: ["Info", "Warning", "Error"] },
    cell: ({ row }) => <Badge>{row.original.level}</Badge>,
  },
  { accessorKey: "message", header: "Message", size: 480, filter: { type: "text" } },
]

export default function DataGridVirtualized() {
  const rows = React.useMemo<LogRow[]>(
    () =>
      Array.from({ length: 10_000 }, (_, index) => ({
        id: `log_${index + 1}`,
        time: `12:${String(Math.floor(index / 60) % 60).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}`,
        service: ["api", "billing", "worker", "identity"][index % 4],
        level: (["Info", "Info", "Warning", "Error"] as const)[index % 4],
        message: `Request ${index + 1} completed for tenant ${index % 87}`,
      })),
    [],
  )

  return (
    <div className="w-full min-w-0 max-w-6xl">
      <DataGrid
        columns={columns}
        data={rows}
        caption="Application logs"
        getRowId={(row) => row.id}
        search={{ placeholder: "Search logs..." }}
        filters
        density="compact"
        stickyHeader
        virtualize={{ estimateSize: 44, overscan: 10 }}
        maxHeight={420}
      />
    </div>
  )
}
