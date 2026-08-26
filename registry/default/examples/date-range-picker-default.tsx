"use client"

import * as React from "react"

import { DateRangePicker } from "@/registry/default/product/date-range-picker/date-range-picker"
import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"

export default function DateRangePickerDefault() {
  const [value, setValue] = React.useState<DateRange | undefined>(undefined)

  return (
    <div className="w-full max-w-md min-w-0">
      <DateRangePicker value={value} onValueChange={setValue} />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {value?.from
          ? `Selected ${value.from.toLocaleDateString()}${
              value.to ? ` through ${value.to.toLocaleDateString()}` : ""
            }.`
          : "No range selected."}
      </p>
    </div>
  )
}
