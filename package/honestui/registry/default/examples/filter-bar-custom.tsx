"use client"

import * as React from "react"

import { Slider } from "@/registry/default/ui/slider"
import {
  FilterBar,
  type FilterRenderProps,
  type FilterValue,
} from "@/registry/default/product/filter-bar/filter-bar"

function DistanceControl({
  value,
  onChange,
  disabled,
  labelId,
  descriptionId,
}: FilterRenderProps) {
  const range = Array.isArray(value) ? (value as number[]) : [0, 50]

  return (
    <div className="flex flex-col gap-3 pb-1">
      <Slider
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        value={range}
        min={0}
        max={50}
        step={1}
        onValueChange={(next) => onChange(next)}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground tabular-nums">
        Delivering within {range[0]} to {range[1]} km
      </p>
    </div>
  )
}

/**
 * Anything the built-in types miss gets a render function. The custom control
 * still writes through Filter Bar, so chips and Clear all keep working.
 */
export default function FilterBarCustom() {
  const [value, setValue] = React.useState<FilterValue[]>([])

  return (
    <div className="w-full min-w-0">
      <FilterBar
        filters={[
          {
            key: "distance",
            label: "Distance",
            type: "custom",
            formatValue: (raw) => {
              if (!Array.isArray(raw)) return ""

              const [from, to] = raw as number[]

              if (from === 0 && to === 50) return ""

              return `${from} to ${to} km`
            },
            render: DistanceControl,
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        The renderer receives value, onChange, clear, disabled, label and
        description IDs, and the definition; it stays connected to everything
        else.
      </p>
    </div>
  )
}
