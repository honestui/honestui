"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipPopup({
  className,
  arrowClassName,
  align = "center",
  sideOffset,
  side = "top",
  showArrow = true,
  children,
  ...props
}: TooltipPrimitive.Popup.Props & {
  align?: TooltipPrimitive.Positioner.Props["align"]
  side?: TooltipPrimitive.Positioner.Props["side"]
  sideOffset?: TooltipPrimitive.Positioner.Props["sideOffset"]
  arrowClassName?: string
  showArrow?: boolean
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        data-slot="tooltip-positioner"
        className="z-[var(--hui-z-index-portal)]"
        // The arrow needs room between the trigger and the popup.
        sideOffset={sideOffset ?? (showArrow ? 14 : 4)}
        align={align}
        side={side}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "relative box-border w-fit max-w-[min(400px,var(--available-width))] rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-overlay,var(--hui-shadow-soft))] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out)] data-ending-style:opacity-0 data-instant:[transition-duration:0ms] data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-fast)_var(--hui-ease-out),transform_var(--hui-duration-fast)_var(--hui-ease-out)] motion-safe:[&[data-side=top][data-starting-style]]:[transform:translateY(calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=top][data-ending-style]]:[transform:translateY(calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=right][data-starting-style]]:[transform:translateX(var(--hui-space-1))] motion-safe:[&[data-side=right][data-ending-style]]:[transform:translateX(var(--hui-space-1))] motion-safe:[&[data-side=bottom][data-starting-style]]:[transform:translateY(var(--hui-space-1))] motion-safe:[&[data-side=bottom][data-ending-style]]:[transform:translateY(var(--hui-space-1))] motion-safe:[&[data-side=left][data-starting-style]]:[transform:translateX(calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=left][data-ending-style]]:[transform:translateX(calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=top][data-align=start][data-starting-style]]:[transform:translate(calc(-1*var(--hui-space-1)),calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=top][data-align=start][data-ending-style]]:[transform:translate(calc(-1*var(--hui-space-1)),calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=top][data-align=end][data-starting-style]]:[transform:translate(var(--hui-space-1),calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=top][data-align=end][data-ending-style]]:[transform:translate(var(--hui-space-1),calc(-1*var(--hui-space-1)))] motion-safe:[&[data-side=bottom][data-align=start][data-starting-style]]:[transform:translate(calc(-1*var(--hui-space-1)),var(--hui-space-1))] motion-safe:[&[data-side=bottom][data-align=start][data-ending-style]]:[transform:translate(calc(-1*var(--hui-space-1)),var(--hui-space-1))] motion-safe:[&[data-side=bottom][data-align=end][data-starting-style]]:[transform:translate(var(--hui-space-1),var(--hui-space-1))] motion-safe:[&[data-side=bottom][data-align=end][data-ending-style]]:[transform:translate(var(--hui-space-1),var(--hui-space-1))]",
            className
          )}
          {...props}
        >
          {children}
          {/* Inside the popup so the arrow fades and moves with it. */}
          {showArrow && <TooltipArrow className={arrowClassName} />}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

function TooltipArrow({
  className,
  children,
  ...props
}: TooltipPrimitive.Arrow.Props) {
  return (
    <TooltipPrimitive.Arrow
      data-slot="tooltip-arrow"
      className={cn(
        "z-[var(--hui-z-index-portal)] flex data-[side=top]:bottom-[-10.5px] data-[side=bottom]:top-[-10.5px] data-[side=bottom]:rotate-180 data-[side=left]:right-[-15px] data-[side=left]:-rotate-90 data-[side=inline-start]:right-[-15px] data-[side=inline-start]:-rotate-90 data-[side=right]:left-[-15px] data-[side=right]:rotate-90 data-[side=inline-end]:left-[-15px] data-[side=inline-end]:rotate-90 [&_svg]:text-[var(--hui-color-background-overlay)]",
        className
      )}
      {...props}
    >
      {children ?? (
        // The top strip covers the popup's border under the arrow's base, so the
        // two slanted edges continue the border without a seam.
        <svg width="20" height="11" viewBox="0 -1 20 11" fill="none" aria-hidden="true">
          <path d="M0 -1H20V0L10 10L0 0Z" fill="currentColor" />
          <path
            d="M0 0L10 10L20 0"
            stroke="var(--hui-color-border-overlay)"
            strokeWidth="0.5"
          />
        </svg>
      )}
    </TooltipPrimitive.Arrow>
  )
}

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipArrow,
  TooltipPopup,
  TooltipPopup as TooltipContent,
}
