"use client"

import type * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar"

import { cn } from "@/lib/utils"
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
} from "@/components/ui/menu"

// The bar shares the Toolbar's frame: a hairline edge around a tight inner
// gap, with the outer radius grown by that gap so the corners stay concentric
// with the triggers inside.
function Menubar({
  className,
  ...props
}: MenubarPrimitive.Props & React.RefAttributes<HTMLDivElement>) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn(
        "flex w-fit max-w-full items-center gap-[var(--hui-density-group-gap,var(--hui-space-1))] rounded-[calc(var(--hui-radius-2)+var(--hui-density-group-gap,var(--hui-space-1)))] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-density-group-gap,var(--hui-space-1))] shadow-[var(--hui-shadow-feather)] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-disabled:opacity-60 forced-colors:border-[CanvasText]",
        className
      )}
      {...props}
    />
  )
}

function MenubarMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="menubar-menu" {...props} />
}

// A trigger is a quiet text button: no edge at rest, the page hover tint on
// hover, and the same tint held while its menu is open so the bar shows
// which menu the popup belongs to.
function MenubarTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        "relative inline-flex min-h-[var(--hui-control-height-sm,var(--hui-space-8))] shrink-0 cursor-pointer items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] outline-none select-none [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)] not-data-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] data-popup-open:bg-[var(--hui-color-background-neutral-secondary)] data-pressed:bg-[var(--hui-color-background-neutral-secondary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] data-disabled:cursor-not-allowed data-disabled:text-[var(--hui-color-foreground-base-tertiary)] in-data-[orientation=vertical]:justify-start forced-colors:data-popup-open:outline forced-colors:data-popup-open:outline-1 forced-colors:data-popup-open:outline-[Highlight] pointer-coarse:after:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:min-h-11 pointer-coarse:after:-translate-y-1/2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

// Menubar menus open below and start-aligned with their trigger, like a
// desktop app, rather than centered as a standalone dropdown is.
function MenubarContent({
  align = "start",
  sideOffset = 6,
  alignOffset = -4,
  ...props
}: React.ComponentProps<typeof MenuPopup>) {
  return (
    <MenuPopup
      data-slot="menubar-content"
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenuPortal as MenubarPortal,
  MenuGroup as MenubarGroup,
  MenuGroupLabel as MenubarLabel,
  MenuItem as MenubarItem,
  MenuCheckboxItem as MenubarCheckboxItem,
  MenuRadioGroup as MenubarRadioGroup,
  MenuRadioItem as MenubarRadioItem,
  MenuSeparator as MenubarSeparator,
  MenuShortcut as MenubarShortcut,
  MenuSub as MenubarSub,
  MenuSubTrigger as MenubarSubTrigger,
  MenuSubPopup as MenubarSubContent,
}
