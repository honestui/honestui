"use client"

import * as React from "react"
import {
  GripHorizontal as GripHorizontalIcon,
  GripVertical as GripVerticalIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"

type ResizableOrientation = "horizontal" | "vertical"

type PanelConstraints = {
  defaultSize: number | undefined
  minSize: number
  maxSize: number
  collapsible: boolean
  collapsedSize: number
}

type PanelEntry = PanelConstraints & { element: HTMLElement }

type ResizableContextValue = {
  orientation: ResizableOrientation
  order: string[]
  sizes: Record<string, number>
  panels: React.RefObject<Map<string, PanelEntry>>
  register: (id: string, entry: PanelEntry) => () => void
  update: (id: string, entry: PanelEntry) => void
  resizePair: (beforeIndex: number, nextBeforeSize: number, base?: Record<string, number>) => void
  resizePanel: (id: string, size: number) => void
  setDragging: (dragging: boolean) => void
}

const ResizableContext = React.createContext<ResizableContextValue | null>(null)

function useResizableGroup() {
  const context = React.useContext(ResizableContext)
  if (!context) {
    throw new Error("Resizable parts must be used within <ResizablePanelGroup />")
  }
  return context
}

const STORAGE_PREFIX = "hui-resizable:"

function round(value: number) {
  return Math.round(value * 1000) / 1000
}

// A collapsible panel dragged below its minimum snaps to whichever of
// collapsed or minimum is closer, so it never rests at an in-between size.
function constrain(size: number, constraints: PanelConstraints) {
  if (constraints.collapsible && size < constraints.minSize) {
    return size < (constraints.minSize + constraints.collapsedSize) / 2
      ? constraints.collapsedSize
      : constraints.minSize
  }
  return Math.min(constraints.maxSize, Math.max(constraints.minSize, size))
}

function readStoredLayout(key: string | undefined, count: number) {
  if (!key) return null
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + key) ?? "null")
    if (
      Array.isArray(parsed) &&
      parsed.length === count &&
      parsed.every((value) => typeof value === "number" && Number.isFinite(value))
    ) {
      return parsed as number[]
    }
  } catch {
    // Storage can be unavailable or hold stale data; fall back to defaults.
  }
  return null
}

function writeStoredLayout(key: string | undefined, layout: number[]) {
  if (!key) return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(layout))
  } catch {
    // Persisting is a convenience; a blocked write must not break resizing.
  }
}

type ResizablePanelGroupProps = React.ComponentProps<"div"> & {
  orientation?: ResizableOrientation
  /** Alias of `orientation`, for code moving from other libraries. */
  direction?: ResizableOrientation
  /** Called with every panel size, in percent, after the layout changes. */
  onLayout?: (sizes: number[]) => void
  /** Remembers the layout in localStorage under this key. */
  autoSaveId?: string
}

function ResizablePanelGroup({
  orientation: orientationProp,
  direction,
  onLayout,
  autoSaveId,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const orientation = orientationProp ?? direction ?? "horizontal"
  const panels = React.useRef(new Map<string, PanelEntry>())
  const [order, setOrder] = React.useState<string[]>([])
  const [sizes, setSizes] = React.useState<Record<string, number>>({})
  const sizesRef = React.useRef(sizes)
  const draggingRef = React.useRef(false)
  const onLayoutRef = React.useRef(onLayout)

  React.useEffect(() => {
    onLayoutRef.current = onLayout
  })

  const commit = React.useCallback(
    (next: Record<string, number>, ids: string[]) => {
      sizesRef.current = next
      setSizes(next)
      const layout = ids.map((id) => round(next[id] ?? 0))
      onLayoutRef.current?.(layout)
      if (!draggingRef.current) writeStoredLayout(autoSaveId, layout)
    },
    [autoSaveId]
  )

  const register = React.useCallback((id: string, entry: PanelEntry) => {
    panels.current.set(id, entry)
    setOrder(sortByDocument(panels.current))
    return () => {
      panels.current.delete(id)
      setOrder(sortByDocument(panels.current))
    }
  }, [])

  const update = React.useCallback((id: string, entry: PanelEntry) => {
    panels.current.set(id, entry)
  }, [])

  // Assigns sizes whenever panels mount or unmount. Panels with a
  // defaultSize render at that size on the server, so a complete set of
  // defaults that adds up to 100 lays out without a shift on hydration.
  React.useEffect(() => {
    if (order.length === 0) return
    const stored = readStoredLayout(autoSaveId, order.length)
    let layout: number[]
    if (stored) {
      layout = stored
    } else {
      const defaults = order.map((id) => panels.current.get(id)?.defaultSize)
      const assigned = defaults.reduce<number>((sum, size) => sum + (size ?? 0), 0)
      const unassigned = defaults.filter((size) => size === undefined).length
      const share = unassigned > 0 ? Math.max(0, 100 - assigned) / unassigned : 0
      layout = defaults.map((size) => size ?? share)
    }
    const total = layout.reduce((sum, size) => sum + size, 0) || 1
    const next: Record<string, number> = {}
    order.forEach((id, index) => {
      next[id] = (layout[index] / total) * 100
    })
    commit(next, order)
  }, [order, autoSaveId, commit])

  const resizePair = React.useCallback(
    (beforeIndex: number, nextBeforeSize: number, base = sizesRef.current) => {
      const beforeId = order[beforeIndex]
      const afterId = order[beforeIndex + 1]
      const before = beforeId ? panels.current.get(beforeId) : undefined
      const after = afterId ? panels.current.get(afterId) : undefined
      if (!before || !after) return
      const total = (base[beforeId] ?? 0) + (base[afterId] ?? 0)
      let beforeSize = constrain(nextBeforeSize, before)
      let afterSize = constrain(total - beforeSize, after)
      beforeSize = total - afterSize
      // If the neighbor's limits pushed back, recheck the first panel.
      if (constrain(beforeSize, before) !== beforeSize) {
        beforeSize = base[beforeId] ?? beforeSize
        afterSize = total - beforeSize
      }
      if (
        Math.abs(beforeSize - (sizesRef.current[beforeId] ?? 0)) < 0.001 &&
        Math.abs(afterSize - (sizesRef.current[afterId] ?? 0)) < 0.001
      ) {
        return
      }
      commit({ ...sizesRef.current, [beforeId]: beforeSize, [afterId]: afterSize }, order)
    },
    [order, commit]
  )

  const resizePanel = React.useCallback(
    (id: string, size: number) => {
      const index = order.indexOf(id)
      if (index < 0) return
      if (index < order.length - 1) {
        resizePair(index, size)
      } else if (index > 0) {
        const total = (sizesRef.current[order[index - 1]] ?? 0) + (sizesRef.current[id] ?? 0)
        resizePair(index - 1, total - size)
      }
    },
    [order, resizePair]
  )

  const setDragging = React.useCallback(
    (dragging: boolean) => {
      draggingRef.current = dragging
      if (!dragging) {
        writeStoredLayout(
          autoSaveId,
          order.map((id) => round(sizesRef.current[id] ?? 0))
        )
      }
    },
    [autoSaveId, order]
  )

  return (
    <ResizableContext.Provider
      value={{
        orientation,
        order,
        sizes,
        panels,
        register,
        update,
        resizePair,
        resizePanel,
        setDragging,
      }}
    >
      <div
        data-slot="resizable-panel-group"
        data-orientation={orientation}
        className={cn(
          "flex size-full overflow-hidden",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  )
}

function sortByDocument(panels: Map<string, PanelEntry>) {
  return [...panels.entries()]
    .sort(([, a], [, b]) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    .map(([id]) => id)
}

type ResizablePanelHandle = {
  getSize: () => number
  resize: (size: number) => void
  collapse: () => void
  expand: () => void
  isCollapsed: () => boolean
}

type ResizablePanelProps = React.ComponentProps<"div"> & {
  /** Starting size in percent of the group. */
  defaultSize?: number
  minSize?: number
  maxSize?: number
  /** Lets the panel collapse below its minimum to `collapsedSize`. */
  collapsible?: boolean
  collapsedSize?: number
  onResize?: (size: number) => void
  onCollapse?: () => void
  onExpand?: () => void
  /** Receives an imperative handle for collapsing, expanding, and resizing. */
  panelRef?: React.Ref<ResizablePanelHandle>
}

function ResizablePanel({
  defaultSize,
  minSize = 0,
  maxSize = 100,
  collapsible = false,
  collapsedSize = 0,
  onResize,
  onCollapse,
  onExpand,
  panelRef,
  id: idProp,
  className,
  style,
  ...props
}: ResizablePanelProps) {
  const { register, update, sizes, resizePanel } = useResizableGroup()
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const [element, setElement] = React.useState<HTMLDivElement | null>(null)
  const size = sizes[id]
  const collapsed = collapsible && size !== undefined && size <= collapsedSize + 0.01
  const expandedSize = React.useRef<number | undefined>(undefined)

  const constraints = React.useMemo<PanelConstraints>(
    () => ({ defaultSize, minSize, maxSize, collapsible, collapsedSize }),
    [defaultSize, minSize, maxSize, collapsible, collapsedSize]
  )

  React.useEffect(() => {
    if (!element) return
    return register(id, { ...constraints, element })
    // Constraint changes are synced below without remounting the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element, id, register])

  React.useEffect(() => {
    if (element) update(id, { ...constraints, element })
  }, [constraints, element, id, update])

  // Remember the last open size so expand() returns to it.
  React.useEffect(() => {
    if (size !== undefined && !collapsed) expandedSize.current = size
  }, [size, collapsed])

  const previousSize = React.useRef(size)
  const previousCollapsed = React.useRef(collapsed)
  const callbacks = React.useRef({ onResize, onCollapse, onExpand })
  React.useEffect(() => {
    callbacks.current = { onResize, onCollapse, onExpand }
  })
  React.useEffect(() => {
    if (size === undefined) return
    if (previousSize.current !== undefined && previousSize.current !== size) {
      callbacks.current.onResize?.(round(size))
    }
    if (previousSize.current !== undefined && previousCollapsed.current !== collapsed) {
      if (collapsed) callbacks.current.onCollapse?.()
      else callbacks.current.onExpand?.()
    }
    previousSize.current = size
    previousCollapsed.current = collapsed
  }, [size, collapsed])

  React.useImperativeHandle(
    panelRef,
    () => ({
      getSize: () => round(size ?? defaultSize ?? 0),
      resize: (next: number) => resizePanel(id, next),
      collapse: () => {
        if (collapsible) resizePanel(id, collapsedSize)
      },
      expand: () => {
        if (collapsed) resizePanel(id, Math.max(minSize, expandedSize.current ?? minSize))
      },
      isCollapsed: () => collapsed,
    }),
    [size, defaultSize, resizePanel, id, collapsible, collapsedSize, collapsed, minSize]
  )

  // Before the group measures, the panel uses its defaultSize directly.
  const grow = size ?? defaultSize ?? 1

  return (
    <div
      ref={setElement}
      id={id}
      data-slot="resizable-panel"
      data-collapsed={collapsed ? "" : undefined}
      className={cn("min-h-0 min-w-0 overflow-hidden", className)}
      style={{ flexGrow: grow, flexShrink: 1, flexBasis: 0, ...style }}
      {...props}
    />
  )
}

type ResizableHandleProps = React.ComponentProps<"div"> & {
  /** Shows a grip pill centered on the divider. */
  withHandle?: boolean
  /** Percent moved per arrow key press. Shift moves twice as far. */
  keyboardStep?: number
  disabled?: boolean
}

function ResizableHandle({
  withHandle = false,
  keyboardStep = 5,
  disabled = false,
  className,
  onKeyDown,
  onPointerDown,
  "aria-label": ariaLabel,
  ...props
}: ResizableHandleProps) {
  const { orientation, order, sizes, panels, resizePair, resizePanel, setDragging } =
    useResizableGroup()
  const [element, setElement] = React.useState<HTMLDivElement | null>(null)
  const [dragging, setDraggingState] = React.useState(false)
  const horizontal = orientation === "horizontal"

  // The handle controls the pair of panels around it, found by DOM order.
  const beforeIndex = element
    ? order.filter((id) => {
        const panel = panels.current.get(id)?.element
        return panel ? Boolean(panel.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) : false
      }).length - 1
    : -1
  const beforeId = beforeIndex >= 0 ? order[beforeIndex] : undefined
  const afterId = order[beforeIndex + 1]
  const before = beforeId ? panels.current.get(beforeId) : undefined
  const after = afterId ? panels.current.get(afterId) : undefined
  const beforeSize = beforeId ? sizes[beforeId] : undefined

  const isRtl = () =>
    horizontal && element !== null && getComputedStyle(element).direction === "rtl"

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || disabled || !before || !after || beforeSize === undefined) return
    const step = keyboardStep * (event.shiftKey ? 2 : 1)
    const rtl = isRtl()
    const decreaseKey = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp"
    const increaseKey = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown"
    let target: number | undefined
    if (event.key === decreaseKey) target = beforeSize - step
    else if (event.key === increaseKey) target = beforeSize + step
    else if (event.key === "Home") target = before.collapsible ? before.collapsedSize : before.minSize
    else if (event.key === "End") target = before.maxSize
    else if (event.key === "Enter") {
      const panel = before.collapsible ? before : after.collapsible ? after : undefined
      const panelId = panel === before ? beforeId : afterId
      if (panel && panelId) {
        const current = sizes[panelId] ?? 0
        const isCollapsed = current <= panel.collapsedSize + 0.01
        resizePanel(panelId, isCollapsed ? Math.max(panel.minSize, panel.defaultSize ?? panel.minSize) : panel.collapsedSize)
        event.preventDefault()
      }
      return
    }
    if (target === undefined) return
    event.preventDefault()
    // A collapsible panel steps straight between collapsed and minimum.
    if (before.collapsible && event.key === decreaseKey && beforeSize <= before.minSize + 0.01) {
      target = before.collapsedSize
    } else if (before.collapsible && event.key === increaseKey && beforeSize < before.minSize) {
      target = before.minSize
    }
    resizePair(beforeIndex, target)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented || disabled || event.button !== 0 || !element) return
    const group = element.parentElement
    if (!group || beforeIndex < 0 || !afterId) return
    event.preventDefault()
    // preventDefault stops native focus, so focus by hand. focusVisible: false
    // keeps a mouse press from drawing the keyboard focus ring mid-drag.
    element.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    element.setPointerCapture(event.pointerId)

    const rect = group.getBoundingClientRect()
    const groupSize = horizontal ? rect.width : rect.height
    const start = horizontal ? event.clientX : event.clientY
    const base = { ...sizes }
    const startSize = base[order[beforeIndex]] ?? 0
    const direction = isRtl() ? -1 : 1

    // The cursor and selection lock apply to the whole page during a drag,
    // so it does not flicker or select text as the pointer leaves the handle.
    const body = document.body
    const previousCursor = body.style.cursor
    const previousSelect = body.style.userSelect
    body.style.cursor = horizontal ? "col-resize" : "row-resize"
    body.style.userSelect = "none"
    setDragging(true)
    setDraggingState(true)

    const move = (moveEvent: PointerEvent) => {
      const current = horizontal ? moveEvent.clientX : moveEvent.clientY
      const delta = ((current - start) / Math.max(1, groupSize)) * 100 * direction
      resizePair(beforeIndex, startSize + delta, base)
    }
    const end = () => {
      element.removeEventListener("pointermove", move)
      element.removeEventListener("pointerup", end)
      element.removeEventListener("pointercancel", end)
      body.style.cursor = previousCursor
      body.style.userSelect = previousSelect
      setDragging(false)
      setDraggingState(false)
    }
    element.addEventListener("pointermove", move)
    element.addEventListener("pointerup", end)
    element.addEventListener("pointercancel", end)
  }

  return (
    <div
      ref={setElement}
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-controls={beforeId}
      aria-valuenow={beforeSize === undefined ? undefined : Math.round(beforeSize)}
      aria-valuemin={before ? Math.round(before.collapsible ? before.collapsedSize : before.minSize) : undefined}
      aria-valuemax={before ? Math.round(before.maxSize) : undefined}
      aria-label={ariaLabel ?? "Resize panels"}
      aria-disabled={disabled || undefined}
      data-slot="resizable-handle"
      data-orientation={orientation}
      data-dragging={dragging ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      className={cn(
        // The visible divider is a hairline; an invisible ::after widens the
        // pointer target to 12px (24px for touch) without moving the layout.
        "relative z-1 flex shrink-0 touch-none items-center justify-center bg-[var(--hui-color-border-base-primary)] outline-none select-none motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),box-shadow_var(--hui-duration-fast)_var(--hui-ease-out)] after:absolute after:content-['']",
        horizontal
          ? "w-px cursor-col-resize after:inset-y-0 after:start-1/2 after:w-3 after:-translate-x-1/2 rtl:after:translate-x-1/2 pointer-coarse:after:w-6"
          : "h-px cursor-row-resize after:inset-x-0 after:top-1/2 after:h-3 after:-translate-y-1/2 pointer-coarse:after:h-6",
        // Hover and drag only darken the hairline: the cursor already says
        // the divider moves, so it needs no accent color. Keyboard focus keeps
        // the standard focus ring so it is visible without a pointer.
        "not-data-disabled:hover:bg-[var(--hui-color-foreground-base-tertiary)] data-dragging:bg-[var(--hui-color-foreground-base-tertiary)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)]",
        // The grip follows the same quiet hover and drag state.
        "not-data-disabled:hover:[&>[data-slot=resizable-handle-grip]]:border-[var(--hui-color-border-field-hover,var(--hui-color-border-base-focus))] data-dragging:[&>[data-slot=resizable-handle-grip]]:border-[var(--hui-color-border-field-hover,var(--hui-color-border-base-focus))]",
        "data-disabled:cursor-default forced-colors:bg-[CanvasText] forced-colors:focus-visible:bg-[Highlight]",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div
          aria-hidden="true"
          data-slot="resizable-handle-grip"
          className={cn(
            "z-1 flex items-center justify-center rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-secondary)] shadow-[var(--hui-shadow-feather)] [&_svg]:size-2.5",
            horizontal ? "h-6 w-3" : "h-3 w-6"
          )}
        >
          {horizontal ? <GripVerticalIcon /> : <GripHorizontalIcon />}
        </div>
      )}
    </div>
  )
}

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ResizablePanelHandle,
}
