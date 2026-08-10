import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/registry/default/ui/meter";

export default function MeterDemo() {
  return (
    <div className="flex w-full max-w-sm items-center gap-8">
      <Meter className="min-w-0 flex-1" value={75}>
        <div className="flex items-center justify-between gap-2">
          <MeterLabel>Storage usage</MeterLabel>
          <MeterValue />
        </div>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </Meter>
      <Meter aria-label="Storage used" value={75} variant="circular" />
    </div>
  );
}
