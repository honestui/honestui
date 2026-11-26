"use client"

import * as React from "react"

import { Calendar } from "@/registry/default/ui/calendar"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export default function CalendarDisabledDates() {
  const today = React.useMemo(() => startOfDay(new Date()), [])
  const lastBookable = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()),
    [today]
  )
  const [date, setDate] = React.useState<Date | undefined>()

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      // Appointments run Monday to Friday, from today up to two months out.
      disabled={[{ before: today }, { after: lastBookable }, { dayOfWeek: [0, 6] }]}
      startMonth={today}
      endMonth={lastBookable}
      footer={
        date
          ? `Appointment on ${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.`
          : "Weekdays only, up to two months ahead."
      }
      className="rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    />
  )
}
