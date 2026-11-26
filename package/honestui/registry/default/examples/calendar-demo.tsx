"use client"

import * as React from "react"

import { Calendar } from "@/registry/default/ui/calendar"

export default function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(() => new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    />
  )
}
