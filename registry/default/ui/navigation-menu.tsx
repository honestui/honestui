"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown as ChevronDownIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

// Top-level triggers and plain links share one quiet, link-button look so a
// row that mixes menus and direct links reads as one set of peers.
const navigationMenuTriggerStyle = cva(
  "relative inline-flex min-h-[var(--hui-density-control-height,36px)] w-max shrink-0 cursor-pointer items-center justify-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-primary)] no-underline outline-none select-none [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)] data-active:bg-[var(--hui-color-background-neutral-secondary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] data-disabled:cursor-not-allowed data-disabled:text-[var(--hui-color-foreground-base-tertiary)] forced-colors:data-popup-open:outline forced-colors:data-popup-open:outline-1 forced-colors:data-popup-open:outline-[Highlight] pointer-coarse:after:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:min-h-11 pointer-coarse:after:-translate-y-1/2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
)

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: NavigationMenuPrimitive.Root.Props & {
  /**
   * Render the shared popup and viewport that hold every item's content.
   * Turn it off to compose `NavigationMenuPositioner` yourself.
   */
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative w-max max-w-full text-[var(--hui-color-foreground-base-primary)]", className)}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuPositioner />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({ className, ...props }: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "relative m-0 flex list-none items-center gap-[var(--hui-space-1)] p-0 in-data-[orientation=vertical]:flex-col in-data-[orientation=vertical]:items-stretch",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({ className, ...props }: NavigationMenuPrimitive.Item.Props) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "pe-[var(--hui-space-3)]", className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon
        data-slot="navigation-menu-icon"
        className="inline-flex text-[var(--hui-color-foreground-base-secondary)] motion-safe:[transition:rotate_var(--hui-duration-fast)_var(--hui-ease-out)] data-popup-open:rotate-180"
      >
        <ChevronDownIcon aria-hidden="true" className="size-3.5" />
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  )
}

// Content slides in from the side of the previously open trigger, so moving
// along the row reads as one panel changing. Reduced motion keeps the fade.
function NavigationMenuContent({ className, ...props }: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "h-full w-[calc(100vw-var(--hui-space-8))] p-[var(--hui-space-2)] sm:w-max [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out),translate_var(--hui-duration-normal)_var(--hui-ease-out)] motion-safe:data-starting-style:data-[activation-direction=left]:-translate-x-1/4 motion-safe:data-starting-style:data-[activation-direction=right]:translate-x-1/4 motion-safe:data-ending-style:data-[activation-direction=left]:translate-x-1/4 motion-safe:data-ending-style:data-[activation-direction=right]:-translate-x-1/4",
        className
      )}
      {...props}
    />
  )
}

// The positioner and popup animate their size between items through the
// --positioner-* and --popup-* variables Base UI measures from the content.
function NavigationMenuPositioner({
  className,
  sideOffset = 8,
  align = "start",
  collisionPadding = { top: 8, bottom: 8, left: 16, right: 16 },
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner
        data-slot="navigation-menu-positioner"
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        collisionAvoidance={{ side: "none" }}
        className={cn(
          // A transparent bridge over the side offset keeps the menu open
          // while the pointer travels from a trigger into the popup.
          "z-[var(--hui-z-index-portal)] h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) before:absolute before:content-[''] data-[side=bottom]:before:inset-x-0 data-[side=bottom]:before:-top-2 data-[side=bottom]:before:h-2 data-[side=top]:before:inset-x-0 data-[side=top]:before:-bottom-2 data-[side=top]:before:h-2 data-[side=left]:before:inset-y-0 data-[side=left]:before:-right-2 data-[side=left]:before:w-2 data-[side=right]:before:inset-y-0 data-[side=right]:before:-left-2 data-[side=right]:before:w-2 motion-safe:[transition:top_var(--hui-duration-normal)_var(--hui-ease-out),left_var(--hui-duration-normal)_var(--hui-ease-out),right_var(--hui-duration-normal)_var(--hui-ease-out),bottom_var(--hui-duration-normal)_var(--hui-ease-out)] data-instant:transition-none",
          className
        )}
        {...props}
      >
        <NavigationMenuPrimitive.Popup
          data-slot="navigation-menu-popup"
          className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))] outline-none [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),scale_var(--hui-duration-fast)_var(--hui-ease-out),width_var(--hui-duration-normal)_var(--hui-ease-out),height_var(--hui-duration-normal)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97] forced-colors:border-[CanvasText]"
        >
          <NavigationMenuPrimitive.Viewport
            data-slot="navigation-menu-viewport"
            className="relative size-full overflow-hidden"
          />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  )
}

// Base UI sets aria-current="page" when `active` is true; the tint mirrors
// that state for sighted users. `variant="trigger"` renders a top-level link
// that sits in the list beside menu triggers.
function NavigationMenuLink({
  className,
  variant = "panel",
  ...props
}: NavigationMenuPrimitive.Link.Props & {
  variant?: "panel" | "trigger"
}) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      data-variant={variant}
      className={cn(
        variant === "trigger"
          ? navigationMenuTriggerStyle()
          : "flex flex-col gap-[var(--hui-space-1)] rounded-[var(--hui-radius-2)] p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] no-underline outline-none [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-control,16px)] motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-overlay-hover)] data-active:bg-[var(--hui-color-background-overlay-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[-2px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-[var(--hui-color-foreground-base-secondary)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuLinkTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-title"
      className={cn(
        "flex items-center gap-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-primary)]",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuLinkDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-description"
      className={cn(
        "line-clamp-2 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuPositioner,
  NavigationMenuPositioner as NavigationMenuViewport,
  NavigationMenuLink,
  NavigationMenuLinkTitle,
  NavigationMenuLinkDescription,
  navigationMenuTriggerStyle,
}
