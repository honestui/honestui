"use client"

import * as React from "react"

import {
  DataGrid,
  type DataGridColumn,
} from "@/registry/default/product/data-grid/data-grid"
import { Badge } from "@/registry/default/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

type Project = {
  id: string
  name: string
  owner: string
  status: "Planned" | "Active" | "Paused"
  budget: number
}

const initialProjects: Project[] = [
  { id: "p1", name: "Account migration", owner: "Sarah Chen", status: "Active", budget: 42000 },
  { id: "p2", name: "Billing cleanup", owner: "Alex Kim", status: "Paused", budget: 18000 },
  { id: "p3", name: "Mobile navigation", owner: "Priya Raman", status: "Planned", budget: 27500 },
  { id: "p4", name: "Search relevance", owner: "Nora Ibrahim", status: "Active", budget: 36000 },
]

const statusItems = ["Planned", "Active", "Paused"].map((value) => ({
  label: value,
  value,
}))

const columns: DataGridColumn<Project, unknown>[] = [
  { accessorKey: "name", header: "Project", editable: true, size: 240 },
  { accessorKey: "owner", header: "Owner", size: 180 },
  {
    accessorKey: "status",
    header: "Status",
    editable: true,
    size: 150,
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    edit: ({ value, onCommit, saving }) => (
      <Select
        items={statusItems}
        value={String(value)}
        onValueChange={(next) => next && onCommit(next)}
        disabled={saving}
      >
        <SelectTrigger size="sm" aria-label="Edit status" className="min-w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  {
    accessorKey: "budget",
    header: "Budget",
    type: "currency",
    align: "right",
    editable: true,
    size: 150,
    cell: ({ row }) => `$${row.original.budget.toLocaleString("en-US")}`,
  },
]

export default function DataGridEditing() {
  const [projects, setProjects] = React.useState(initialProjects)

  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataGrid
        columns={columns}
        data={projects}
        caption="Editable projects"
        getRowId={(row) => row.id}
        keyboardNavigation
        onCellEdit={({ row, columnId, value }) => {
          setProjects((current) =>
            current.map((project) =>
              project.id === row.original.id
                ? {
                    ...project,
                    [columnId]: columnId === "budget" ? Number(value) : value,
                  }
                : project,
            ),
          )
        }}
      />
    </div>
  )
}
