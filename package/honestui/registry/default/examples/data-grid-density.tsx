"use client"

import * as React from "react"

import {
  DataGrid,
  type DataGridDensity,
} from "@/registry/default/product/data-grid/data-grid"
import { Button } from "@/registry/default/ui/button"
import {
  getGridUserColumns,
  gridUsers,
} from "@/registry/default/examples/data-grid-example-data"

const columns = getGridUserColumns().slice(0, 5)
const densities: DataGridDensity[] = ["compact", "default", "comfortable"]

export default function DataGridDensityExample() {
  const [density, setDensity] = React.useState<DataGridDensity>("default")

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-[var(--hui-space-3)]">
      <div className="flex flex-wrap gap-[var(--hui-space-2)]" aria-label="Choose row density">
        {densities.map((value) => (
          <Button
            key={value}
            variant={density === value ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={density === value}
            onClick={() => setDensity(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </Button>
        ))}
      </div>
      <DataGrid
        columns={columns}
        data={gridUsers.slice(0, 5)}
        caption={`${density} user grid`}
        density={density}
      />
    </div>
  )
}
