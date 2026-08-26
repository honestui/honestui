import { Label } from "@/registry/default/ui/label"
import { Slider } from "@/registry/default/ui/slider"

export default function SliderDisabled() {
  return (
    <Slider
      className="w-full max-w-64"
      defaultValue={320}
      min={64}
      max={320}
      step={32}
      disabled
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <Label className="text-sm font-medium">Bitrate</Label>
        <span className="text-sm tabular-nums text-muted-foreground">
          320 kbps
        </span>
      </div>
    </Slider>
  )
}
