"use client"

import * as React from "react"

import { DataGrid } from "@/registry/default/product/data-grid/data-grid"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

export default function DataGridDemo() {
  const [users, setUsers] = React.useState(gridUsers)
  const [status, setStatus] = React.useState("")
  const columns = React.useMemo(
    () =>
      getGridUserColumns({
        onDuplicate: (user) => {
          setUsers((current) => [
            ...current,
            { ...user, id: `${user.id}_copy_${current.length}`, name: `${user.name} copy` },
          ])
          setStatus(`${user.name} was duplicated.`)
        },
        onDeactivate: (user) => {
          setUsers((current) =>
            current.map((item) =>
              item.id === user.id ? { ...item, status: "Inactive" } : item,
            ),
          )
          setStatus(`${user.name} is now inactive.`)
        },
      }),
    [],
  )

  return (
    <div className="w-full min-w-0 max-w-6xl">
      <DataGrid
        columns={columns}
        data={users}
        caption="Users"
        getRowId={(row) => row.id}
        getRowLabel={(row) => `Select ${row.original.name}`}
        getRowSelectionDisabledReason={(row) =>
          row.original.canEdit
            ? undefined
            : "This user cannot be changed."
        }
        search={{ placeholder: "Search users..." }}
        filters
        sorting
        selection={(row) => row.original.canEdit}
        columnVisibility
        columnResize
        columnReorder
        columnPinning
        pagination={{ defaultPageSize: 10, pageSizeOptions: [10, 25, 50] }}
        toolbar={{ export: { fileName: "users.csv" } }}
      />
      <p role="status" className="sr-only">{status}</p>
    </div>
  )
}
