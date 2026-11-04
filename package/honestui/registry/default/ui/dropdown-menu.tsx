"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check as CheckIcon, ChevronRight as ChevronRightIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { useDensity } from "@/registry/default/ui/density"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const density = useDensity()

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-[var(--hui-z-index-portal)] outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          data-density={density}
          className={cn("z-[var(--hui-z-index-portal)] max-h-(--available-height) min-w-[max(var(--anchor-width),8rem)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-overlay)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] border-[0.5px] border-[var(--hui-color-border-overlay)] shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))] outline-none [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),scale_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97]", className )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-[var(--hui-space-3)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-secondary)] data-inset:ps-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-[var(--hui-space-3)] min-h-[var(--hui-density-item-min-height,0px)] rounded-[var(--hui-radius-item,var(--hui-radius-2))] py-[var(--hui-density-item-padding-block,var(--hui-space-3))] px-[var(--hui-space-3)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] outline-hidden select-none data-highlighted:bg-[var(--hui-color-background-overlay-hover)] data-highlighted:text-[var(--hui-color-foreground-base-primary)] data-inset:ps-8 data-[variant=destructive]:text-[var(--hui-color-foreground-danger-primary)] data-[variant=destructive]:data-highlighted:bg-[var(--hui-color-background-danger-primary)] data-[variant=destructive]:data-highlighted:text-[var(--hui-color-foreground-danger-primary)] data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] [&_svg]:pointer-events-none [&_svg]:text-[var(--hui-color-foreground-base-secondary)] data-disabled:[&_svg]:text-[var(--hui-color-foreground-base-tertiary)] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:[&_svg]:text-[var(--hui-color-foreground-danger-primary)]",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-[var(--hui-space-3)] data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] min-h-[var(--hui-density-item-min-height,0px)] rounded-[var(--hui-radius-item,var(--hui-radius-2))] py-[var(--hui-density-item-padding-block,var(--hui-space-3))] px-[var(--hui-space-3)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] outline-hidden select-none data-highlighted:bg-[var(--hui-color-background-overlay-hover)] data-highlighted:text-[var(--hui-color-foreground-base-primary)] data-inset:ps-8 data-popup-open:bg-[var(--hui-color-background-overlay-hover)] data-popup-open:text-[var(--hui-color-foreground-base-primary)] [&_svg]:pointer-events-none [&_svg]:text-[var(--hui-color-foreground-base-secondary)] data-disabled:[&_svg]:text-[var(--hui-color-foreground-base-tertiary)] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto rtl:rotate-180" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -4,
  side = "inline-end",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-auto min-w-[96px] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-overlay)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] border-[0.5px] border-[var(--hui-color-border-overlay)] shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))] [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),scale_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97]", className )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-[var(--hui-space-3)] min-h-[var(--hui-density-item-min-height,0px)] rounded-[var(--hui-radius-item,var(--hui-radius-2))] py-[var(--hui-density-item-padding-block,var(--hui-space-3))] ps-8 pe-[var(--hui-space-3)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] outline-hidden select-none data-highlighted:bg-[var(--hui-color-background-overlay-hover)] data-highlighted:text-[var(--hui-color-foreground-base-primary)] data-inset:ps-8 data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute start-[var(--hui-space-3)] flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-[var(--hui-space-3)] min-h-[var(--hui-density-item-min-height,0px)] rounded-[var(--hui-radius-item,var(--hui-radius-2))] py-[var(--hui-density-item-padding-block,var(--hui-space-3))] ps-8 pe-[var(--hui-space-3)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] outline-hidden select-none data-highlighted:bg-[var(--hui-color-background-overlay-hover)] data-highlighted:text-[var(--hui-color-foreground-base-primary)] data-inset:ps-8 data-disabled:pointer-events-none data-disabled:text-[var(--hui-color-foreground-base-tertiary)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute start-[var(--hui-space-3)] flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-[var(--hui-space-2)] h-0 border-t-[0.5px] border-[var(--hui-color-border-overlay)] [margin-inline:calc(var(--hui-space-2)*-1)]", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ms-auto ps-[var(--hui-space-4)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] text-[var(--hui-color-foreground-base-secondary)]",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
