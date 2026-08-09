"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui-components/react/tooltip"

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
  sideOffset = 4,
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
        className="z-[var(--rs-z-index-portal)]"
        sideOffset={sideOffset}
        align={align}
        side={side}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "relative box-border w-fit max-w-[400px] rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-[var(--rs-color-background-base-primary)] px-[var(--rs-space-3)] py-[var(--rs-space-2)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-soft)] [font-size:var(--rs-font-size-mini)] [font-weight:var(--rs-font-weight-medium)] [letter-spacing:var(--rs-letter-spacing-mini)] [line-height:var(--rs-line-height-mini)] [transition:opacity_var(--rs-duration-fast)_var(--rs-ease-out)] data-ending-style:opacity-0 data-instant:[transition-duration:0ms] data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--rs-duration-fast)_var(--rs-ease-out),transform_var(--rs-duration-fast)_var(--rs-ease-out)] motion-safe:[&[data-side=top][data-starting-style]]:[transform:translateY(calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=top][data-ending-style]]:[transform:translateY(calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=right][data-starting-style]]:[transform:translateX(var(--rs-space-1))] motion-safe:[&[data-side=right][data-ending-style]]:[transform:translateX(var(--rs-space-1))] motion-safe:[&[data-side=bottom][data-starting-style]]:[transform:translateY(var(--rs-space-1))] motion-safe:[&[data-side=bottom][data-ending-style]]:[transform:translateY(var(--rs-space-1))] motion-safe:[&[data-side=left][data-starting-style]]:[transform:translateX(calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=left][data-ending-style]]:[transform:translateX(calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=top][data-align=start][data-starting-style]]:[transform:translate(calc(-1*var(--rs-space-1)),calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=top][data-align=start][data-ending-style]]:[transform:translate(calc(-1*var(--rs-space-1)),calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=top][data-align=end][data-starting-style]]:[transform:translate(var(--rs-space-1),calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=top][data-align=end][data-ending-style]]:[transform:translate(var(--rs-space-1),calc(-1*var(--rs-space-1)))] motion-safe:[&[data-side=bottom][data-align=start][data-starting-style]]:[transform:translate(calc(-1*var(--rs-space-1)),var(--rs-space-1))] motion-safe:[&[data-side=bottom][data-align=start][data-ending-style]]:[transform:translate(calc(-1*var(--rs-space-1)),var(--rs-space-1))] motion-safe:[&[data-side=bottom][data-align=end][data-starting-style]]:[transform:translate(var(--rs-space-1),var(--rs-space-1))] motion-safe:[&[data-side=bottom][data-align=end][data-ending-style]]:[transform:translate(var(--rs-space-1),var(--rs-space-1))]",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
        {showArrow && <TooltipArrow className={arrowClassName} />}
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
        "z-[var(--rs-z-index-portal)] [filter:drop-shadow(0_1px_0_var(--rs-color-border-base-primary))_drop-shadow(0_1px_1px_var(--rs-color-border-base-primary))] data-[side=top]:bottom-[-7px] data-[side=bottom]:top-0 data-[side=bottom]:-translate-y-full data-[side=bottom]:rotate-180 data-[side=left]:right-0 data-[side=left]:translate-x-full data-[side=left]:-translate-y-1/2 data-[side=left]:-rotate-90 data-[side=inline-start]:right-0 data-[side=inline-start]:translate-x-full data-[side=inline-start]:-translate-y-1/2 data-[side=inline-start]:-rotate-90 data-[side=right]:left-0 data-[side=right]:-translate-x-full data-[side=right]:-translate-y-1/2 data-[side=right]:rotate-90 data-[side=inline-end]:left-0 data-[side=inline-end]:-translate-x-full data-[side=inline-end]:-translate-y-1/2 data-[side=inline-end]:rotate-90 [&_svg]:text-[var(--rs-color-background-base-primary)]",
        className
      )}
      {...props}
    >
      {children ?? (
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <path d="M0 0H20L10 10L0 0Z" fill="currentColor" />
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
