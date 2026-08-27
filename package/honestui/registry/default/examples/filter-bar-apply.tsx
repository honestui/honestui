"use client"

import * as React from "react"

import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import { STATUS_OPTIONS } from "./filter-bar-example-data"

function describe(value: FilterValue[]) {
  if (value.length === 0) return "no filters"

  return value
    .map((entry) => {
      if (Array.isArray(entry.value)) return `${entry.key}: ${entry.value.join(", ")}`

      return `${entry.key}: ${String(entry.value)}`
    })
    .join(" | ")
}

/**
 * Apply mode keeps a draft behind the panel. Cancel, Escape, and clicking
 * outside all discard; only Apply filters commits, which is exactly what
 * expensive queries want.
 */
export default function FilterBarApply() {
  const [value, setValue] = React.useState<FilterValue[]>([])
  const [lastCommitted, setLastCommitted] = React.useState("")

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            type: "multi-select",
            options: STATUS_OPTIONS,
          },
          {
            key: "archived",
            label: "Archived",
            type: "boolean",
            meta: { booleanStyle: "radio" },
          },
        ]}
        mode="apply"
        value={value}
        onValueChange={(next) => {
          setValue(next)
          setLastCommitted(describe(next))
        }}
      />
      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        Committed: {lastCommitted || describe(value)}. Close without Apply to
        watch the draft disappear.
      </p>
    </div>
  )
}
