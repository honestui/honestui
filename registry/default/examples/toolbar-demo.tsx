import {
  TextAlignCenter as AlignCenterIcon,
  TextAlignStart as AlignLeftIcon,
  TextAlignEnd as AlignRightIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
} from "love-ui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Toggle, ToggleGroup } from "@/registry/default/ui/toggle"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/registry/default/ui/toolbar"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"

const items = [
  { label: "Helvetica", value: "helvetica" },
  { label: "Arial", value: "arial" },
  { label: "Times New Roman", value: "times-new-roman" },
]

export default function ToolbarDemo() {
  return (
    <TooltipProvider>
      <Toolbar>
        <ToggleGroup className="border-none p-0" defaultValue={["left"]}>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  render={<Toggle value="left" />}
                  aria-label="Align left"
                >
                  <AlignLeftIcon />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Align left</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  render={
                    <Toggle value="center" aria-label="Toggle center" />
                  }
                  aria-label="Align center"
                >
                  <AlignCenterIcon />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Align center</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  render={
                    <Toggle value="right" aria-label="Toggle right" />
                  }
                  aria-label="Align right"
                >
                  <AlignRightIcon />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>Align right</TooltipPopup>
          </Tooltip>
        </ToggleGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  render={<Button variant="ghost" size="icon" />}
                  aria-label="Format as currency"
                >
                  <DollarSignIcon />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>
              Format as currency
            </TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  render={<Button variant="ghost" size="icon" />}
                  aria-label="Format as percent"
                >
                  <PercentIcon />
                </ToolbarButton>
              }
            />
            <TooltipPopup sideOffset={8}>
              Format as percent
            </TooltipPopup>
          </Tooltip>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <Select items={items} defaultValue="helvetica">
            <Tooltip>
              <TooltipTrigger
                render={
                  <ToolbarButton
                    nativeButton={false}
                    render={
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    }
                  />
                }
              />
              <TooltipPopup sideOffset={8}>
                Select a different font
              </TooltipPopup>
            </Tooltip>
            <SelectPopup>
              {items.map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup>
          <ToolbarButton render={<Button />}>Save</ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
    </TooltipProvider>
  )
}
