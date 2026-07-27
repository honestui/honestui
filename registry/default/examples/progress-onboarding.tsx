import { Progress, ProgressIndicator, ProgressTrack, ProgressValue } from "@/registry/default/ui/progress"

export default function ProgressOnboarding() {
  return (
    <Progress value={66} className="w-full max-w-xs">
      <div className="flex justify-between text-sm font-medium"><span>Onboarding</span><ProgressValue /></div>
      <ProgressTrack><ProgressIndicator /></ProgressTrack>
    </Progress>
  )
}
