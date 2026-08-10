import {
  Meter,
  MeterCircularTrack,
  MeterLabel,
  MeterValue,
} from "@/registry/default/ui/meter"

const sizes = [
  {
    label: "48 px",
    trackClassName:
      "[--hui-meter-size:var(--hui-space-11)] [--hui-meter-track-size:var(--hui-space-1)]",
    valueClassName: "[font-size:var(--hui-font-size-mini)]",
  },
  {
    label: "72 px",
    trackClassName: "",
    valueClassName: "",
  },
  {
    label: "120 px",
    trackClassName:
      "[--hui-meter-size:var(--hui-space-17)] [--hui-meter-track-size:var(--hui-space-3)]",
    valueClassName: "[font-size:var(--hui-font-size-regular)]",
  },
] as const

export default function MeterCircularSizesDemo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-[var(--hui-space-8)]">
      {sizes.map(({ label, trackClassName, valueClassName }) => (
        <Meter
          key={label}
          className="w-auto gap-[var(--hui-space-3)]"
          value={68}
          variant="circular"
        >
          <div className="relative">
            <MeterCircularTrack className={trackClassName} />
            <MeterValue className={valueClassName} />
          </div>
          <MeterLabel>Storage · {label}</MeterLabel>
        </Meter>
      ))}
    </div>
  )
}
