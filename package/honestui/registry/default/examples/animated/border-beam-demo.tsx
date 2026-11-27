import { BorderBeam } from "@/registry/default/animated/border-beam";

export default function BorderBeamDemo() {
  return (
    <div className="relative w-80 overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">Deployment</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-foreground/60" />
          Building
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">honest-ui · main</p>
      <p className="mt-1 text-xs text-muted-foreground">Started 42 seconds ago by the release workflow.</p>
      <BorderBeam duration={6} size={90} />
    </div>
  );
}
