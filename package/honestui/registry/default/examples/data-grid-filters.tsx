"use client"

import { DataGrid } from "@/registry/default/product/data-grid/data-grid"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns()

export default function DataGridFilters() {
  return (
    <div className="w-full min-w-0 max-w-6xl">
      <DataGrid
        columns={columns}
        data={gridUsers}
        caption="Filter users"
        getRowId={(row) => row.id}
        search={{ placeholder: "Search users..." }}
        filters
        inlineFilters
        pagination={{ defaultPageSize: 10 }}
      />
    </div>
  )
}
