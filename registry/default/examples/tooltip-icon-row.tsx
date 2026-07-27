import { Info as InfoIcon } from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/registry/default/ui/tooltip"

export default function TooltipIconRow() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon" />} aria-label="Info"><InfoIcon /></TooltipTrigger>
      <TooltipPopup>Includes keyboard and screen reader support.</TooltipPopup>
    </Tooltip>
  )
}
