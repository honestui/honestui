"use client"

import * as React from "react"
import type { PaginationState, SortingState } from "@tanstack/react-table"

import { DataGrid } from "@/registry/default/product/data-grid/data-grid"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns()

export default function DataGridControlled() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  const matchingRows = React.useMemo(() => {
    const query = globalSearch.trim().toLocaleLowerCase()
    const filtered = query
      ? gridUsers.filter((user) =>
          [user.name, user.email, user.status, user.role]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query),
        )
      : gridUsers
    const [sort] = sorting
    const sorted = sort
      ? [...filtered].sort((first, second) => {
          const a = String(first[sort.id as keyof typeof first])
          const b = String(second[sort.id as keyof typeof second])
          return a.localeCompare(b) * (sort.desc ? -1 : 1)
        })
      : filtered
    const start = pagination.pageIndex * pagination.pageSize
    return { rows: sorted.slice(start, start + pagination.pageSize), total: sorted.length }
  }, [globalSearch, pagination, sorting])

  return (
    <div className="w-full min-w-0 max-w-6xl">
      <DataGrid
        columns={columns}
        data={matchingRows.rows}
        rowCount={matchingRows.total}
        pageCount={Math.ceil(matchingRows.total / pagination.pageSize)}
        caption="Server-controlled users"
        getRowId={(row) => row.id}
        search={{ placeholder: "Search users...", debounceMs: 250 }}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        manualSorting
        manualFiltering
        manualPagination
      />
    </div>
  )
}
