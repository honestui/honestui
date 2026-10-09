"use client"

import * as React from "react"

import {
  QuantityField,
  QuantityFieldControl,
  QuantityFieldLabel,
  QuantityFieldStatus,
  durationUnits,
  storageUnits,
} from "@/registry/default/product/quantity-field/quantity-field"
import { Button } from "@/registry/default/ui/button"

/**
 * Nothing is sent anywhere: the preview lists the form data the browser would
 * submit. Each field name carries its unit, and the retention field offers
 * days only, so its unit is plain text.
 */
export default function QuantityFieldForm() {
  const [submitted, setSubmitted] = React.useState<[string, string][] | null>(null)

  return (
    <form
      className="flex w-full max-w-xs min-w-0 flex-col gap-[var(--hui-space-5)]"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setSubmitted([...data.entries()].map(([name, value]) => [name, String(value)]))
      }}
    >
      <QuantityField
        className="w-full"
        unitGroup={storageUnits}
        units={["MB", "GB"]}
        valueUnit="MB"
        defaultUnit="GB"
        defaultValue={2000}
        min={100}
        max={10_000}
        name="quota_megabytes"
        required
      >
        <QuantityFieldLabel>Storage quota</QuantityFieldLabel>
        <QuantityFieldControl />
        <QuantityFieldStatus />
      </QuantityField>

      <QuantityField
        className="w-full"
        unitGroup={durationUnits}
        units={["d"]}
        valueUnit="d"
        defaultValue={30}
        min={1}
        max={365}
        name="retention_days"
        required
      >
        <QuantityFieldLabel>Keep deleted files for</QuantityFieldLabel>
        <QuantityFieldControl />
        <QuantityFieldStatus />
      </QuantityField>

      <Button type="submit" className="self-start">
        Save limits
      </Button>

      <output
        aria-label="Submitted form data"
        className="block min-h-[var(--hui-space-9)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
      >
        {submitted?.map(([name, value]) => (
          <code key={name} className="block">
            {name}={value}
          </code>
        ))}
      </output>
    </form>
  )
}
