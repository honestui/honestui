"use client"

import * as React from "react"

import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"
import { CATEGORY_OPTIONS } from "./filter-bar-example-data"

/** A long list where typing pays off: search stays on, selections survive. */
export default function FilterBarSearchable() {
  const [value, setValue] = React.useState<FilterValue[]>([])

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "category",
            label: "Category",
            type: "multi-select",
            searchable: true,
            options: CATEGORY_OPTIONS,
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p className="mt-2 text-xs text-[var(--hui-color-foreground-base-secondary)]">
        Search ignores case and never clears what you already picked. Try a
        word with no matches to see the empty state.
      </p>
    </div>
  )
}
