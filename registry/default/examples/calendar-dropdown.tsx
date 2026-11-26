"use client"

import * as React from "react"

import { Calendar } from "@/registry/default/ui/calendar"

export default function CalendarDropdown() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(1992, 4, 14))

  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      selected={date}
      onSelect={setDate}
      defaultMonth={date}
      startMonth={new Date(1920, 0)}
      endMonth={new Date()}
      // Year and month dropdowns replace the arrows for long jumps.
      hideNavigation
      className="rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    />
  )
}
