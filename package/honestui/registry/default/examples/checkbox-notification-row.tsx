import { Bell as BellIcon } from "honestui/icons"

import { Checkbox } from "@/registry/default/ui/checkbox"
import { Label } from "@/registry/default/ui/label"

export default function CheckboxNotificationRow() {
  return (
    <Label className="flex max-w-sm items-start gap-3 rounded-lg border p-4">
      <Checkbox defaultChecked className="mt-0.5" />
      <BellIcon className="mt-0.5 size-4 text-muted-foreground" />
      <span className="grid gap-1">
        <span className="font-medium">Product updates</span>
        <span className="text-sm text-muted-foreground">Send me release notes and migration tips.</span>
      </span>
    </Label>
  )
}
