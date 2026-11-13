"use client"

import * as React from "react"

import type { DateRange } from "@/registry/default/product/date-range-picker/date-range-utils"

import {
  DateRangePicker,
  getDateRangePresets,
} from "@/registry/default/product/date-range-picker/date-range-picker"

export default function DateRangePickerControlled() {
  const [value, setValue] = React.useState<DateRange | undefined>(undefined)
  const [lastCommitted, setLastCommitted] = React.useState("none")

  return (
    <div className="w-full max-w-sm min-w-0">
      <DateRangePicker
        value={value}
        onValueChange={(next) => {
          setValue(next)
          setLastCommitted(
            next?.from && next.to
              ? `${next.from.toLocaleDateString()} – ${next.to.toLocaleDateString()}`
              : "cleared"
          )
        }}
        presets={getDateRangePresets()}
      />
      <div className="mt-2 grid gap-1 text-xs tabular-nums text-[var(--hui-color-foreground-base-secondary)]">
        <p>Internal state follows the picker because the example passes the value back.</p>
        <p role="status">Last commit: {lastCommitted}</p>
      </div>
    </div>
  )
}
