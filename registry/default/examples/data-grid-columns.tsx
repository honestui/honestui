"use client"

import { DataGrid } from "@/registry/default/product/data-grid/data-grid"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns()

export default function DataGridColumns() {
  return (
    <div className="w-full min-w-0 max-w-6xl">
      <DataGrid
        columns={columns}
        data={gridUsers}
        caption="Customize user columns"
        getRowId={(row) => row.id}
        columnVisibility
        columnResize
        columnReorder
        columnPinning
        defaultColumnPinning={{ left: ["name"], right: ["revenue"] }}
        stickyHeader
        maxHeight={360}
      />
    </div>
  )
}
