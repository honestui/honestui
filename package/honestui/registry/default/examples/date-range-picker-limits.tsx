"use client"

import * as React from "react"

import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"
import { addMonths, startOfDay } from "date-fns"

import { DateRangePicker } from "@/registry/default/product/date-range-picker/date-range-picker"

const today = startOfDay(new Date())
// Bookings open today and run at most six months ahead.
const minDate = today
const maxDate = addMonths(today, 6)

export default function DateRangePickerLimits() {
  const [value, setValue] = React.useState<DateRange | undefined>(undefined)

  return (
    <div className="w-full max-w-md min-w-0">
      <DateRangePicker
        value={value}
        onValueChange={setValue}
        minDate={minDate}
        maxDate={maxDate}
        isDateDisabled={(date) => {
          const weekday = date.getDay()
          return weekday === 0 || weekday === 6
        }}
      />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        Stays run today or later, within six months, and never cover a
        weekend.
      </p>
    </div>
  )
}
