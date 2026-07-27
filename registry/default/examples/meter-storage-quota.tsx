import { Meter, MeterIndicator, MeterTrack, MeterValue } from "@/registry/default/ui/meter"

export default function MeterStorageQuota() {
  return (
    <Meter value={72} className="w-full max-w-xs">
      <div className="flex justify-between text-sm font-medium">
        <span>Storage used</span>
        <MeterValue />
      </div>
      <MeterTrack className="rounded-full"><MeterIndicator /></MeterTrack>
    </Meter>
  )
}
