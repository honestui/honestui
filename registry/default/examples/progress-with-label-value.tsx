import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/registry/default/ui/progress";

export default function ProgressWithLabelValueDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Progress value={60}>
        <div className="flex items-center justify-between gap-2">
          <ProgressLabel>Export data</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      <div className="flex items-center gap-8">
        <Progress aria-label="Export data" value={60} variant="circular" />
        <Progress
          aria-label="Preparing export"
          value={null}
          variant="circular"
        />
      </div>
    </div>
  );
}
