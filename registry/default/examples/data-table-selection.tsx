"use client"

import * as React from "react"
import {
  Copy as CopyIcon,
  Download as DownloadIcon,
  Ellipsis as EllipsisIcon,
  Mail as MailIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon,
} from "honestui/icons"

import {
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTableSelectionSummary,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"
import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"

type Member = {
  id: string
  name: string
  role: string
  team: string
}

const members: Member[] = [
  { id: "1", name: "Olivia Rhye", role: "Owner", team: "Platform" },
  { id: "2", name: "Phoenix Baker", role: "Admin", team: "Platform" },
  { id: "3", name: "Liam Carter", role: "Developer", team: "Mobile" },
  { id: "4", name: "Sofia Reyes", role: "Developer", team: "Web" },
  { id: "5", name: "Ethan Brooks", role: "Developer", team: "Web" },
  { id: "6", name: "Maya Patel", role: "Viewer", team: "Design" },
  { id: "7", name: "Noah Thompson", role: "Admin", team: "Design" },
  { id: "8", name: "Isla Campbell", role: "Developer", team: "Mobile" },
]

function RowActions({ member }: { member: Member }) {
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`More actions for ${member.name}`} />}
      >
        <EllipsisIcon />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuItem>
          <PencilIcon className="opacity-72" />
          Edit member
        </MenuItem>
        <MenuItem>
          <CopyIcon className="opacity-72" />
          Duplicate
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <TrashIcon className="opacity-72" />
          Remove
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

function BulkActions() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="sm" />}>
        Bulk actions
      </MenuTrigger>
      <MenuPopup align="start">
        <MenuItem>
          <DownloadIcon className="opacity-72" />
          Export selected
        </MenuItem>
        <MenuItem>
          <MailIcon className="opacity-72" />
          Send invite
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <TrashIcon className="opacity-72" />
          Remove
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

const columns: DataTableProps<Member>["columns"] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "team", header: "Team" },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    meta: { align: "right" },
    header: "",
    cell: ({ row }) => <RowActions member={row.original} />,
  },
]

export default function DataTableSelection() {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})

  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={members}
        caption="Team members"
        getRowId={(row) => row.id}
        getRowLabel={(row) => `Select ${row.original.name}`}
        selectable
        rowSelection={selected}
        onRowSelectionChange={setSelected}
      >
        <DataTableContent />
        <DataTableFooter className="flex-wrap gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
          <DataTableSelectionSummary actions={<BulkActions />} />
        </DataTableFooter>
      </DataTable>
    </div>
  )
}
