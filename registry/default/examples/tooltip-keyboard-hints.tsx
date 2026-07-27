import { Button } from "@/registry/default/ui/button"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/registry/default/ui/tooltip"

export default function TooltipKeyboardHints() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
      <TooltipPopup>Press Ctrl S to save changes.</TooltipPopup>
    </Tooltip>
  )
}
