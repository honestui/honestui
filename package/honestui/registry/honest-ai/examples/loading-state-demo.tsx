import { LoadingState } from "@/registry/honest-ai/ai/loading-state"

/**
 * A reply in progress, shown where it usually sits: under the reader's own
 * request. The bubble is sample copy; nothing is building an export here.
 */
export default function LoadingStateDemo() {
  return (
    <div className="flex w-full max-w-[32rem] min-w-0 flex-col gap-[var(--hui-space-6)]">
      <p className="m-0 max-w-[80%] self-end rounded-[var(--hui-radius-4)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [line-height:20px]">
        Export last quarter&apos;s invoices as a CSV, grouped by region.
      </p>
      <LoadingState label="Building the export" />
    </div>
  )
}
