import { MousePointer2 as MousePointer2Icon, Move as MoveIcon, PenLine as PenLineIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/registry/default/ui/toolbar"

export default function ToolbarCanvasControls() {
  return (
    <Toolbar>
      <ToolbarGroup>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Select"><MousePointer2Icon /></ToolbarButton>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Move"><MoveIcon /></ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Draw"><PenLineIcon /></ToolbarButton>
    </Toolbar>
  )
}
