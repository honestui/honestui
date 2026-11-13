import * as React from "react"

import { Label } from "@/registry/default/ui/label"
import { Switch } from "@/registry/default/ui/switch"

export default function SwitchCardDemo() {
  const id = React.useId()

  return (
    <Label
      htmlFor={id}
      className="flex items-center gap-6 rounded-sm border-[0.5px] p-3 transition-colors hover:bg-accent/50 has-data-checked:border-[var(--hui-color-border-accent-emphasis)] has-data-checked:bg-[var(--hui-accent-2)]"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm leading-4">Enable notifications</p>
        <p className="text-xs text-muted-foreground">
          You can enable or disable notifications at any time.
        </p>
      </div>
      <Switch id={id} defaultChecked />
    </Label>
  )
}
