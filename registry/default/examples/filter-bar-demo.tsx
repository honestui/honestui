"use client"

import * as React from "react"

import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import {
  CREATED_PRESETS,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
} from "./filter-bar-example-data"

/**
 * The default HonestUI setup: Status with counts, a searchable Category
 * list, a Created range, and an Amount field. Results respond on every
 * selection because mode stays instant.
 */
export default function FilterBarDemo() {
  const [value, setValue] = React.useState<FilterValue[]>([
    { key: "status", operator: "is", value: ["active", "pending"] },
    { key: "category", operator: "is", value: ["design"] },
    {
      key: "created",
      operator: "between",
      value: CREATED_PRESETS[1].value(),
    },
  ])

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
            key: "category",
            label: "Category",
            type: "multi-select",
            searchable: true,
            options: CATEGORY_OPTIONS,
          },
          {
            key: "created",
            label: "Created",
            type: "date-range",
            meta: { datePresets: CREATED_PRESETS },
          },
          { key: "amount", label: "Amount", type: "number", meta: { prefix: "$" } },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        Filtering orders locally. Open the panel or edit a chip; every change
        commits immediately.
      </p>
    </div>
  )
}
