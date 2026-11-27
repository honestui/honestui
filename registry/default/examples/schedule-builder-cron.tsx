"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  ScheduleBuilder,
  type ScheduleBuilderChangeDetails,
} from "@/registry/default/product/schedule-builder/schedule-builder"

/**
 * A custom expression that no friendly shape can state: the 1st of the month
 * or any Monday. Edit it, or type something invalid, and Save follows
 * `details.valid`.
 */
export default function ScheduleBuilderCron() {
  const [expression, setExpression] = React.useState("0 6 1 * 1")
  const [valid, setValid] = React.useState(true)
  const [saved, setSaved] = React.useState("0 6 1 * 1")

  const handleChange = (next: string, details: ScheduleBuilderChangeDetails) => {
    setExpression(next)
    setValid(details.valid)
  }

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <ScheduleBuilder
        value={expression}
        onValueChange={handleChange}
        defaultTimeZone="UTC"
        aria-label="Backup schedule"
      />
      <div className="flex items-center justify-between gap-[var(--hui-space-4)]">
        <p className="m-0 min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
          Saved: <code className="font-mono tabular-nums">{saved}</code>
        </p>
        <Button
          size="sm"
          disabled={!valid || expression === saved}
          onClick={() => setSaved(expression.trim())}
        >
          Save schedule
        </Button>
      </div>
    </div>
  )
}
