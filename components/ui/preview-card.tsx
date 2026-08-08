"use client"

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

const PreviewCard = PreviewCardPrimitive.Root

function PreviewCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return (
    <PreviewCardPrimitive.Trigger data-slot="preview-card-trigger" {...props} />
  )
}

function PreviewCardPopup({
  className,
  children,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props & {
  align?: PreviewCardPrimitive.Positioner.Props["align"]
  side?: PreviewCardPrimitive.Positioner.Props["side"]
  sideOffset?: PreviewCardPrimitive.Positioner.Props["sideOffset"]
}) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        data-slot="preview-card-positioner"
        className="z-[var(--rs-z-index-portal)] h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) [--animation-duration:var(--rs-duration-moderate)] [--easing:var(--rs-ease-out)] [transition:opacity_var(--animation-duration)_var(--easing)] motion-safe:has-[[data-slot=preview-card-viewport]]:[transition:top_var(--animation-duration)_var(--easing),left_var(--animation-duration)_var(--easing),right_var(--animation-duration)_var(--easing),bottom_var(--animation-duration)_var(--easing),opacity_var(--animation-duration)_var(--easing)]"
        sideOffset={sideOffset}
        align={align}
        side={side}
      >
        <PreviewCardPrimitive.Popup
          data-slot="preview-card-content"
          className={cn(
            "relative box-border h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-(--transform-origin) rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-[var(--rs-color-background-base-primary)] p-[var(--rs-space-3)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-soft)] [transition:opacity_var(--animation-duration)_var(--easing)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--animation-duration)_var(--easing),transform_var(--animation-duration)_var(--easing)] motion-safe:data-ending-style:scale-90 motion-safe:data-starting-style:scale-90 motion-safe:has-[[data-slot=preview-card-viewport]]:[transition:width_var(--animation-duration)_var(--easing),height_var(--animation-duration)_var(--easing),opacity_var(--animation-duration)_var(--easing),transform_var(--animation-duration)_var(--easing)]",
            className
          )}
          {...props}
        >
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

function PreviewCardArrow({
  className,
  ...props
}: PreviewCardPrimitive.Arrow.Props) {
  return (
    <PreviewCardPrimitive.Arrow
      data-slot="preview-card-arrow"
      className={cn(
        "z-[var(--rs-z-index-portal)] [filter:drop-shadow(0_1px_0_var(--rs-color-border-base-primary))_drop-shadow(0_1px_1px_var(--rs-color-border-base-primary))] data-[side=top]:bottom-[-7px] data-[side=bottom]:top-0 data-[side=bottom]:-translate-y-full data-[side=bottom]:rotate-180 data-[side=left]:right-0 data-[side=left]:translate-x-full data-[side=left]:-translate-y-1/2 data-[side=left]:-rotate-90 data-[side=inline-start]:right-0 data-[side=inline-start]:translate-x-full data-[side=inline-start]:-translate-y-1/2 data-[side=inline-start]:-rotate-90 data-[side=right]:left-0 data-[side=right]:-translate-x-full data-[side=right]:-translate-y-1/2 data-[side=right]:rotate-90 data-[side=inline-end]:left-0 data-[side=inline-end]:-translate-x-full data-[side=inline-end]:-translate-y-1/2 data-[side=inline-end]:rotate-90 [&_svg]:text-[var(--rs-color-background-base-primary)]",
        className
      )}
      {...props}
    />
  )
}

function PreviewCardViewport({
  className,
  ...props
}: PreviewCardPrimitive.Viewport.Props) {
  return (
    <PreviewCardPrimitive.Viewport
      data-slot="preview-card-viewport"
      className={cn(
        "relative h-full w-full overflow-clip [&_[data-current]]:w-(--popup-width) [&_[data-current]]:translate-x-0 [&_[data-current]]:opacity-100 [&_[data-current]]:[transition:opacity_calc(var(--animation-duration)/2)_var(--easing)] [&_[data-previous]]:w-(--popup-width) [&_[data-previous]]:translate-x-0 [&_[data-previous]]:opacity-100 [&_[data-previous]]:[transition:opacity_calc(var(--animation-duration)/2)_var(--easing)] data-[activation-direction~=left]:[&_[data-current][data-starting-style]]:opacity-0 data-[activation-direction~=left]:[&_[data-previous][data-ending-style]]:opacity-0 data-[activation-direction~=right]:[&_[data-current][data-starting-style]]:opacity-0 data-[activation-direction~=right]:[&_[data-previous][data-ending-style]]:opacity-0 motion-safe:[&_[data-current]]:[transition:translate_var(--animation-duration)_var(--easing),opacity_calc(var(--animation-duration)/2)_var(--easing)] motion-safe:[&_[data-previous]]:[transition:translate_var(--animation-duration)_var(--easing),opacity_calc(var(--animation-duration)/2)_var(--easing)] motion-safe:data-[activation-direction~=left]:[&_[data-current][data-starting-style]]:[translate:-30%_0] motion-safe:data-[activation-direction~=left]:[&_[data-previous][data-ending-style]]:[translate:30%_0] motion-safe:data-[activation-direction~=right]:[&_[data-current][data-starting-style]]:[translate:30%_0] motion-safe:data-[activation-direction~=right]:[&_[data-previous][data-ending-style]]:[translate:-30%_0]",
        className
      )}
      {...props}
    />
  )
}

export {
  PreviewCard,
  PreviewCard as HoverCard,
  PreviewCardTrigger,
  PreviewCardTrigger as HoverCardTrigger,
  PreviewCardPopup,
  PreviewCardPopup as HoverCardContent,
  PreviewCardArrow,
  PreviewCardArrow as HoverCardArrow,
  PreviewCardViewport,
  PreviewCardViewport as HoverCardViewport,
}
