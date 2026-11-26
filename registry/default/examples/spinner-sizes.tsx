import { Spinner } from "@/registry/default/ui/spinner"

export default function SpinnerSizes() {
  return (
    <div className="flex items-center gap-[var(--hui-space-6)] text-[var(--hui-color-foreground-base-primary)]">
      <Spinner size="sm" label="Loading, small" />
      <Spinner label="Loading, default" />
      <Spinner size="lg" label="Loading, large" />
      <Spinner
        size={32}
        label="Loading, 32 pixels"
        className="text-[var(--hui-color-foreground-accent-primary)]"
      />
    </div>
  )
}
