import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon } from "honestui/icons"

import { Toggle, ToggleGroup } from "@/registry/default/ui/toggle"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"

export default function TooltipDemo() {
  return (
    <TooltipProvider>
      <ToggleGroup defaultValue={["bold"]} multiple>
        <Tooltip>
          <TooltipTrigger
            render={<Toggle value="bold" aria-label="Toggle bold" />}
          >
            <BoldIcon />
          </TooltipTrigger>
          <TooltipPopup>Bold</TooltipPopup>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle value="italic" aria-label="Toggle italic" />
            }
          >
            <ItalicIcon />
          </TooltipTrigger>
          <TooltipPopup>Italic</TooltipPopup>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle value="underline" aria-label="Toggle underline" />
            }
          >
            <UnderlineIcon />
          </TooltipTrigger>
          <TooltipPopup>Underline</TooltipPopup>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  )
}
