"use client"

import * as React from "react"

import { DataGrid } from "@/registry/default/product/data-grid/data-grid"
import { Button } from "@/registry/default/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/registry/default/ui/empty"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns().slice(0, 4)
type GridState = "loading" | "empty" | "error" | "ready"

export default function DataGridStates() {
  const [state, setState] = React.useState<GridState>("loading")

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-[var(--hui-space-3)]">
      <div className="flex flex-wrap gap-[var(--hui-space-2)]" aria-label="Choose a data grid state">
        {(["loading", "empty", "error", "ready"] as const).map((value) => (
          <Button
            key={value}
            variant={state === value ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={state === value}
            onClick={() => setState(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </Button>
        ))}
      </div>
      <DataGrid
        columns={columns}
        data={state === "ready" ? gridUsers.slice(0, 4) : []}
        caption="User loading states"
        loading={state === "loading"}
        error={state === "error" ? "The request failed. Try again." : null}
        onRetry={() => setState("ready")}
        emptyState={
          <Empty className="min-h-60 rounded-none border-0">
            <EmptyHeader>
              <EmptyTitle>No users yet</EmptyTitle>
              <EmptyDescription>
                Users will appear here after they are added.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  )
}
