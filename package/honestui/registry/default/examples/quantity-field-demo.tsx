"use client"

import * as React from "react"

import {
  QuantityField,
  QuantityFieldControl,
  QuantityFieldLabel,
  QuantityFieldStatus,
  durationUnits,
} from "@/registry/default/product/quantity-field/quantity-field"

const MINUTE = 60
const DAY = 86_400

/**
 * A session timeout stored in seconds. Switch the unit, or paste "1h 30m" or
 * "2 d" into the number: the stored seconds below change only when the
 * quantity does.
 */
export default function QuantityFieldDemo() {
  const [seconds, setSeconds] = React.useState<number | null>(90 * MINUTE)

  return (
    <div className="flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-5)]">
      <QuantityField
        className="w-full"
        unitGroup={durationUnits}
        units={["min", "h", "d"]}
        defaultUnit="min"
        value={seconds}
        onValueChange={setSeconds}
        min={MINUTE}
        max={DAY}
      >
        <QuantityFieldLabel>Session timeout</QuantityFieldLabel>
        <QuantityFieldControl />
        <QuantityFieldStatus />
      </QuantityField>
      <p className="m-0 flex items-center justify-between gap-[var(--hui-space-4)] border-t-[0.5px] border-t-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        <span>Stored value</span>
        <span
          data-testid="stored-seconds"
          className="text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-weight:var(--hui-font-weight-medium)]"
        >
          {seconds === null ? "empty" : `${seconds} seconds`}
        </span>
      </p>
    </div>
  )
}
