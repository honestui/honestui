"use client"

import * as React from "react"
import {
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselOrientation = "horizontal" | "vertical"

type CarouselApi = {
  /** Index of the slide aligned to the start edge. */
  index: number
  /** Number of slides. */
  count: number
  canScrollPrev: boolean
  canScrollNext: boolean
  scrollTo: (index: number) => void
  scrollPrev: () => void
  scrollNext: () => void
}

type CarouselContextValue = CarouselApi & {
  orientation: CarouselOrientation
  viewportRef: React.RefCallback<HTMLDivElement>
  registerItem: (node: HTMLElement) => () => void
  items: HTMLElement[]
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
}

type CarouselProps = Omit<React.ComponentProps<"div">, "aria-label"> & {
  /** Names the carousel for assistive technology, such as "Featured templates". */
  "aria-label": string
  orientation?: CarouselOrientation
  /** Wrap from the last slide to the first, and back, with the buttons and keys. */
  loop?: boolean
  /** Receives the carousel API whenever its state changes. */
  setApi?: (api: CarouselApi) => void
  onIndexChange?: (index: number) => void
}

function Carousel({
  orientation = "horizontal",
  loop = false,
  setApi,
  onIndexChange,
  className,
  children,
  onKeyDown,
  ...props
}: CarouselProps) {
  const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null)
  const [items, setItems] = React.useState<HTMLElement[]>([])
  const [index, setIndex] = React.useState(0)
  const [edges, setEdges] = React.useState({ atStart: true, atEnd: true })
  const vertical = orientation === "vertical"

  // Items register in document order so labels and dots stay correct when
  // slides are added or removed.
  const registerItem = React.useCallback((node: HTMLElement) => {
    setItems((current) =>
      [...current, node].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      )
    )
    return () => setItems((current) => current.filter((item) => item !== node))
  }, [])

  // Reads the scroll position once per frame. The active slide is the one
  // whose start edge is closest to the viewport's start edge, which also
  // works for several slides per view and for RTL, where scrollLeft is
  // negative.
  React.useEffect(() => {
    if (!viewport) return
    let frame = 0
    const measure = () => {
      frame = 0
      const rtl = !vertical && getComputedStyle(viewport).direction === "rtl"
      const scroll = vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
      const max = vertical
        ? viewport.scrollHeight - viewport.clientHeight
        : viewport.scrollWidth - viewport.clientWidth
      setEdges({ atStart: scroll <= 1, atEnd: scroll >= max - 1 })

      if (items.length === 0) return
      const box = viewport.getBoundingClientRect()
      let closest = 0
      let closestDistance = Infinity
      items.forEach((item, itemIndex) => {
        const rect = item.getBoundingClientRect()
        const distance = vertical
          ? Math.abs(rect.top - box.top)
          : rtl
            ? Math.abs(rect.right - box.right)
            : Math.abs(rect.left - box.left)
        if (distance < closestDistance) {
          closestDistance = distance
          closest = itemIndex
        }
      })
      // At the end edge the last slide may never reach the start edge when
      // several slides share the view, so the last one counts as active.
      setIndex(scroll >= max - 1 && max > 0 ? items.length - 1 : closest)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    viewport.addEventListener("scroll", schedule, { passive: true })
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(viewport)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener("scroll", schedule)
      resizeObserver.disconnect()
    }
  }, [viewport, items, vertical])

  const scrollTo = React.useCallback(
    (target: number) => {
      if (!viewport || items.length === 0) return
      const clamped = Math.max(0, Math.min(items.length - 1, target))
      const item = items[clamped]
      const box = viewport.getBoundingClientRect()
      const rect = item.getBoundingClientRect()
      const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth"
      if (vertical) {
        viewport.scrollBy({ top: rect.top - box.top, behavior })
      } else {
        const rtl = getComputedStyle(viewport).direction === "rtl"
        viewport.scrollBy({
          left: rtl ? rect.right - box.right : rect.left - box.left,
          behavior,
        })
      }
    },
    [viewport, items, vertical]
  )

  const count = items.length
  const canScrollPrev = loop ? count > 1 : !edges.atStart
  const canScrollNext = loop ? count > 1 : !edges.atEnd

  const scrollPrev = React.useCallback(() => {
    if (loop && edges.atStart) scrollTo(count - 1)
    else scrollTo(index - 1)
  }, [loop, edges.atStart, scrollTo, count, index])

  const scrollNext = React.useCallback(() => {
    if (loop && edges.atEnd) scrollTo(0)
    else scrollTo(index + 1)
  }, [loop, edges.atEnd, scrollTo, index])

  const api = React.useMemo<CarouselApi>(
    () => ({ index, count, canScrollPrev, canScrollNext, scrollTo, scrollPrev, scrollNext }),
    [index, count, canScrollPrev, canScrollNext, scrollTo, scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    setApi?.(api)
  }, [api, setApi])

  const lastReportedIndex = React.useRef(index)
  React.useEffect(() => {
    if (lastReportedIndex.current === index) return
    lastReportedIndex.current = index
    onIndexChange?.(index)
  }, [index, onIndexChange])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    // Typing in a field inside a slide keeps its own arrow keys.
    const target = event.target as HTMLElement
    if (target.closest("input, textarea, select, [contenteditable='true'], [role='slider']")) {
      return
    }
    const rtl = !vertical && getComputedStyle(event.currentTarget).direction === "rtl"
    const prevKey = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft"
    const nextKey = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight"
    if (event.key === prevKey) {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === nextKey) {
      event.preventDefault()
      scrollNext()
    }
  }

  return (
    <CarouselContext.Provider
      value={{ ...api, orientation, viewportRef: setViewport, registerItem, items }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        data-orientation={orientation}
        className={cn("relative", className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        {/* Announces the new position after a button, key, or swipe moves
            the carousel. It is polite, so it waits for the user to pause. */}
        <span data-slot="carousel-status" aria-live="polite" aria-atomic="true" className="sr-only">
          {count > 0 ? `Slide ${index + 1} of ${count}` : ""}
        </span>
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { viewportRef, orientation } = useCarousel()
  const vertical = orientation === "vertical"

  return (
    <div
      ref={viewportRef}
      data-slot="carousel-content"
      data-orientation={orientation}
      className={cn(
        // Native scroll snapping does the paging, so touch, trackpad, and
        // wheel gestures behave like the platform without a script.
        // The scrollbar is hidden with !important because apps often style
        // `* { scrollbar-width }` outside a cascade layer, which beats utilities.
        "flex gap-[var(--hui-carousel-gap,var(--hui-space-4))] overscroll-contain [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden! motion-safe:scroll-smooth focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)] rounded-[var(--hui-radius-2)]",
        vertical
          ? "h-full flex-col overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
          : "overflow-x-auto overflow-y-hidden snap-x snap-mandatory",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CarouselItem({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"div">) {
  const { registerItem, items, count } = useCarousel()
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!node) return
    return registerItem(node)
  }, [node, registerItem])

  const position = node ? items.indexOf(node) + 1 : 0

  return (
    <div
      ref={setNode}
      role="group"
      aria-roledescription="slide"
      aria-label={ariaLabel ?? (position > 0 ? `${position} of ${count}` : undefined)}
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
      {...props}
    />
  )
}

type CarouselButtonProps = React.ComponentProps<typeof Button>

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-sm",
  onClick,
  ...props
}: CarouselButtonProps) {
  const { orientation, canScrollPrev, scrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      disabled={!canScrollPrev}
      aria-label="Previous slide"
      className={cn("rounded-full", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) scrollPrev()
      }}
      {...props}
    >
      {orientation === "vertical" ? (
        <ChevronUpIcon aria-hidden="true" />
      ) : (
        <ChevronLeftIcon aria-hidden="true" className="rtl:rotate-180" />
      )}
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon-sm",
  onClick,
  ...props
}: CarouselButtonProps) {
  const { orientation, canScrollNext, scrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      disabled={!canScrollNext}
      aria-label="Next slide"
      className={cn("rounded-full", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) scrollNext()
      }}
      {...props}
    >
      {orientation === "vertical" ? (
        <ChevronDownIcon aria-hidden="true" />
      ) : (
        <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
      )}
    </Button>
  )
}

function CarouselDots({ className, ...props }: React.ComponentProps<"div">) {
  const { count, index, scrollTo, orientation } = useCarousel()

  return (
    <div
      data-slot="carousel-dots"
      className={cn(
        "flex items-center justify-center gap-[var(--hui-space-1)]",
        orientation === "vertical" && "flex-col",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }, (_, dotIndex) => {
        const active = dotIndex === index
        return (
          <button
            key={dotIndex}
            type="button"
            data-slot="carousel-dot"
            data-active={active ? "" : undefined}
            aria-label={`Go to slide ${dotIndex + 1}`}
            aria-current={active ? "true" : undefined}
            onClick={() => scrollTo(dotIndex)}
            className="group relative inline-flex size-[var(--hui-space-5)] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[-2px] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-6"
          >
            <span
              aria-hidden="true"
              className="block size-1.5 rounded-full bg-[var(--hui-color-foreground-base-tertiary)] motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),width_var(--hui-duration-fast)_var(--hui-ease-out)] group-hover:bg-[var(--hui-color-foreground-base-secondary)] group-data-active:w-3.5 group-data-active:bg-[var(--hui-color-foreground-base-primary)] forced-colors:bg-[GrayText] forced-colors:group-data-active:bg-[Highlight]"
            />
          </button>
        )
      })}
    </div>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  useCarousel,
  type CarouselApi,
  type CarouselProps,
}
