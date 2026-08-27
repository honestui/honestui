"use client"

import * as React from "react"

import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import { CREATED_PRESETS } from "./filter-bar-example-data"

/**
 * Presets matched against the stored range keep the chip short; a custom
 * pick opens the Date Range Picker calendar instead.
 */
export default function FilterBarDateRange() {
  const [value, setValue] = React.useState<FilterValue[]>([
    { key: "created", operator: "between", value: CREATED_PRESETS[0].value() },
  ])

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "created",
            label: "Created",
            type: "date-range",
            meta: { datePresets: CREATED_PRESETS },
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        Committed ranges that match a preset show its name. Anything else
        falls back to two compact dates.
      </p>
    </div>
  )
}
