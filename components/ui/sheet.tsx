"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
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
      const nextHeader = viewport.querySelector<HTMLElement>('[data-slot="sheet-header"]:not(.sr-only)')
      const nextFooter = viewport.querySelector<HTMLElement>('[data-slot="sheet-footer"]')
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

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal {...props} />
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetBackdrop({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        "fixed inset-0 z-[var(--hui-z-index-portal)] bg-[var(--hui-color-overlay-black-a5)] [backdrop-filter:var(--hui-blur-lg)] [transition:opacity_var(--hui-duration-normal)_var(--hui-ease-out)] data-ending-style:opacity-0 data-starting-style:opacity-0 [@media(prefers-reduced-transparency:reduce)]:bg-[var(--hui-color-overlay-black-a9)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]",
        className
      )}
      {...props}
    />
  )
}

function SheetPopup({
  className,
  children,
  showBackdrop = true,
  showCloseButton = true,
  side = "right",
  ...props
}: SheetPrimitive.Popup.Props & {
  showBackdrop?: boolean
  showCloseButton?: boolean
  side?: "top" | "right" | "bottom" | "left"
}) {
  const scrollViewportRef = usePinnedScrollPadding()

  return (
    <SheetPortal>
      {showBackdrop && <SheetBackdrop />}
      <SheetPrimitive.Popup
        data-slot="sheet-popup"
        data-close-button={showCloseButton ? "" : undefined}
        className={cn(
          "fixed z-[var(--hui-z-index-portal)] flex h-[100dvh] max-h-[100dvh] flex-col gap-4 overflow-hidden border-[var(--hui-color-border-overlay)] bg-[var(--hui-color-background-overlay)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-floating)] [transition:opacity_var(--hui-duration-drawer)_var(--hui-ease-drawer)] motion-safe:[transition:opacity_var(--hui-duration-drawer)_var(--hui-ease-drawer),translate_var(--hui-duration-drawer)_var(--hui-ease-drawer)] motion-safe:will-change-[translate] motion-reduce:[transition-duration:var(--hui-duration-fast)] motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0",
          side === "right" &&
            "inset-y-0 right-0 h-full w-[calc(100%-(--spacing(12)))] max-w-sm border-s-[0.5px] motion-safe:data-ending-style:translate-x-full motion-safe:data-starting-style:translate-x-full",
          side === "left" &&
            "inset-y-0 left-0 h-full w-[calc(100%-(--spacing(12)))] max-w-sm border-e-[0.5px] motion-safe:data-ending-style:-translate-x-full motion-safe:data-starting-style:-translate-x-full",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b-[0.5px] motion-safe:data-ending-style:-translate-y-full motion-safe:data-starting-style:-translate-y-full",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t-[0.5px] motion-safe:data-ending-style:translate-y-full motion-safe:data-starting-style:translate-y-full",
          className
        )}
        {...props}
      >
        {/* Content scrolls here so the close button stays pinned to the popup. */}
        <div
          ref={scrollViewportRef}
          data-slot="sheet-scroll-viewport"
          className="flex min-h-0 flex-1 flex-col gap-[inherit] overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute end-[10px] top-[14px] z-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--hui-radius-2)] border border-transparent text-[var(--hui-color-foreground-base-secondary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-overlay-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("top-0 z-1 flex flex-col gap-[var(--hui-space-2)] not-[.sr-only]:sticky bg-[var(--hui-color-background-overlay)] p-4 in-data-close-button:pe-11", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
      "sticky bottom-0 z-1 mt-auto flex flex-col gap-2 bg-[var(--hui-color-background-overlay)] p-4 *:w-full sm:flex-row sm:justify-end sm:*:w-auto",
      className
    )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("m-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("[font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)] text-[var(--hui-color-foreground-base-secondary)]", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetBackdrop,
  SheetBackdrop as SheetOverlay,
  SheetPopup,
  SheetPopup as SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
