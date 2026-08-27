"use client"

import * as React from "react"

import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"

/** Numeric comparisons: the second value appears only for Between. */
export default function FilterBarNumberRange() {
  const [value, setValue] = React.useState<FilterValue[]>([
    { key: "price", operator: "between", value: { min: 100, max: 500 } },
  ])

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "price",
            label: "Price",
            type: "number",
            meta: { prefix: "$", min: 0, step: 1 },
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        The chip reads Price: $100 to $500. Switch the rule to Over or Under
        and the wording follows.
      </p>
    </div>
  )
}
