import { LoadingState } from "@/registry/honest-ai/ai/loading-state"

export default function LoadingStatePatternsExample() {
  return (
    <div className="flex flex-col gap-[var(--hui-space-5)]">
      <LoadingState pattern="drive" label="Reading 3 files" showElapsed={false} />
      <LoadingState pattern="dots" label="Comparing totals" showElapsed={false} />
      <LoadingState pattern="orbit" label="Waiting for the test run" showElapsed={false} />
      <LoadingState pattern="diagonal" label="Scanning the document" showElapsed={false} />
      <LoadingState pattern="diamond" label="Organizing the results" showElapsed={false} />
      <LoadingState pattern="square" label="Preparing the download" showElapsed={false} />
      <LoadingState pattern="pulse" label="Drafting the reply" showElapsed={false} />
    </div>
  )
}
