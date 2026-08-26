"use client"

import {
  DataTable,
  type DataTableProps,
} from "@/registry/default/product/data-table/data-table"
import { Inbox as InboxIcon } from "honestui/icons"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/default/ui/empty"

type ApiKey = {
  id: string
  name: string
  scope: string
}

const columns: DataTableProps<ApiKey>["columns"] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "scope", header: "Scope" },
]

export default function DataTableEmpty() {
  return (
    <div className="w-full min-w-0 max-w-4xl">
      <DataTable
        columns={columns}
        data={[]}
        caption="API keys"
        emptyState={
          <Empty className="p-[var(--hui-space-8)]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>No API keys yet</EmptyTitle>
              <EmptyDescription>
                Keys you create will appear here with their scope and last used
                date.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  )
}
