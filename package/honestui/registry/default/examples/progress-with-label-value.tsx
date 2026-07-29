import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/registry/default/ui/progress"

export default function ProgressWithLabelValueDemo() {
  return (
    <Progress className="w-full max-w-64" value={60}>
      <div className="flex items-center justify-between gap-2">
        <ProgressLabel>Export data</ProgressLabel>
        <ProgressValue />
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  )
}
