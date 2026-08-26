"use client"

import * as React from "react"

import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"

import {
  DateRangePicker,
  getDateRangePresets,
} from "@/registry/default/product/date-range-picker/date-range-picker"

/**
 * Confirm mode keeps calendar edits temporary until Apply. Closing the
 * popover any other way discards the changes instead of committing them.
 */
export default function DateRangePickerConfirm() {
  const [value, setValue] = React.useState<DateRange | undefined>(undefined)

  return (
    <div className="w-full min-w-0">
      <DateRangePicker
        value={value}
        onValueChange={setValue}
        confirmMode
        presets={getDateRangePresets()}
      />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {value?.from && value.to
          ? `Dashboard filtered to ${value.from.toLocaleDateString()} through ${value.to.toLocaleDateString()}.`
          : "The dashboard keeps its current window until you choose Apply."}
      </p>
    </div>
  )
}
