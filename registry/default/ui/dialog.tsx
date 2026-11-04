"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X as XIcon } from "honestui/icons"

import { cn } from "@/lib/utils"

// Pinned headers and footers sit inside the scroll viewport, so focused fields
// could scroll beneath them. Matching scroll padding keeps focus in the clear.
function usePinnedScrollPadding() {
  // A callback ref, because the viewport only mounts once the popup opens.
  const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!viewport) return

    let header: HTMLElement | null = null
    let footer: HTMLElement | null = null
    // Focus rings draw up to 4px outside a control, so leave room for them.
    const ringClearance = 4
    const measure = () => {
      viewport.style.scrollPaddingTop = header ? `${header.offsetHeight + ringClearance}px` : ""
      viewport.style.scrollPaddingBottom = footer ? `${footer.offsetHeight + ringClearance}px` : ""
    }
    const resizeObserver = new ResizeObserver(measure)
    const findPinned = () => {
      const nextHeader = viewport.querySelector<HTMLElement>('[data-slot="dialog-header"]:not(.sr-only)')
      const nextFooter = viewport.querySelector<HTMLElement>('[data-slot="dialog-footer"]')
      if (nextHeader === header && nextFooter === footer) return
      header = nextHeader
      footer = nextFooter
      resizeObserver.disconnect()
      for (const element of [header, footer]) if (element) resizeObserver.observe(element)
      measure()
    }
    const mutationObserver = new MutationObserver(findPinned)
    mutationObserver.observe(viewport, { childList: true, subtree: true })
    findPinned()

    // Browsers skip focus scrolling when the control is already partly in view,
    // even if a pinned bar covers it, so reveal it explicitly. Pointer focus is
    // left alone: scrolling under the cursor would lose the click or selection.
    // Browsers focus during the press itself, so the guard only needs to last
    // until the next task, and a lost pointer release cannot leave it stuck.
    let pointerFocus = false
    let pointerTimer: ReturnType<typeof setTimeout> | undefined
    const onPointerDown = () => {
      pointerFocus = true
      clearTimeout(pointerTimer)
      pointerTimer = setTimeout(() => { pointerFocus = false })
    }
    const revealFocused = (event: FocusEvent) => {
      if (pointerFocus) return
      const target = event.target
      if (!(target instanceof HTMLElement) || header?.contains(target) || footer?.contains(target)) return
      const box = target.getBoundingClientRect()
      const top = (header?.getBoundingClientRect().bottom ?? -Infinity) + ringClearance
      const bottom = (footer?.getBoundingClientRect().top ?? Infinity) - ringClearance
      if (box.top < top || box.bottom > bottom) target.scrollIntoView({ block: "nearest" })
    }
    viewport.addEventListener("pointerdown", onPointerDown, true)
    viewport.addEventListener("focusin", revealFocused)

    return () => {
      clearTimeout(pointerTimer)
      viewport.removeEventListener("pointerdown", onPointerDown, true)
      viewport.removeEventListener("focusin", revealFocused)
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [viewport])

  return setViewport
}

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
        "fixed inset-0 z-[var(--hui-z-index-portal)] bg-[var(--hui-color-overlay-black-a5)] [backdrop-filter:var(--hui-blur-lg)] [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 [@media(prefers-reduced-transparency:reduce)]:bg-[var(--hui-color-overlay-black-a9)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]",
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
  const scrollViewportRef = usePinnedScrollPadding()

  return (
    <DialogPortal>
      <DialogBackdrop />
      <div
        data-slot="dialog-viewport"
        className="pointer-events-none fixed inset-0 z-[var(--hui-z-index-portal)] flex items-center justify-center"
      >
        <DialogPrimitive.Popup
          data-slot="dialog-popup"
          data-close-button={showCloseButton ? "" : undefined}
          className={cn(
            "pointer-events-auto fixed top-0 left-1/2 min-h-[100px] max-h-[85dvh] w-[400px] min-w-[200px] max-w-[90vw] flex flex-col overflow-hidden rounded-[var(--hui-radius-dialog,var(--hui-radius-2))] border-[length:var(--hui-border-width-surface,1px)] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] p-0 shadow-[var(--hui-shadow-floating)] [transform:translate(-50%,min(160px,calc(50vh-50%)))] outline-none [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] focus:outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 after:pointer-events-none data-nested-dialog-open:after:absolute data-nested-dialog-open:after:z-3 data-nested-dialog-open:after:inset-0 data-nested-dialog-open:after:rounded-[inherit] data-nested-dialog-open:after:bg-[var(--hui-color-overlay-black-a1)] motion-safe:[transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out),transform_var(--hui-duration-normal)_var(--hui-ease-out)]",
            showNestedAnimation &&
              "[transform:translate(-50%,min(160px,calc(50vh-50%)))_scale(calc(1-0.1*var(--nested-dialogs,0)))] [translate:0_calc(1.25rem*var(--nested-dialogs,0))] motion-safe:data-ending-style:[transform:translate(-50%,min(160px,calc(50vh-50%)))_scale(0.97)] motion-safe:data-starting-style:[transform:translate(-50%,min(160px,calc(50vh-50%)))_scale(0.97)]",
            className
          )}
          {...props}
        >
          {/* Content scrolls here so the close button stays pinned to the popup. */}
          <div
            ref={scrollViewportRef}
            data-slot="dialog-scroll-viewport"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {children}
          </div>
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute top-[14px] z-2 end-[18px] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-overlay-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
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
        "top-0 z-1 flex flex-col gap-[var(--hui-space-2)] not-[.sr-only]:sticky border-b-[length:var(--hui-border-width-surface,1px)] border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] px-[var(--hui-space-7)] py-[var(--hui-space-5)] text-start in-data-close-button:pe-[calc(var(--hui-space-7)+2.25rem)]",
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
        "px-[var(--hui-space-7)] py-[var(--hui-space-7)]",
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
        "sticky bottom-0 z-1 flex flex-col-reverse gap-2 bg-[var(--hui-color-background-overlay)] px-[var(--hui-space-7)] py-[var(--hui-space-5)] [[data-slot=dialog-body]+&]:border-t-[length:var(--hui-border-width-surface,1px)] [[data-slot=dialog-body]+&]:border-[var(--hui-color-border-overlay)] sm:flex-row sm:justify-end",
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
        "m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-style:normal] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]",
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
        "m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)] [font-style:normal] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]",
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
