"use client"

import * as React from "react"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"

type Project = {
  id: string
  name: string
  language: string
  visibility: "Public" | "Private"
}

const projects: Project[] = [
  { id: "1", name: "atlas-api", language: "TypeScript", visibility: "Private" },
  { id: "2", name: "atlas-web", language: "TypeScript", visibility: "Public" },
  { id: "3", name: "design-tokens", language: "CSS", visibility: "Public" },
  { id: "4", name: "edge-functions", language: "Rust", visibility: "Private" },
  { id: "5", name: "docs-engine", language: "Go", visibility: "Public" },
]

const columns: DataTableProps<Project>["columns"] = [
  { accessorKey: "name", header: "Project" },
  { accessorKey: "language", header: "Language" },
  { accessorKey: "visibility", header: "Visibility" },
]

export default function DataTableError() {
  const [state, setState] = React.useState<"error" | "loading" | "ready">(
    "error",
  )

  const retry = () => {
    setState("loading")
    setTimeout(() => setState("ready"), 1200)
  }

  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={projects}
        caption="Projects"
        getRowId={(row) => row.id}
        error={
          state === "error" ? "Could not load projects." : null
        }
        loading={state === "loading"}
        onRetry={retry}
        pagination
      />
    </div>
  )
}
