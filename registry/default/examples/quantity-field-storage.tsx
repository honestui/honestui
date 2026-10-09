"use client"

import * as React from "react"

import {
  QuantityField,
  QuantityFieldControl,
  QuantityFieldLabel,
  QuantityFieldStatus,
  storageUnits,
} from "@/registry/default/product/quantity-field/quantity-field"

const MEBIBYTE = 1024 ** 2
const GIBIBYTE = 1024 ** 3

/**
 * An upload limit stored in bytes and offered in binary units only. Pasting
 * "500 MB" converts the decimal megabytes and says so.
 */
export default function QuantityFieldStorage() {
  const [bytes, setBytes] = React.useState<number | null>(1024 * MEBIBYTE)

  return (
    <div className="flex w-full max-w-xs min-w-0 flex-col gap-[var(--hui-space-4)]">
      <QuantityField
        className="w-full"
        unitGroup={storageUnits}
        units={["KiB", "MiB", "GiB"]}
        defaultUnit="MiB"
        value={bytes}
        onValueChange={setBytes}
        min={MEBIBYTE}
        max={5 * GIBIBYTE}
      >
        <QuantityFieldLabel>Largest upload</QuantityFieldLabel>
        <QuantityFieldControl />
        <QuantityFieldStatus />
      </QuantityField>
      <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
        Stored value:{" "}
        <code data-testid="stored-bytes">{bytes === null ? "empty" : `${bytes} bytes`}</code>
      </p>
    </div>
  )
}
