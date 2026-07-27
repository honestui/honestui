import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon } from "love-ui/icons"

import { Toggle, ToggleGroup } from "@/registry/default/ui/toggle"

export default function ToggleGroupMultiple() {
  return (
    <ToggleGroup defaultValue={["bold"]} multiple>
      <Toggle value="bold" aria-label="Toggle bold">
        <BoldIcon />
      </Toggle>
      <Toggle value="italic" aria-label="Toggle italic">
        <ItalicIcon />
      </Toggle>
      <Toggle value="underline" aria-label="Toggle underline">
        <UnderlineIcon />
      </Toggle>
    </ToggleGroup>
  )
}
