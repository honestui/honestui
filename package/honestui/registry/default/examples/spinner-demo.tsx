import { Spinner } from "@/registry/default/ui/spinner"

export default function SpinnerDemo() {
  return (
    <div className="flex items-center gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)]">
      <Spinner label="Loading recent activity" />
      <span aria-hidden="true">Loading recent activity…</span>
    </div>
  )
}
