import { ChevronDown as ChevronDownIcon } from "love-ui/icons"

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/registry/default/ui/collapsible"

export default function CollapsibleDemo() {
  return (
    <Collapsible>
      <CollapsibleTrigger className="inline-flex items-center gap-2 text-sm font-medium data-panel-open:[&_svg]:rotate-180">
        Show recovery keys
        <ChevronDownIcon className="size-4" />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <ul className="flex flex-col gap-1 py-2 text-sm text-muted-foreground">
          <li className="rounded-sm bg-muted px-2 py-1 font-mono">
            4829-1735-6621
          </li>
          <li className="rounded-sm bg-muted px-2 py-1 font-mono">
            9182-6407-5532
          </li>
          <li className="rounded-sm bg-muted px-2 py-1 font-mono">
            3051-7924-9018
          </li>
        </ul>
      </CollapsiblePanel>
    </Collapsible>
  )
}
