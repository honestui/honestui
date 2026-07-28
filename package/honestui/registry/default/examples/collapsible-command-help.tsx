import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/registry/default/ui/collapsible"

export default function CollapsibleCommandHelp() {
  return (
    <Collapsible className="w-full max-w-sm rounded-xl border bg-card p-4">
      <CollapsibleTrigger className="font-medium">Keyboard shortcuts</CollapsibleTrigger>
      <CollapsiblePanel className="pt-3 text-sm text-muted-foreground">
        Press <kbd className="rounded border px-1.5 py-0.5 text-xs text-foreground">Ctrl K</kbd> to open search and <kbd className="rounded border px-1.5 py-0.5 text-xs text-foreground">G</kbd> then <kbd className="rounded border px-1.5 py-0.5 text-xs text-foreground">D</kbd> for dashboard.
      </CollapsiblePanel>
    </Collapsible>
  )
}
