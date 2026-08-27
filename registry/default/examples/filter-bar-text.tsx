"use client"

import * as React from "react"

import {
  FilterBar,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"

/** Text rules. Choosing Is empty removes the input, as it should. */
export default function FilterBarText() {
  const [value, setValue] = React.useState<FilterValue[]>([
    { key: "name", operator: "contains", value: "Acme" },
  ])

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "name",
            label: "Customer",
            type: "text",
            meta: { placeholder: "Search value..." },
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        Contains, equals, prefixes, and the two empty rules cover almost every
        text filter a list needs.
      </p>
    </div>
  )
}
