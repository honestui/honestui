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
        className="z-[var(--hui-z-index-portal)]"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "box-border max-h-(--available-height) min-w-[var(--hui-space-17)] max-w-[18rem] origin-(--transform-origin) overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-soft)] outline-0 [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:[transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out),transform_var(--hui-duration-normal)_var(--hui-ease-out)] motion-safe:data-ending-style:scale-[0.97] motion-safe:data-starting-style:scale-[0.97]",
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
      className={cn(
        "m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-style:normal] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]",
        className
      )}
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
      className={cn(
        "m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-style:normal] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}
function PopoverAnchor({ ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-anchor" {...props} />;
}

export {
  Popover,
  PopoverAnchor,
  PopoverTrigger,
  PopoverPopup,
  PopoverPopup as PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
}
