"use client"

import * as React from "react"
import { addDays, setDate, startOfMonth, subDays } from "date-fns"

import { DateRangePicker, getDateRangePresets } from "@/registry/default/product/date-range-picker/date-range-picker"
import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"

/**
 * The full configuration: quick ranges, two months, a selection wide enough
 * to show start, middle, and end states, disabled pending days, and Apply
 * before the filter commits.
 */
export default function DateRangePickerDemo() {
  const today = React.useMemo(() => new Date(), [])
  // A span that always crosses into the previous month.
  const initialFrom = subDays(startOfMonth(today), 6)
  const initialTo = setDate(startOfMonth(today), 5)
  const [value, setValue] = React.useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo,
  })

  return (
    <div className="w-full min-w-0">
      <DateRangePicker
        value={value}
        onValueChange={setValue}
        presets={getDateRangePresets()}
        confirmMode
        clearable
        numberOfMonths={2}
        minDate={subDays(today, 400)}
        maxDate={addDays(today, 180)}
        isDateDisabled={(date) => {
          const yesterday = subDays(new Date(), 1)
          return date.getTime() > yesterday.getTime()
        }}
      />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        Report period:{" "}
        {value?.from && value.to
          ? `${value.from.toLocaleDateString()} through ${value.to.toLocaleDateString()}`
          : "none"}
      </p>
    </div>
  )
}
