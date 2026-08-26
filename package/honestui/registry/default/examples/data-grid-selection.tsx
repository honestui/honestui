"use client"

import * as React from "react"
import { Download as DownloadIcon, UserX as UserXIcon } from "honestui/icons"

import {
  DataGrid,
  DataGridFooter,
  DataGridFrame,
  DataGridPagination,
  DataGridSelectionStatus,
  DataGridTable,
  DataGridViewport,
} from "@/registry/default/product/data-grid/data-grid"
import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns()

export default function DataGridSelection() {
  const [users, setUsers] = React.useState(gridUsers)
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [result, setResult] = React.useState("")
  const selectedCount = Object.values(selection).filter(Boolean).length

  const exportSelected = () => {
    const selectedUsers = users.filter((user) => selection[user.id])
    const escapeCell = (value: string) =>
      /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
    const csv = [
      ["Name", "Email", "Role", "Status"],
      ...selectedUsers.map((user) => [
        user.name,
        user.email,
        user.role,
        user.status,
      ]),
    ]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n")
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "selected-users.csv"
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setResult(`${selectedUsers.length} selected rows were exported.`)
  }

  return (
    <div className="w-full min-w-0 max-w-6xl">
      <DataGrid
        columns={columns}
        data={users}
        caption="Select users"
        getRowId={(row) => row.id}
        getRowLabel={(row) => `Select ${row.original.name}`}
        selection={selection}
        onSelectionChange={setSelection}
        pagination={{ defaultPageSize: 10 }}
      >
        <DataGridFrame>
          <DataGridViewport>
            <DataGridTable />
          </DataGridViewport>
          <DataGridFooter>
            <DataGridSelectionStatus>
              <Menu>
                <MenuTrigger render={<Button variant="outline" size="sm" />}>
                  Actions
                </MenuTrigger>
                <MenuPopup align="start">
                  <MenuItem onClick={exportSelected}>
                    <DownloadIcon aria-hidden />
                    Export selected
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    variant="destructive"
                    onClick={() => {
                      setUsers((current) =>
                        current.map((user) =>
                          selection[user.id]
                            ? { ...user, status: "Inactive" }
                            : user,
                        ),
                      )
                      setResult(`${selectedCount} selected rows were marked inactive.`)
                      setSelection({})
                    }}
                  >
                    <UserXIcon aria-hidden />
                    Mark inactive
                  </MenuItem>
                </MenuPopup>
              </Menu>
            </DataGridSelectionStatus>
            <DataGridPagination pageSizeOptions={[10, 25]} />
          </DataGridFooter>
        </DataGridFrame>
      </DataGrid>
      <p role="status" className="sr-only">{result}</p>
    </div>
  )
}
