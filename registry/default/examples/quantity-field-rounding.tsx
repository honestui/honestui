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
    <div className="flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-5)]">
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
      <p className="m-0 flex items-center justify-between gap-[var(--hui-space-4)] border-t-[0.5px] border-t-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        <span>Stored value</span>
        <span
          data-testid="stored-window"
          className="text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-weight:var(--hui-font-weight-medium)]"
        >
          {seconds === null ? "empty" : `${seconds} seconds`}
        </span>
      </p>
    </div>
  )
}
