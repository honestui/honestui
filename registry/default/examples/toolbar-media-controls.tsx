import { Pause as PauseIcon, Play as PlayIcon, SkipForward as SkipForwardIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/registry/default/ui/toolbar"

export default function ToolbarMediaControls() {
  return (
    <Toolbar>
      <ToolbarGroup>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Play"><PlayIcon /></ToolbarButton>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Pause"><PauseIcon /></ToolbarButton>
        <ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label="Skip"><SkipForwardIcon /></ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  )
}
