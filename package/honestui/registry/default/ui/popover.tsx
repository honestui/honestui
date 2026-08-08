"use client"

import { Popover as PopoverPrimitive } from "@base-ui-components/react/popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPopup({
  children,
  className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props & {
  side?: PopoverPrimitive.Positioner.Props["side"]
  align?: PopoverPrimitive.Positioner.Props["align"]
  sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"]
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        data-slot="popover-positioner"
        className="z-[var(--rs-z-index-portal)]"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "box-border max-h-(--available-height) min-w-[var(--rs-space-17)] max-w-[18rem] origin-(--transform-origin) overflow-hidden rounded-[var(--rs-radius-2)] border-[0.5px] border-[var(--rs-color-border-base-primary)] bg-[var(--rs-color-background-base-primary)] p-[var(--rs-space-3)] text-[var(--rs-color-foreground-base-primary)] shadow-[var(--rs-shadow-soft)] outline-0 [font-size:var(--rs-font-size-small)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)] [transition:opacity_var(--rs-duration-normal)_var(--rs-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--rs-duration-normal)_var(--rs-ease-out),transform_var(--rs-duration-normal)_var(--rs-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97]",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}
export {
  Popover,
  PopoverTrigger,
  PopoverPopup,
  PopoverPopup as PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
}
