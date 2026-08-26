"use client"

import * as React from "react"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"

type Deployment = {
  id: string
  commit: string
  environment: string
  status: "Ready" | "Building"
}

const deployments: Deployment[] = [
  { id: "1", commit: "a1f2e3c", environment: "Production", status: "Ready" },
  { id: "2", commit: "b4c5d6e", environment: "Staging", status: "Ready" },
  { id: "3", commit: "f7a8b9c", environment: "Preview", status: "Building" },
  { id: "4", commit: "0d1e2f3", environment: "Production", status: "Ready" },
  { id: "5", commit: "4a5b6c7", environment: "Preview", status: "Ready" },
  { id: "6", commit: "8d9e0f1", environment: "Staging", status: "Building" },
  { id: "7", commit: "2a3b4c5", environment: "Production", status: "Ready" },
]

const columns: DataTableProps<Deployment>["columns"] = [
  { accessorKey: "commit", header: "Commit" },
  { accessorKey: "environment", header: "Environment" },
  { accessorKey: "status", header: "Status" },
]

export default function DataTableLoading() {
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 1500)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={deployments}
        caption="Deployments"
        getRowId={(row) => row.id}
        loading={loading}
        pagination
      />
    </div>
  )
}
