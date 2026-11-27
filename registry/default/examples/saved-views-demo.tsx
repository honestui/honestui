"use client"

import * as React from "react"
import type { SortingState, VisibilityState } from "@tanstack/react-table"

import { DataGrid } from "@/registry/default/product/data-grid/data-grid"
import {
  FilterBar,
  type FilterDefinition,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import {
  SavedViews,
  type SavedView,
  type SavedViewState,
} from "@/registry/default/product/saved-views/saved-views"
import {
  getGridUserColumns,
  gridUsers,
  type GridUser,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns()

const filters: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    type: "multi-select",
    options: [
      { label: "Active", value: "Active" },
      { label: "Pending", value: "Pending" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
  {
    key: "role",
    label: "Role",
    type: "multi-select",
    options: [
      { label: "Admin", value: "Admin" },
      { label: "Editor", value: "Editor" },
      { label: "Viewer", value: "Viewer" },
    ],
  },
]

const initialViews: SavedView[] = [
  { id: "all", name: "All people", locked: true, state: {} },
  {
    id: "admins",
    name: "Active admins",
    state: {
      filters: [
        { key: "status", value: ["Active"] },
        { key: "role", value: ["Admin"] },
      ],
      sorting: [{ id: "revenue", desc: true }],
    },
  },
  {
    id: "invites",
    name: "Pending invites",
    shared: true,
    state: {
      filters: [{ key: "status", value: ["Pending"] }],
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: { revenue: false },
    },
  },
]

function matches(user: GridUser, values: FilterValue[]) {
  return values.every((filter) => {
    if (!Array.isArray(filter.value) || filter.value.length === 0) return true
    const field = filter.key === "status" ? user.status : filter.key === "role" ? user.role : null
    return field === null || filter.value.includes(field)
  })
}

export default function SavedViewsDemo() {
  const [views, setViews] = React.useState(initialViews)
  const [activeViewId, setActiveViewId] = React.useState("admins")
  const [defaultViewId, setDefaultViewId] = React.useState("all")
  const [nextId, setNextId] = React.useState(1)

  const active = views.find((view) => view.id === activeViewId) ?? views[0]
  const [filterValues, setFilterValues] = React.useState<FilterValue[]>(active.state.filters ?? [])
  const [sorting, setSorting] = React.useState<SortingState>(active.state.sorting ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    active.state.columnVisibility ?? {}
  )

  const currentState: SavedViewState = React.useMemo(
    () => ({ filters: filterValues, sorting, columnVisibility }),
    [filterValues, sorting, columnVisibility]
  )

  const apply = (view: SavedView) => {
    setActiveViewId(view.id)
    setFilterValues(view.state.filters ?? [])
    setSorting(view.state.sorting ?? [])
    setColumnVisibility(view.state.columnVisibility ?? {})
  }

  const rows = React.useMemo(
    () => gridUsers.filter((user) => matches(user, filterValues)),
    [filterValues]
  )

  return (
    <div className="flex w-full min-w-0 max-w-6xl flex-col gap-[var(--hui-space-4)]">
      <SavedViews
        views={views}
        activeViewId={activeViewId}
        onActiveViewChange={(_, view) => apply(view)}
        currentState={currentState}
        defaultViewId={defaultViewId}
        onDefaultViewChange={setDefaultViewId}
        onSave={(id, state) =>
          setViews((current) => current.map((view) => (view.id === id ? { ...view, state } : view)))
        }
        onSaveAsNew={(name, state) => {
          const view: SavedView = { id: `view-${nextId}`, name, state }
          setNextId((id) => id + 1)
          setViews((current) => [...current, view])
          setActiveViewId(view.id)
        }}
        onRename={(id, name) =>
          setViews((current) => current.map((view) => (view.id === id ? { ...view, name } : view)))
        }
        onDelete={(id) => {
          const remaining = views.filter((view) => view.id !== id)
          setViews(remaining)
          apply(remaining.find((view) => view.id === defaultViewId) ?? remaining[0])
        }}
      />
      <FilterBar filters={filters} value={filterValues} onValueChange={setFilterValues} />
      <DataGrid
        columns={columns}
        data={rows}
        caption="People"
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={setSorting}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        maxHeight={360}
      />
    </div>
  )
}
