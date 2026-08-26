"use client"

import * as React from "react"

import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"

import {
  DateRangePicker,
  getDateRangePresets,
} from "@/registry/default/product/date-range-picker/date-range-picker"

const PRESETS = getDateRangePresets()

export default function DateRangePickerPresets() {
  const [value, setValue] = React.useState<DateRange | undefined>(undefined)

  return (
    <div className="w-full min-w-0">
      <DateRangePicker
        value={value}
        onValueChange={setValue}
        presets={PRESETS}
        aria-label="Billing period"
      />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {value?.from && value.to
          ? `Billing runs ${value.from.toLocaleDateString()} to ${value.to.toLocaleDateString()}.`
          : "Pick a period to filter invoices."}
      </p>
    </div>
  )
}
