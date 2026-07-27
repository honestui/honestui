import { Grid2x2 as Grid2X2Icon, List as ListIcon } from "love-ui/icons"

import { Toggle, ToggleGroup } from "@/registry/default/ui/toggle"

export default function ToggleViewMode() {
  return (
    <ToggleGroup defaultValue={["grid"]} variant="outline">
      <Toggle value="grid" aria-label="Grid view"><Grid2X2Icon /></Toggle>
      <Toggle value="list" aria-label="List view"><ListIcon /></Toggle>
    </ToggleGroup>
  )
}
