"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Calendar } from "@/registry/default/ui/calendar"

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

export default function CalendarRange() {
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    return { from: addDays(today, 3), to: addDays(today, 10) }
  })

  const nights =
    range?.from && range.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000)
      : 0

  return (
    <div className="flex flex-col items-center gap-[var(--hui-space-3)]">
      <Calendar
        mode="range"
        numberOfMonths={2}
        selected={range}
        onSelect={setRange}
        defaultMonth={range?.from}
        className="rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
      />
      <p
        aria-live="polite"
        className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {range?.from && range.to
          ? `${nights} ${nights === 1 ? "night" : "nights"} selected`
          : "Choose a check-out date"}
      </p>
    </div>
  )
}
