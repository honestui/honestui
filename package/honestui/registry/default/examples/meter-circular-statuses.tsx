"use client"

import {
  Meter,
  MeterCircularTrack,
  MeterLabel,
  MeterValue,
} from "@/registry/default/ui/meter"

const readings = [
  {
    label: "Weak signal",
    value: 24,
    indicatorClassName:
      "[&_[data-slot=meter-circular-indicator-circle]]:stroke-[var(--hui-color-background-danger-emphasis)]",
  },
  {
    label: "Fair signal",
    value: 58,
    indicatorClassName:
      "[&_[data-slot=meter-circular-indicator-circle]]:stroke-[var(--hui-color-background-attention-emphasis)]",
  },
  {
    label: "Strong signal",
    value: 88,
    indicatorClassName:
      "[&_[data-slot=meter-circular-indicator-circle]]:stroke-[var(--hui-color-background-success-emphasis)]",
  },
] as const

export default function MeterCircularStatusesDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-[var(--hui-space-9)]">
      {readings.map(({ label, value, indicatorClassName }) => (
        <Meter
          key={label}
          className="w-auto gap-[var(--hui-space-3)]"
          value={value}
          variant="circular"
        >
          <div className="relative">
            <MeterCircularTrack className={indicatorClassName} />
            <MeterValue>{(_formattedValue, currentValue) => `${currentValue}%`}</MeterValue>
          </div>
          <MeterLabel>{label}</MeterLabel>
        </Meter>
      ))}
    </div>
  )
}
