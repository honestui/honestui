"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check as CheckIcon, ChevronRight as ChevronRightIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

const Menu = MenuPrimitive.Root

const MenuPortal = MenuPrimitive.Portal

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={cn(
        "data-pressed:bg-[var(--rs-color-background-base-primary-hover)]",
        className
      )}
      {...props}
    />
  )
}

function MenuPopup({
  className,
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"]
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"]
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot="menu-positioner"
        className="z-[var(--rs-z-index-portal)]"
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menu-popup"
          className={cn(
            "box-border max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-[var(--rs-color-background-base-primary)] p-[var(--rs-space-2)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-soft)] outline-none [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] [transition:opacity_var(--rs-duration-fast)_var(--rs-ease-out)] focus:outline-none focus-visible:outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--rs-duration-fast)_var(--rs-ease-out),transform_var(--rs-duration-fast)_var(--rs-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97]",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function MenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />
}

function MenuItem({
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
      data-slot="menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex items-center gap-[var(--rs-space-3)] p-[var(--rs-space-3)] outline-none select-none [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] aria-disabled:pointer-events-none aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:cursor-pointer data-highlighted:rounded-[var(--rs-radius-2)] data-highlighted:bg-[var(--rs-color-background-base-primary-hover)] data-inset:ps-8 data-[variant=destructive]:text-[var(--rs-color-foreground-danger-primary)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--rs-color-foreground-base-secondary)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function MenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={cn(
        "relative grid grid-cols-[1rem_1fr] items-center gap-[var(--rs-space-3)] p-[var(--rs-space-3)] outline-none in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] aria-disabled:pointer-events-none aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:cursor-pointer data-highlighted:rounded-[var(--rs-radius-2)] data-highlighted:bg-[var(--rs-color-background-base-primary-hover)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--rs-color-foreground-base-secondary)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <MenuPrimitive.CheckboxItemIndicator className="col-start-1">
        <CheckIcon />
      </MenuPrimitive.CheckboxItemIndicator>
      <span className="col-start-2">{children}</span>
    </MenuPrimitive.CheckboxItem>
  )
}

function MenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />
}

function MenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={cn(
        "relative grid grid-cols-[1rem_1fr] items-center gap-[var(--rs-space-3)] p-[var(--rs-space-3)] outline-none in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] aria-disabled:pointer-events-none aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:cursor-pointer data-highlighted:rounded-[var(--rs-radius-2)] data-highlighted:bg-[var(--rs-color-background-base-primary-hover)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--rs-color-foreground-base-secondary)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className="col-start-1">
        <CheckIcon />
      </MenuPrimitive.RadioItemIndicator>
      <span className="col-start-2">{children}</span>
    </MenuPrimitive.RadioItem>
  )
}

function MenuGroupLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="menu-label"
      data-inset={inset}
      className={cn(
        "px-[var(--rs-space-3)] py-[var(--rs-space-2)] [font-size:var(--rs-font-size-mini)] [font-weight:var(--rs-font-weight-medium)] data-inset:ps-8",
        className
      )}
      {...props}
    />
  )
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn(
        "my-[var(--rs-space-2)] h-px bg-[var(--rs-color-border-base-primary)] [margin-inline:calc(var(--rs-space-3)*-1)]",
        className
      )}
      {...props}
    />
  )
}

function MenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn(
        "ms-auto flex items-center text-[var(--rs-color-foreground-base-secondary)] [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />
}

function MenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "relative flex items-center gap-[var(--rs-space-3)] p-[var(--rs-space-3)] outline-none [font-size:var(--rs-font-size-small)] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] aria-disabled:pointer-events-none aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:cursor-pointer data-highlighted:rounded-[var(--rs-radius-2)] data-highlighted:bg-[var(--rs-color-background-base-primary-hover)] data-popup-open:cursor-pointer data-popup-open:rounded-[var(--rs-radius-2)] data-popup-open:bg-[var(--rs-color-background-base-primary-hover)] data-inset:ps-8 [&_svg]:pointer-events-none [&_svg]:text-[var(--rs-color-foreground-base-secondary)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function MenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset = -4,
  align = "start",
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"]
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"]
}) {
  return (
    <MenuPopup
      className={className}
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      data-slot="menu-sub-content"
      {...props}
    />
  )
}

export {
  Menu,
  Menu as DropdownMenu,
  MenuPortal,
  MenuPortal as DropdownMenuPortal,
  MenuTrigger,
  MenuTrigger as DropdownMenuTrigger,
  MenuPopup,
  MenuPopup as DropdownMenuContent,
  MenuGroup,
  MenuGroup as DropdownMenuGroup,
  MenuItem,
  MenuItem as DropdownMenuItem,
  MenuCheckboxItem,
  MenuCheckboxItem as DropdownMenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioGroup as DropdownMenuRadioGroup,
  MenuRadioItem,
  MenuRadioItem as DropdownMenuRadioItem,
  MenuGroupLabel,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator,
  MenuSeparator as DropdownMenuSeparator,
  MenuShortcut,
  MenuShortcut as DropdownMenuShortcut,
  MenuSub,
  MenuSub as DropdownMenuSub,
  MenuSubTrigger,
  MenuSubTrigger as DropdownMenuSubTrigger,
  MenuSubPopup,
  MenuSubPopup as DropdownMenuSubContent,
}
