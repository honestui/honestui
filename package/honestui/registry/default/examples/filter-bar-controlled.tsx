"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import { STATUS_OPTIONS } from "./filter-bar-example-data"

/**
 * The application owns the array end to end. Reset proves it: one call clears
 * what the panel shows, chips, and the trigger count.
 */
export default function FilterBarControlled() {
  const [value, setValue] = React.useState<FilterValue[]>([
    { key: "status", operator: "is", value: ["active"] },
  ])
  const changeCountRef = React.useRef(0)
  const [commitNote, setCommitNote] = React.useState("")

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-3">
        <FilterBar
          filters={[
            {
              key: "status",
              label: "Status",
              type: "multi-select",
              options: STATUS_OPTIONS,
            },
          ]}
          value={value}
          onValueChange={(next) => {
            changeCountRef.current += 1
            setCommitNote(`Commit #${changeCountRef.current}`)
            setValue(next)
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setValue([])}
          className="shrink-0"
        >
          Reset
        </Button>
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        External state owns every value{commitNote ? `; ${commitNote} received` : ""}.
      </p>
    </div>
  )
}
