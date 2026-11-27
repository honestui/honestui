"use client"

import * as React from "react"

import { ScheduleBuilder } from "@/registry/default/product/schedule-builder/schedule-builder"

/**
 * A weekly digest that goes out on weekday mornings. Change the frequency,
 * the days, or the time: the sentence, the cron expression, and the next
 * five runs follow.
 */
export default function ScheduleBuilderDemo() {
  const [expression, setExpression] = React.useState("0 9 * * 1-5")

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col gap-[var(--hui-space-3)]">
      <ScheduleBuilder
        value={expression}
        onValueChange={setExpression}
        aria-label="Digest email schedule"
      />
    </div>
  )
}
