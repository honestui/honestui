"use client"

import * as React from "react"

import {
  QuantityField,
  QuantityFieldControl,
  QuantityFieldLabel,
  QuantityFieldStatus,
  durationUnits,
} from "@/registry/default/product/quantity-field/quantity-field"

/**
 * 100 minutes cannot be written in hours with one decimal place, so the field
 * shows 1.7 h, says it is rounded, and keeps 6000 seconds stored.
 */
export default function QuantityFieldRounding() {
  const [seconds, setSeconds] = React.useState<number | null>(6000)

  return (
    <div className="flex w-full max-w-xs min-w-0 flex-col gap-[var(--hui-space-4)]">
      <QuantityField
        className="w-full"
        unitGroup={durationUnits}
        units={["s", "min", "h"]}
        defaultUnit="h"
        value={seconds}
        onValueChange={setSeconds}
        rounding={{ maximumFractionDigits: 1 }}
      >
        <QuantityFieldLabel>Report window</QuantityFieldLabel>
        <QuantityFieldControl />
        <QuantityFieldStatus />
      </QuantityField>
      <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        Stored value:{" "}
        <code data-testid="stored-window">{seconds === null ? "empty" : `${seconds} seconds`}</code>
      </p>
    </div>
  )
}
