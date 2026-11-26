"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X as XIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

type DrawerSide = "top" | "right" | "bottom" | "left"

// The side the drawer enters from, and the swipe that dismisses it.
const SWIPE_DIRECTION = {
  top: "up",
  right: "right",
  bottom: "down",
  left: "left",
} as const satisfies Record<DrawerSide, DrawerPrimitive.Root.Props["swipeDirection"]>

const DrawerSideContext = React.createContext<DrawerSide>("bottom")

function Drawer({
  side = "bottom",
  ...props
}: DrawerPrimitive.Root.Props & {
  side?: DrawerSide
}) {
  return (
    <DrawerSideContext.Provider value={side}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        swipeDirection={SWIPE_DIRECTION[side]}
        {...props}
      />
    </DrawerSideContext.Provider>
  )
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal {...props} />
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerBackdrop({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        // The Sheet backdrop, faded by swipe progress so it lightens as the
        // drawer is dragged away. Release timing follows the swipe velocity.
        "fixed inset-0 z-[var(--hui-z-index-portal)] min-h-dvh bg-[var(--hui-color-overlay-black-a5)] [backdrop-filter:var(--hui-blur-lg)] opacity-[calc(1-var(--drawer-swipe-progress,0))] [transition:opacity_var(--hui-duration-drawer)_var(--hui-ease-drawer)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:[transition-duration:calc(var(--drawer-swipe-strength,1)*var(--hui-duration-drawer))] data-swiping:[transition-duration:0ms] [@media(prefers-reduced-transparency:reduce)]:bg-[var(--hui-color-overlay-black-a9)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]",
        className
      )}
      {...props}
    />
  )
}

const viewportClasses: Record<DrawerSide, string> = {
  bottom: "items-end justify-center",
  top: "items-start justify-center",
  right: "items-stretch justify-end",
  left: "items-stretch justify-start",
}

const popupClasses: Record<DrawerSide, string> = {
  // Snap points push a bottom drawer down by --drawer-snap-point-offset.
  // Matching bottom padding keeps the end of the content reachable, and the
  // ::after bleed fills the gap if the drawer is pulled past its height.
  bottom: cn(
    "w-full max-h-[calc(100dvh-var(--hui-space-12))] rounded-t-[var(--hui-radius-4)] border-t-[0.5px]",
    "[transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))]",
    "[padding-bottom:max(env(safe-area-inset-bottom,0px),calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))] data-starting-style:[padding-bottom:0] data-ending-style:[padding-bottom:0]",
    "after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-[var(--hui-space-12)] after:bg-inherit after:content-['']",
    "motion-safe:data-starting-style:[transform:translateY(100%)] motion-safe:data-ending-style:[transform:translateY(100%)]"
  ),
  top: cn(
    "w-full max-h-[calc(100dvh-var(--hui-space-12))] rounded-b-[var(--hui-radius-4)] border-b-[0.5px] pt-[env(safe-area-inset-top,0px)]",
    "[transform:translateY(var(--drawer-swipe-movement-y,0px))]",
    "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-full after:h-[var(--hui-space-12)] after:bg-inherit after:content-['']",
    "motion-safe:data-starting-style:[transform:translateY(-100%)] motion-safe:data-ending-style:[transform:translateY(-100%)]"
  ),
  right: cn(
    "h-full w-[calc(100%-(--spacing(12)))] max-w-sm border-s-[0.5px]",
    "[transform:translateX(var(--drawer-swipe-movement-x,0px))]",
    "motion-safe:data-starting-style:[transform:translateX(100%)] motion-safe:data-ending-style:[transform:translateX(100%)]"
  ),
  left: cn(
    "h-full w-[calc(100%-(--spacing(12)))] max-w-sm border-e-[0.5px]",
    "[transform:translateX(var(--drawer-swipe-movement-x,0px))]",
    "motion-safe:data-starting-style:[transform:translateX(-100%)] motion-safe:data-ending-style:[transform:translateX(-100%)]"
  ),
}

function DrawerHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="drawer-handle"
      className={cn(
        "mx-auto my-[var(--hui-space-3)] h-1 w-10 shrink-0 rounded-[var(--hui-radius-full)] bg-[var(--hui-color-border-base-secondary)] forced-colors:bg-[CanvasText]",
        className
      )}
      {...props}
    />
  )
}

function DrawerPopup({
  className,
  children,
  showBackdrop = true,
  showHandle,
  showCloseButton,
  ...props
}: DrawerPrimitive.Popup.Props & {
  showBackdrop?: boolean
  /** Defaults to true for top and bottom drawers. */
  showHandle?: boolean
  /** Defaults to true for left and right drawers. */
  showCloseButton?: boolean
}) {
  const side = React.useContext(DrawerSideContext)
  const vertical = side === "top" || side === "bottom"
  const handle = showHandle ?? vertical
  const closeButton = showCloseButton ?? !vertical

  return (
    <DrawerPortal>
      {showBackdrop && <DrawerBackdrop />}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn(
          "fixed inset-0 z-[var(--hui-z-index-portal)] flex",
          viewportClasses[side]
        )}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-side={side}
          data-close-button={closeButton ? "" : undefined}
          className={cn(
            "relative flex min-h-0 flex-col border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-floating)] outline-none",
            // Drags follow the pointer with no easing; the release settles
            // with the drawer curve, faster after a quick flick.
            "[transition:transform_var(--hui-duration-drawer)_var(--hui-ease-drawer),padding-bottom_var(--hui-duration-drawer)_var(--hui-ease-drawer),opacity_var(--hui-duration-drawer)_var(--hui-ease-drawer)] motion-safe:will-change-transform data-swiping:select-none data-swiping:[transition-duration:0ms] data-ending-style:[transition-duration:calc(var(--drawer-swipe-strength,1)*var(--hui-duration-drawer))]",
            // Reduced motion: no slide on open or close, only a short fade.
            "motion-reduce:[transition-duration:var(--hui-duration-fast)] motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0",
            "forced-colors:border-[CanvasText]",
            popupClasses[side],
            className
          )}
          {...props}
        >
          {handle && side === "bottom" && <DrawerHandle />}
          {/* Content scrolls here. Text inside stays selectable with a mouse. */}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain touch-auto"
          >
            {children}
          </DrawerPrimitive.Content>
          {handle && side === "top" && <DrawerHandle />}
          {closeButton && (
            <DrawerPrimitive.Close className="absolute end-[10px] top-[14px] z-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-overlay-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <XIcon />
              <span className="sr-only">Close</span>
            </DrawerPrimitive.Close>
          )}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-[var(--hui-space-2)] p-4 in-data-[side=bottom]:pt-1 in-data-[side=bottom]:text-center in-data-close-button:pe-11",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "sticky bottom-0 z-1 mt-auto flex flex-col gap-2 bg-[var(--hui-color-background-overlay)] p-4 *:w-full sm:flex-row sm:justify-end sm:*:w-auto in-data-[side=bottom]:sm:flex-col in-data-[side=bottom]:sm:*:w-full",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn(
        "[font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerBackdrop,
  DrawerBackdrop as DrawerOverlay,
  DrawerPopup,
  DrawerPopup as DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
export type { DrawerSide }
