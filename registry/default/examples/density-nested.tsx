import { Button } from "@/registry/default/ui/button"
import { DensityScope } from "@/registry/default/ui/density"
import { Input } from "@/registry/default/ui/input"

export default function DensityNested() {
  return (
    <DensityScope
      density="compact"
      data-testid="density-nested-outer"
      className="grid w-full max-w-md gap-[var(--hui-density-gap)] rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-4)]"
    >
      <p className="[font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
        Compact panel
        <span className="hidden density-compact:inline"> (compact variant active)</span>
      </p>
      <div className="flex flex-wrap items-center gap-[var(--hui-density-gap)]">
        <Input aria-label="Search rows" placeholder="Search rows" className="w-44" />
        <Button variant="secondary">Filter</Button>
      </div>

      <DensityScope
        density="comfortable"
        data-testid="density-nested-inner"
        className="grid gap-[var(--hui-density-gap)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-neutral-primary)] p-[var(--hui-space-4)]"
      >
        <p className="[font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
          Comfortable override
          <span className="hidden density-compact:inline"> (compact variant active)</span>
        </p>
        <div className="flex flex-wrap items-center gap-[var(--hui-density-gap)]">
          <Input aria-label="Note" placeholder="Add a note" className="w-44" />
          <Button>Save note</Button>
        </div>
      </DensityScope>
    </DensityScope>
  )
}
