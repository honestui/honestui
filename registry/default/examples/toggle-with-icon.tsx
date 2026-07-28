import { Bold as BoldIcon } from "honestui/icons"

import { Toggle } from "@/registry/default/ui/toggle"

export default function ToggleWithIcon() {
  return (
    <Toggle variant="outline" aria-label="Toggle bold">
      <BoldIcon />
    </Toggle>
  )
}
