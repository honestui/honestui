import { Lock as LockIcon } from "honestui/icons"

import { Switch } from "@/registry/default/ui/switch"

export default function SwitchPrivacyMode() {
  return (
    <label className="flex max-w-sm items-center justify-between gap-6 rounded-xl border p-4">
      <span className="flex items-center gap-3 text-sm font-medium"><LockIcon className="size-4 text-muted-foreground" /> Private workspace</span>
      <Switch defaultChecked />
    </label>
  )
}
