"use client"

import * as React from "react"

import {
  ChevronDown as ChevronDownIcon,
  Funnel as FunnelIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import {
  Sheet,
  SheetFooter,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/registry/default/ui/sheet"
import { Toolbar } from "@/registry/default/ui/toolbar"

import type {
  FilterDateRangePreset,
  FilterDefinition,
  FilterOption,
  FilterRenderProps,
  FilterType,
  FilterValue,
} from "./filter-bar-types"
import {
  DEFAULT_FILTER_BAR_LABELS,
  cloneFilterValues,
  FilterBarControllerContext,
  useController,
  type FilterBarControllerValue,
  type FilterBarLabels,
  type FilterBarMode,
} from "./filter-bar-context"
import { renderFilterControl } from "./filter-bar-fields"
import {
  createFilterDefinitionMap,
  formatFilterValueText,
  getActiveFilterCount,
  isActiveFilterValue,
  isValuelessOperator,
  resolveDefaultOperator,
} from "./filter-bar-utils"

export type {
  FilterDateRangePreset,
  FilterDefinition,
  FilterOption,
  FilterRenderProps,
  FilterType,
  FilterValue,
}

function useNarrowViewport(maxWidthPx: number) {
  const subscribe = React.useCallback(
    (onMediaChange: () => void) => {
      const mediaQueryList = window.matchMedia(
        `(max-width: ${maxWidthPx - 1}px)`
      )

      mediaQueryList.addEventListener("change", onMediaChange)

      return () =>
        mediaQueryList.removeEventListener("change", onMediaChange)
    },
    [maxWidthPx]
  )

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`).matches,
    () => false
  )
}

export interface FilterBarProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** Every filter the application offers. */
  filters: FilterDefinition[]
  /** Committed filters owned by your application. */
  value?: FilterValue[] | undefined
  /** Initial filters when uncontrolled. */
  defaultValue?: FilterValue[] | undefined
  onValueChange?: ((values: FilterValue[]) => void) | undefined
  /** instant commits each change; apply holds work behind an Apply press. */
  mode?: FilterBarMode
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Shows every chip or collapses overflow into one "+N" control. */
  valuesDisplay?: "collapse" | "wrap"
  /** Option lists grow a search input past this many entries. */
  searchableThreshold?: number
  /** Renders result counts supplied on filter options. */
  showOptionCounts?: boolean
  /** Panels become a Sheet below this viewport width. */
  mobileBreakpoint?: number
  popoverAlign?: "start" | "center" | "end"
  disabled?: boolean
  /** Overrides English strings listed under Labels in the docs. */
  labels?: Partial<FilterBarLabels>
  /**
   * Composed arrangement of FilterBar* parts for custom layouts such as a
   * pinned side rail. Omit for the complete default bar plus panel.
   */
  children?: React.ReactNode
}

/**
 * One consistent way to add, view, edit, and clear filters above Data Table,
 * Kanban lists, search results, admin pages, or any collection. The bar owns
 * filter UI and values; applications own querying and interpretation.
 */
export function FilterBar({
  filters,
  value,
  defaultValue,
  onValueChange,
  mode = "instant",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  valuesDisplay = "collapse",
  searchableThreshold = 10,
  showOptionCounts = true,
  mobileBreakpoint = 640,
  popoverAlign = "start",
  disabled = false,
  labels: labelOverrides,
  className,
  children,
  ...rootProps
}: FilterBarProps) {
  if (
    process.env.NODE_ENV !== "production" &&
    (!filters || filters.length === 0)
  ) {
    console.warn(
      "FilterBar received no filter definitions; nothing useful opens. Unmount FilterBar until definitions exist."
    )
  }

  const definitionMap = React.useMemo(
    () => createFilterDefinitionMap(filters ?? []),
    [filters]
  )

  const [internalCommitted, setInternalCommitted] =
    React.useState<FilterValue[]>(defaultValue ?? [])
  const isControlled = value !== undefined

  const resolvedLabels = React.useMemo<FilterBarLabels>(
    () => ({ ...DEFAULT_FILTER_BAR_LABELS, ...labelOverrides }),
    [labelOverrides]
  )

  const sourceCommitted = isControlled ? value : internalCommitted
  const committed = React.useMemo(
    () =>
      sourceCommitted?.filter((entry) =>
        isActiveFilterValue(definitionMap.get(entry.key), entry)
      ) ?? [],
    [sourceCommitted, definitionMap]
  )

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = openProp !== undefined ? openProp : internalOpen

  // Drafts exist only between opening and resolving in apply mode. Declared
  // before the callbacks so they close over live state instead of refs.
  const [draft, setDraft] = React.useState<FilterValue[]>([])
  const hasDraft = mode === "apply" && open
  const editing = hasDraft ? draft : committed

  function baseSetOpen(next: boolean) {
    if (openProp === undefined) {
      setInternalOpen(next)
    }

    onOpenChange?.(next)
  }

  /**
   * Every closing path discards unfinished draft work; Apply is the only
   * writer while a draft exists, so outside clicks and Escape behave like
   * Cancel exactly as documented.
   */
  function setOpen(next: boolean) {
    if (mode === "apply") {
      setDraft(next ? cloneFilterValues(committed) : [])
    }

    baseSetOpen(next)
  }

  const focusGroups = React.useRef(new Map<string, HTMLElement>())
  const pendingFocusKey = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    if (!open || !pendingFocusKey.current) return

    const focusKey = pendingFocusKey.current
    pendingFocusKey.current = undefined

    window.requestAnimationFrame(() => {
      const target = focusGroups.current.get(focusKey)

      target?.scrollIntoView({ block: "nearest", inline: "nearest" })
      target?.focus({ preventScroll: true })
    })
  }, [open])

  function registerFocusGroup(key: string, element: HTMLElement | null) {
    if (element) {
      focusGroups.current.set(key, element)
    } else {
      focusGroups.current.delete(key)
    }
  }

  /**
   * Field writes land on the draft while one exists and commit straight to
   * the application otherwise, which is what instant mode should do.
   */
  function writeEditing(
    next:
      | FilterValue[]
      | ((current: FilterValue[]) => FilterValue[])
  ) {
    if (disabled) return

    const resolved =
      typeof next === "function" ? next(hasDraft ? draft : committed) : next

    if (hasDraft) {
      setDraft(resolved)
      return
    }

    if (!isControlled) setInternalCommitted(resolved)
    onValueChange?.(resolved)
  }

  function setEntry(key: string, nextValue: unknown, nextOperator?: string) {
    const definition = definitionMap.get(key)

    if (!definition || definition.disabled || disabled) return

    const current = hasDraft ? draft : committed
    const existing = current.find((entry) => entry.key === key)
    const operator =
      nextOperator ?? existing?.operator ?? resolveDefaultOperator(definition)
    const cleaned = current.filter((entry) => entry.key !== key)

    const isEmptyWrite =
      !isValuelessOperator(operator) &&
      (nextValue == null ||
        (typeof nextValue === "string" && nextValue.trim() === "") ||
        (Array.isArray(nextValue) && nextValue.length === 0))

    const value = isValuelessOperator(operator) ? undefined : nextValue

    writeEditing(
      isEmptyWrite ? cleaned : [...cleaned, { key, operator, value }]
    )
  }

  function setEntryOperator(key: string, nextOperator: string) {
    if (definitionMap.get(key)?.disabled) return

    writeEditing((current) =>
      current.map((entry) =>
        entry.key === key ? { ...entry, operator: nextOperator } : entry
      )
    )
  }

  function removeEditingEntry(key: string) {
    if (definitionMap.get(key)?.disabled) return

    writeEditing((current) => current.filter((entry) => entry.key !== key))
  }

  function clearEditingEntries() {
    writeEditing([])
  }

  function commitDirect(next: FilterValue[]) {
    if (disabled) return

    if (!isControlled) setInternalCommitted(next)
    onValueChange?.(next)
  }

  function removeCommittedKey(key: string) {
    commitDirect(committed.filter((entry) => entry.key !== key))
  }

  function clearAllCommitted() {
    commitDirect([])
  }

  function applyDraftPress() {
    const pruned = draft.filter((entry) =>
      isActiveFilterValue(definitionMap.get(entry.key), entry)
    )

    commitDirect(pruned)
    baseSetOpen(false)
    setDraft([])
  }

  function cancelDraftPress() {
    baseSetOpen(false)
  }

  const activeCount = getActiveFilterCount(committed, filters ?? [])

  const controller: FilterBarControllerValue = {
    mode,
    orderedDefinitions: definitionMap.ordered(),
    definitionOf: definitionMap.get,
    committed,
    editing,
    hasDraft,
    open,
    activeCount,
    activeEntries: committed,
    labels: resolvedLabels,
    searchThreshold: searchableThreshold,
    showOptionCounts,
    valuesDisplay,
    disabled,
    openPanel: (options: { focusKey?: string } = {}) => {
      if (disabled) return

      const { focusKey } = options
      pendingFocusKey.current = focusKey
      setOpen(true)
    },
    closePanel: () => baseSetOpen(false),
    applyDraft: applyDraftPress,
    cancelDraft: cancelDraftPress,
    setEntry,
    setEntryOperator,
    removeEditing: removeEditingEntry,
    clearEditing: clearEditingEntries,
    removeCommitted: removeCommittedKey,
    clearCommitted: clearAllCommitted,
    registerFocusGroup,
  }

  return (
    <FilterBarControllerContext.Provider value={controller}>
      <div
        {...rootProps}
        data-slot="filter-bar-root"
        data-mode={mode}
        className={cn("flex w-full min-w-0 items-center", className)}
      >
        {children ?? (
          <FilterBarDefaultSurface
            mobileBreakpoint={mobileBreakpoint}
            popoverAlign={popoverAlign}
          />
        )}
      </div>
    </FilterBarControllerContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Default arrangement                                                 */
/* ------------------------------------------------------------------ */

/** Trigger, chips, Clear all, then a panel anchored to the trigger. */
function FilterBarDefaultSurface({
  mobileBreakpoint,
  popoverAlign,
}: {
  mobileBreakpoint: number
  popoverAlign: "start" | "center" | "end"
}) {
  const isNarrow = useNarrowViewport(mobileBreakpoint)
  const controller = useController("FilterBar")
  const panelColumnCount = Math.min(
    Math.max(controller.orderedDefinitions.length, 1),
    2
  )
  const defaultPanelMaxWidth = `${4 + panelColumnCount * 20}rem`
  const chipsRow = (
    <>
      <FilterBarChipsRow />
      <FilterBarClearAction />
    </>
  )

  // Base UI triggers attach their ref and click behavior to whatever element
  // they render, so the trigger must be a real Button, not a wrapper that
  // swallows props.
  const triggerElement = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={controller.disabled}
      data-slot="filter-bar-trigger"
      data-open={controller.open || undefined}
      aria-label={
        controller.activeCount > 0
          ? `${controller.labels.trigger}, ${controller.labels.triggerActiveSuffix(controller.activeCount)}`
          : controller.labels.trigger
      }
      // Keeps surrounding controls still when the count badge appears.
      style={{ minWidth: "var(--fb-trigger-min-width, 5.25rem)" }}
    >
      <FunnelIcon aria-hidden />
      <span>{controller.labels.trigger}</span>
      {controller.activeCount > 0 ? (
        <Badge size="sm" variant="secondary" className="tabular-nums">
          {controller.activeCount}
        </Badge>
      ) : null}
      <ChevronDownIcon
        aria-hidden
        data-open={controller.open || undefined}
        className="[transition:transform_var(--hui-duration-fast)_var(--hui-ease-out)] data-open:-rotate-180 motion-reduce:[transition:none]"
      />
    </Button>
  )

  return (
    <div className="flex w-full min-w-0 items-center gap-(--hui-space-3)">
      {isNarrow ? (
        <Sheet
          open={controller.open}
          onOpenChange={(next) =>
            next ? controller.openPanel() : controller.closePanel()
          }
        >
          <SheetTrigger render={triggerElement} />
          <SheetPopup
            side="bottom"
            className="flex max-h-[85svh]! w-full! max-w-none! flex-col p-0!"
          >
            <FilterBarPanelBody variant="sheet" />
          </SheetPopup>
          {chipsRow}
        </Sheet>
      ) : (
        <>
          <Popover
            open={controller.open}
            onOpenChange={(next) =>
              next ? controller.openPanel() : controller.closePanel()
            }
          >
            <PopoverTrigger render={triggerElement} />
            <PopoverPopup
              side="bottom"
              align={popoverAlign}
              style={
                {
                  "--fb-panel-default-max": defaultPanelMaxWidth,
                } as React.CSSProperties
              }
              className="max-h-[min(38rem,var(--available-height))]! w-[min(var(--fb-panel-max,var(--fb-panel-default-max)),calc(100vw-2rem))]! max-w-none! p-0!"
            >
              <FilterBarPanelBody variant="popover" />
            </PopoverPopup>
          </Popover>
          {chipsRow}
        </>
      )}
    </div>
  )
}

/** The removable record of everything currently filtering the view. */

const CHIP_ROW_GAP_PX = 8
const OVERFLOW_INDICATOR_CLASS =
  "shrink-0 rounded-[var(--hui-radius-full)] px-(--hui-space-2) py-(--hui-space-1) text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)]"

/**
 * Shows one chip per active filter, trimmed with its human-readable value.
 * In collapse mode a pre-paint measurement keeps the row stable, then hides
 * whatever does not fit behind a single "+N" control.
 */
function FilterBarChipsRow({ className }: { className?: string }) {
  const {
    activeEntries,
    orderedDefinitions,
    definitionOf,
    valuesDisplay,
    labels,
  } = useController("FilterBarChipsRow")
  const containerRef = React.useRef<HTMLDivElement>(null)
  // null means every chip fits or the first pre-paint measure has not run.
  const [fitCount, setFitCount] = React.useState<number | null>(null)

  const orderedChips = React.useMemo(() => {
    const byPriority = orderedDefinitions.flatMap((definition) => {
      const matching = activeEntries.find((entry) => entry.key === definition.key)

      return matching ? [{ entry: matching, definition }] : []
    })
    const withoutDefinitions = activeEntries
      .filter((entry) => !definitionOf(entry.key))
      .map((entry) => ({
        entry,
        definition: {
          key: entry.key,
          label: entry.key,
          type: "custom" as FilterType,
        },
      }))

    return [...byPriority, ...withoutDefinitions]
  }, [activeEntries, orderedDefinitions, definitionOf])

  const isWrap = valuesDisplay === "wrap"

  React.useLayoutEffect(() => {
    const container = containerRef.current

    if (!container || isWrap || typeof ResizeObserver === "undefined") return

    let frame = requestAnimationFrame(measure)

    function measure() {
      if (!container) return

      const limit = container.clientWidth
      const chipSlots = Array.from(container.children).filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.dataset.chipSlot != null
      )
      const totalChipWidth = chipSlots.reduce(
        (width, slot, index) =>
          width + slot.getBoundingClientRect().width + (index === 0 ? 0 : CHIP_ROW_GAP_PX),
        0
      )

      if (totalChipWidth <= limit) {
        setFitCount(null)
        return
      }

      const overflowMeasure = container.querySelector<HTMLElement>(
        "[data-overflow-measure]"
      )
      const chipLimit = Math.max(
        0,
        limit -
          (overflowMeasure?.getBoundingClientRect().width ?? 0) -
          CHIP_ROW_GAP_PX
      )
      let usedWidth = 0
      let visible = 0

      for (const slot of chipSlots) {
        const slotWidth = slot.getBoundingClientRect().width
        const gap = visible === 0 ? 0 : CHIP_ROW_GAP_PX

        if (usedWidth + gap + slotWidth > chipLimit) break

        usedWidth += gap + slotWidth
        visible += 1
      }

      setFitCount(visible)
    }

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [isWrap, orderedChips, labels])

  if (orderedChips.length === 0) {
    return (
      <div
        ref={containerRef}
        data-slot="filter-bar-values"
        className={cn("min-w-0 flex-1", className)}
      />
    )
  }

  const collapsed = !isWrap && fitCount != null
  const visibleChipCount = collapsed ? fitCount : orderedChips.length
  const hiddenCount = orderedChips.length - visibleChipCount

  return (
    <div
      ref={containerRef}
      data-slot="filter-bar-values"
      role="list"
      aria-label="Active filters"
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-(--hui-space-2)",
        collapsed ? "flex-nowrap overflow-hidden" : "flex-wrap",
        className
      )}
    >
      {orderedChips.map(({ entry, definition }, index) => {
        const isChipHidden = collapsed && index >= visibleChipCount

        return (
          <div
            key={entry.key}
            data-chip-slot
            data-slot="filter-bar-value"
            role="listitem"
            aria-hidden={isChipHidden || undefined}
            className={cn(
              isChipHidden &&
                "pointer-events-none absolute top-0 left-0 invisible"
            )}
          >
            <FilterBarChip entry={entry} definition={definition} />
          </div>
        )
      })}
      {!isWrap ? (
        <span
          aria-hidden="true"
          data-overflow-measure
          className={cn(
            OVERFLOW_INDICATOR_CLASS,
            "pointer-events-none absolute top-0 left-0 invisible"
          )}
        >
          {labels.moreCount(orderedChips.length)}
        </span>
      ) : null}
      {hiddenCount > 0 ? (
        <OverflowIndicator hiddenCount={hiddenCount} />
      ) : null}
    </div>
  )
}

function OverflowIndicator({ hiddenCount }: { hiddenCount: number }) {
  const { labels, openPanel, disabled } = useController("OverflowIndicator")

  return (
    <div role="listitem" className="shrink-0">
      <button
        type="button"
        data-slot="filter-bar-more-values"
        className={cn(
          OVERFLOW_INDICATOR_CLASS,
          "min-h-6 min-w-6 cursor-pointer outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] disabled:cursor-not-allowed"
        )}
        onClick={() => openPanel()}
        disabled={disabled}
      >
        {labels.moreCount(hiddenCount)}
      </button>
    </div>
  )
}

/**
 * One active filter: label plus readable value, opening its group again on
 * click, removing it straight away through the cross control.
 */
export function FilterBarChip({
  entry,
  definition,
}: {
  entry: FilterValue
  definition: FilterDefinition
}) {
  const { openPanel, removeCommitted, disabled, labels } =
    useController("FilterBarChip")
  const valueText = formatFilterValueText(definition, entry)
  const isDisabled = disabled || Boolean(definition.disabled)

  return (
    <div
      data-slot="filter-bar-chip"
      title={`${definition.label}${valueText ? `: ${valueText}` : ""}`}
      className={cn(
        "inline-flex h-(--hui-space-7) min-w-0 max-w-[16rem] items-center gap-(--hui-space-1) rounded-[var(--hui-radius-full)] bg-[var(--hui-color-background-neutral-secondary)] pl-(--hui-space-3) pr-(--hui-space-1)",
        "[font-size:var(--hui-font-size-mini)] [line-height:var(--hui-line-height-mini)] text-[var(--hui-color-foreground-base-primary)]",
        isDisabled && "opacity-64"
      )}
    >
      <button
        type="button"
        data-slot="filter-bar-chip-open"
        className="h-full min-w-6 cursor-pointer truncate bg-transparent text-left outline-none focus-visible:[outline:var(--hui-focus-ring)] disabled:cursor-not-allowed"
        onClick={() => openPanel({ focusKey: definition.key })}
        disabled={isDisabled}
      >
        {definition.label}
        {valueText ? (
          <span className="text-[var(--hui-color-foreground-base-secondary)]">
            {" "}
            {valueText}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        data-slot="filter-bar-chip-remove"
        aria-label={labels.removeFilter(definition.label)}
        className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--hui-radius-full)] text-[var(--hui-color-foreground-base-secondary)] outline-none hover:bg-[var(--hui-color-background-neutral-tertiary)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)] disabled:pointer-events-none"
        onClick={(event) => {
          event.stopPropagation()

          const currentSlot = event.currentTarget.closest<HTMLElement>(
            '[data-slot="filter-bar-value"]'
          )
          const values = event.currentTarget.closest<HTMLElement>(
            '[data-slot="filter-bar-values"]'
          )
          const slots = values
            ? Array.from(
                values.querySelectorAll<HTMLElement>(
                  '[data-slot="filter-bar-value"]'
                )
              )
            : []
          const currentIndex = currentSlot ? slots.indexOf(currentSlot) : -1
          const adjacentSlot =
            slots[currentIndex + 1] ?? slots[currentIndex - 1]
          const adjacentButton = adjacentSlot?.querySelector<HTMLButtonElement>(
            '[data-slot="filter-bar-chip-open"]'
          )
          const trigger = event.currentTarget
            .closest<HTMLElement>('[data-slot="filter-bar-root"]')
            ?.querySelector<HTMLButtonElement>('[data-slot="filter-bar-trigger"]')

          removeCommitted(entry.key)

          window.requestAnimationFrame(() => {
            if (adjacentButton?.isConnected) {
              adjacentButton.focus()
              return
            }

            trigger?.focus()
          })
        }}
        disabled={isDisabled}
      >
        <CloseIcon aria-hidden className="size-3" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Composable parts                                                    */
/* ------------------------------------------------------------------ */

/** Standalone chip list for custom toolbar arrangements. */
export function FilterBarValues({ className }: { className?: string }) {
  return <FilterBarChipsRow className={className} />
}

/** One committed filter rendered with the shared chip presentation. */
export function FilterBarValue({ filterKey }: { filterKey: string }) {
  const { committed, definitionOf } = useController("FilterBarValue")
  const definition = definitionOf(filterKey)
  const entry = committed.find((item) => item.key === filterKey)

  if (!definition || !entry) return null

  return <FilterBarChip entry={entry} definition={definition} />
}

/** Action row for apply mode; defaults to Cancel plus Apply filters. */
export function FilterBarFooter({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <footer
      data-slot="filter-bar-footer"
      className={cn("px-(--hui-space-4) py-(--hui-space-3)", className)}
    >
      {children ?? (
        <Toolbar className="justify-end gap-(--hui-space-2)">
          <FilterBarCancel />
          <FilterBarApply />
        </Toolbar>
      )}
    </footer>
  )
}

export function FilterBarClear() {
  return <FilterBarClearAction />
}

function FilterBarClearAction() {
  const { activeCount, clearCommitted, labels, disabled } =
    useController("FilterBarClear")

  // Nothing to clear means nothing to show; never render a dead action.
  if (activeCount === 0) return null

  return (
    <Button
      variant="link"
      size="sm"
      className="ml-auto shrink-0 text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]"
      onClick={(event) => {
        const trigger = event.currentTarget
          .closest<HTMLElement>('[data-slot="filter-bar-root"]')
          ?.querySelector<HTMLButtonElement>('[data-slot="filter-bar-trigger"]')

        clearCommitted()
        window.requestAnimationFrame(() => trigger?.focus())
      }}
      disabled={disabled}
      data-slot="filter-bar-clear-all"
    >
      {labels.clearAll}
    </Button>
  )
}

export function FilterBarToolbar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <Toolbar className={className} data-slot="filter-bar-toolbar">
      {children}
    </Toolbar>
  )
}

/**
 * Toggles the Filter Bar panel from anywhere inside a FilterBar. The default
 * surface wires this automatically; composed layouts embed it wherever their
 * design needs it.
 */
export function FilterBarTrigger(props: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">) {
  const { open, openPanel, closePanel, labels, activeCount, disabled } =
    useController("FilterBarTrigger")

  return (
    <FilterBarTriggerCore
      {...props}
      isOpen={open}
      onToggle={() => (open ? closePanel() : openPanel())}
      labels={labels}
      activeCount={activeCount}
      disabled={disabled || props.disabled}
    />
  )
}

interface TriggerCoreProps extends Omit<React.ComponentProps<typeof Button>, "children"> {
  isOpen: boolean
  onToggle: () => void
  labels: FilterBarLabels
  activeCount: number
}

function FilterBarTriggerCore({
  isOpen,
  onToggle,
  labels,
  activeCount,
  ...props
}: TriggerCoreProps) {
  return (
    <Button
      type="button"
      {...props}
      variant="outline"
      size="sm"
      data-open={isOpen || undefined}
      aria-expanded={isOpen}
      aria-label={
        activeCount > 0
          ? `${labels.trigger}, ${labels.triggerActiveSuffix(activeCount)}`
          : labels.trigger
      }
      onClick={onToggle}
      data-slot="filter-bar-trigger"
    >
      <FunnelIcon aria-hidden />
      <span>{labels.trigger}</span>
      {activeCount > 0 ? (
        <Badge size="sm" variant="secondary" className="tabular-nums">
          {activeCount}
        </Badge>
      ) : null}
      <ChevronDownIcon
        aria-hidden
        data-open={isOpen || undefined}
        className="[transition:transform_var(--hui-duration-fast)_var(--hui-ease-out)] data-open:-rotate-180 motion-reduce:[transition:none]"
      />
    </Button>
  )
}

/**
 * Presentational panel card for pinned layouts. The default FilterBar owns
 * the floating Popover and Sheet; this part shares their inner structure.
 */
export function FilterBarContent({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section
      data-slot="filter-bar-content"
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-soft)]",
        className
      )}
    >
      {children ?? (
        <>
          <FilterBarHeader />
          <Separator />
          <ScrollArea className="max-h-[24rem] min-h-0">
            <FilterBarGroups />
          </ScrollArea>
        </>
      )}
    </section>
  )
}

export function FilterBarHeader({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { labels } = useController("FilterBarHeader")

  return (
    <header
      className={cn(
        "flex items-start justify-between gap-(--hui-space-4) px-(--hui-space-5) pt-(--hui-space-4) pb-(--hui-space-3)",
        className
      )}
      data-slot="filter-bar-header"
    >
      {children ?? <FilterBarTitle>{labels.title}</FilterBarTitle>}
      <DraftClearAction />
    </header>
  )
}

function DraftClearAction() {
  const { hasDraft, editing, clearEditing, labels, disabled } =
    useController("DraftClearAction")

  // Instant mode holds nothing back, so clearing a draft would lie about state.
  if (!hasDraft || editing.length === 0) return null

  return (
    <Button
      variant="link"
      size="sm"
      disabled={disabled}
      onClick={() => clearEditing()}
      data-slot="filter-bar-clear-draft"
    >
      {labels.clearPanel}
    </Button>
  )
}

export function FilterBarTitle(props: React.ComponentProps<"h2">) {
  const { labels } = useController("FilterBarTitle")

  return (
    <h2
      tabIndex={-1}
      data-slot="filter-bar-title"
      className="m-0! text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)]! [font-weight:var(--hui-font-weight-medium)]! [line-height:var(--hui-line-height-large)]! outline-none"
      {...props}
    >
      {props.children ?? labels.title}
    </h2>
  )
}

export function FilterBarGroups({ className }: { className?: string }) {
  const { orderedDefinitions } = useController("FilterBarGroups")

  return (
    <div
      className={cn(
        "grid items-start grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-x-(--hui-space-5) gap-y-(--hui-space-6)",
        className
      )}
      data-slot="filter-bar-groups"
    >
      {orderedDefinitions.map((definition) => (
        <FilterBarGroupSection key={definition.key} definition={definition} />
      ))}
    </div>
  )
}

/** Renders exactly one filter's controls inside the shared group chrome. */
export function FilterBarGroup({ filterKey }: { filterKey: string }) {
  const { definitionOf } = useController("FilterBarGroup")
  const definition = definitionOf(filterKey)

  if (!definition) return null

  return <FilterBarGroupSection definition={definition} />
}

function countSelectedOptions(
  definition: FilterDefinition,
  entry: FilterValue | undefined
) {
  if (definition.type !== "multi-select" || !Array.isArray(entry?.value)) {
    return 0
  }

  return entry.value.length
}

function FilterBarGroupSection({
  definition,
}: {
  definition: FilterDefinition
}) {
  const { editing, registerFocusGroup, disabled } =
    useController("FilterBarGroupSection")
  const entry = editing.find((item) => item.key === definition.key)
  const selectedOptionCount = countSelectedOptions(definition, entry)
  const sectionRef = React.useCallback(
    (node: HTMLElement | null) => {
      registerFocusGroup(definition.key, node)
    },
    [registerFocusGroup, definition.key]
  )

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      data-slot="filter-bar-group"
      data-filter-key={definition.key}
      data-filter-type={definition.type}
      data-disabled={definition.disabled || disabled || undefined}
      className="flex min-w-0 flex-col gap-y-(--hui-space-2) outline-none"
    >
      <div
        className="flex items-baseline justify-between gap-(--hui-space-2)"
        data-slot="filter-bar-group-heading"
      >
        <span className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] uppercase tracking-wide">
          {definition.label}
        </span>
        <span
          className="tabular-nums text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-mini)]"
          data-slot="filter-bar-group-count"
        >
          {selectedOptionCount > 0 ? selectedOptionCount : ""}
        </span>
      </div>
      {renderFilterControl(definition, entry)}
    </section>
  )
}

export function FilterBarGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      data-slot="filter-bar-group-label"
      className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)] uppercase tracking-wide"
    >
      {children}
    </span>
  )
}

/** Commits the draft, reports it upward, and closes the panel. */
export function FilterBarApply(props: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const { applyDraft, labels, disabled } = useController("FilterBarApply")

  return (
    <Button
      type="button"
      {...props}
      disabled={disabled || props.disabled}
      onClick={() => applyDraft()}
      data-slot="filter-bar-apply"
    >
      {props.children ?? labels.apply}
    </Button>
  )
}

/** Throws away draft changes and closes the panel. */
export function FilterBarCancel(props: Omit<React.ComponentProps<typeof Button>, "onClick" | "variant">) {
  const { cancelDraft, labels } = useController("FilterBarCancel")

  return (
    <Button
      type="button"
      {...props}
      variant="ghost"
      onClick={() => cancelDraft()}
      data-slot="filter-bar-cancel"
    >
      {props.children ?? labels.cancel}
    </Button>
  )
}

/* ------------------------------------------------------------------ */
/* Panel body shared by popover and sheet                              */
/* ------------------------------------------------------------------ */

function FilterBarPanelBody({ variant }: { variant: "popover" | "sheet" }) {
  const { mode, labels } = useController("FilterBarPanelBody")
  const isSheet = variant === "sheet"

  return (
    <div className="flex max-h-[inherit] flex-col" data-slot="filter-bar-panel">
      <FilterBarHeader className={cn(isSheet && "pt-(--hui-space-5)")} />
      {isSheet ? <SheetTitle className="sr-only">{labels.title}</SheetTitle> : null}
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-(--hui-space-5) py-(--hui-space-5)">
          <FilterBarGroups />
        </div>
      </ScrollArea>
      {mode === "apply" ? (
        <>
          <Separator />
          {isSheet ? (
            <SheetFooter className="justify-end pt-(--hui-space-2)">
              <Toolbar className="justify-end gap-(--hui-space-2)">
                <FilterBarCancel />
                <FilterBarApply />
              </Toolbar>
            </SheetFooter>
          ) : (
            <FilterBarFooter />
          )}
        </>
      ) : null}
    </div>
  )
}
