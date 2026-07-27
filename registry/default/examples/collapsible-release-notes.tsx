import { ChevronDown as ChevronDownIcon } from "love-ui/icons"

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/registry/default/ui/collapsible"

export default function CollapsibleReleaseNotes() {
  return (
    <Collapsible className="w-full max-w-md rounded-xl border p-4" defaultOpen>
      <CollapsibleTrigger className="flex w-full items-center justify-between font-medium">
        Release notes
        <ChevronDownIcon className="size-4" />
      </CollapsibleTrigger>
      <CollapsiblePanel className="pt-3 text-sm text-muted-foreground">
        Version 2.4 adds command shortcuts, denser tables, and improved focus rings.
      </CollapsiblePanel>
    </Collapsible>
  )
}
