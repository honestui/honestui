"use client"

import * as React from "react"

import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"

import { DateRangePicker } from "@/registry/default/product/date-range-picker/date-range-picker"

/**
 * One month for toolbars and panels where a two-month popover will not fit.
 */
export default function DateRangePickerSingleMonth() {
  const [value, setValue] = React.useState<DateRange | undefined>(undefined)

  return (
    <div className="w-full max-w-sm min-w-0">
      <DateRangePicker value={value} onValueChange={setValue} numberOfMonths={1} />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        Same behavior as the two-month picker in a narrower surface.
      </p>
    </div>
  )
}
