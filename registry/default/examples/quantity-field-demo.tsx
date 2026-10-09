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
    <div className="flex w-full max-w-xs min-w-0 flex-col gap-[var(--hui-space-4)]">
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
      <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        Stored value:{" "}
        <code data-testid="stored-seconds">{seconds === null ? "empty" : `${seconds} seconds`}</code>
      </p>
    </div>
  )
}
