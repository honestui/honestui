"use client"

import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog"
import { X as XIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal {...props} />
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-[var(--rs-z-index-portal)] bg-[var(--rs-color-overlay-black-a5)] [backdrop-filter:var(--rs-blur-lg)] [transition:opacity_var(--rs-duration-normal)_var(--rs-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 [@media(prefers-reduced-transparency:reduce)]:bg-[var(--rs-color-overlay-black-a9)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]",
        className
      )}
      {...props}
    />
  )
}

function DialogPopup({
  className,
  children,
  showCloseButton = true,
  showNestedAnimation = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  showNestedAnimation?: boolean
}) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <div
        data-slot="dialog-viewport"
        className="pointer-events-none fixed inset-0 z-[var(--rs-z-index-portal)] flex items-center justify-center"
      >
        <DialogPrimitive.Popup
          data-slot="dialog-popup"
          className={cn(
            "pointer-events-auto fixed top-0 left-1/2 min-h-[100px] max-h-[85vh] w-[400px] min-w-[200px] max-w-[90vw] overflow-auto rounded-[var(--rs-radius-2)] bg-[var(--rs-color-background-base-primary)] p-0 shadow-[var(--rs-shadow-floating)] [transform:translate(-50%,min(160px,calc(50vh-50%)))] outline-none [transition:opacity_var(--rs-duration-normal)_var(--rs-ease-out)] focus:outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 after:pointer-events-none data-nested-dialog-open:after:absolute data-nested-dialog-open:after:inset-0 data-nested-dialog-open:after:rounded-[inherit] data-nested-dialog-open:after:bg-[var(--rs-color-overlay-black-a1)] motion-safe:[transition:opacity_var(--rs-duration-normal)_var(--rs-ease-out),transform_var(--rs-duration-normal)_var(--rs-ease-out)]",
            showNestedAnimation &&
              "[transform:translate(-50%,min(160px,calc(50vh-50%)))_scale(calc(1-0.1*var(--nested-dialogs,0)))] [translate:0_calc(1.25rem*var(--nested-dialogs,0))] motion-safe:data-ending-style:[transform:translate(-50%,min(160px,calc(50vh-50%)))_scale(0.9)] motion-safe:data-starting-style:[transform:translate(-50%,min(160px,calc(50vh-50%)))_scale(0.9)]",
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute top-[18px] right-[var(--rs-space-7)] inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rs-radius-2)] border border-transparent opacity-70 outline-none hover:opacity-100 focus-visible:[outline:var(--rs-focus-ring)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1 border-b border-[var(--rs-color-border-base-primary)] px-[var(--rs-space-7)] py-[var(--rs-space-5)] text-left",
        className
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "px-[var(--rs-space-7)] py-[var(--rs-space-9)]",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 px-[var(--rs-space-7)] py-[var(--rs-space-5)] [[data-slot=dialog-body]+&]:border-t [[data-slot=dialog-body]+&]:border-[var(--rs-color-border-base-primary)] sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "m-0 text-[var(--rs-color-foreground-base-primary)] [font-size:var(--rs-font-size-large)] [font-style:normal] [font-weight:var(--rs-font-weight-medium)] [letter-spacing:var(--rs-letter-spacing-large)] [line-height:var(--rs-line-height-large)]",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "m-0 text-[var(--rs-color-foreground-base-secondary)] [font-size:var(--rs-font-size-small)] [font-style:normal] [font-weight:var(--rs-font-weight-regular)] [letter-spacing:var(--rs-letter-spacing-small)] [line-height:var(--rs-line-height-small)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogBackdrop as DialogOverlay,
  DialogPopup,
  DialogPopup as DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
