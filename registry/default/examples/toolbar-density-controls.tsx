import { Rows3 as Rows3Icon, Rows4 as Rows4Icon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/registry/default/ui/toolbar"

export default function ToolbarDensityControls() {
  return (
    <Toolbar>
      <ToolbarGroup>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Comfortable"><Rows4Icon /></ToolbarButton>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Compact"><Rows3Icon /></ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton render={<Button variant="ghost" />}>Reset</ToolbarButton>
    </Toolbar>
  )
}
