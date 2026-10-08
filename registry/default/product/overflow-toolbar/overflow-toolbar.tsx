"use client"

import * as React from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/registry/default/ui/toolbar"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/registry/default/ui/tooltip"

import type {
  OverflowMenuSection,
  OverflowPriority,
  OverflowToolbarItemStore,
} from "./overflow-toolbar-types"
import {
  createOverflowToolbarItemStore,
  defaultOverflowPriority,
  getCollapseOrder,
  getOverflowMenuSections,
  initialOverflowFitState,
  stepOverflowFit,
} from "./overflow-toolbar-utils"

export type { OverflowPriority } from "./overflow-toolbar-types"

const itemAttribute = "data-overflow-toolbar-item"
const moreAttribute = "data-overflow-toolbar-more"

const toolbarNavigationKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"])

/** Toolbar strips borders from its direct children only; these can sit one level down. */
const controlClassName =
  "border-0 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:active:scale-100!"

type OverflowToolbarContextValue = {
  store: OverflowToolbarItemStore
  collapsedIds: ReadonlySet<string>
  menuSections: readonly OverflowMenuSection[]
  /** Called while a More button is mounted. Without one, nothing collapses. */
  registerMore: () => () => void
  setMenuOpen: (isOpen: boolean) => void
}

const OverflowToolbarContext = React.createContext<OverflowToolbarContextValue | null>(null)

function useOverflowToolbar(part: string) {
  const context = React.useContext(OverflowToolbarContext)
  if (!context) throw new Error(`${part} must be used inside OverflowToolbar.`)
  return context
}

const OverflowToolbarGroupContext = React.createContext<{ id: string; label: string } | null>(null)

/* -------------------------------------------------------------------------- */
/* Focus                                                                      */
/* -------------------------------------------------------------------------- */

type FocusOrigin = { kind: "item"; id: string } | { kind: "more" }

function findItemControl(root: HTMLElement, id: string) {
  return root.querySelector<HTMLElement>(`[${itemAttribute}="${CSS.escape(id)}"]:not([hidden])`)
}

/** Which of the toolbar's own controls has focus, if any. */
function readFocusOrigin(root: HTMLElement): FocusOrigin | null {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || !root.contains(active)) return null
  if (active.hasAttribute(moreAttribute)) return { kind: "more" }

  const id = active.getAttribute(itemAttribute)
  return id === null ? null : { kind: "item", id }
}

/**
 * Moving an action removes the control that showed it. If that control had
 * focus, the browser drops focus to the page; put it on the control that now
 * stands for the action instead.
 */
function repairFocus(root: HTMLElement, origin: FocusOrigin, lastRestoredId: string | undefined) {
  const active = document.activeElement
  if (active !== null && active !== document.body) return

  const more = root.querySelector<HTMLElement>(`[${moreAttribute}]`)
  const target =
    origin.kind === "item"
      ? (findItemControl(root, origin.id) ?? more)
      : (more ?? (lastRestoredId === undefined ? null : findItemControl(root, lastRestoredId)))

  target?.focus()
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export type OverflowToolbarProps = Omit<
  React.ComponentProps<typeof Toolbar>,
  "orientation" | "ref"
>

/**
 * A horizontal toolbar that fills its container and moves actions into the
 * More menu when they stop fitting. It measures its own box, so it follows a
 * sidebar opening or a panel resizing as well as the window.
 */
function OverflowToolbar({ className, children, ...props }: OverflowToolbarProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [store] = React.useState(createOverflowToolbarItemStore)
  const items = React.useSyncExternalStore(store.subscribe, store.getItems, store.getItems)
  const [hasMore, setHasMore] = React.useState(false)
  const [collapsedCount, setCollapsedCount] = React.useState(0)

  const collapseOrder = React.useMemo(() => getCollapseOrder(items), [items])
  const collapsibleCount = hasMore ? collapseOrder.length : 0
  const collapsedIds = React.useMemo(
    () => new Set(collapseOrder.slice(0, Math.min(collapsedCount, collapsibleCount))),
    [collapseOrder, collapsedCount, collapsibleCount]
  )
  const menuSections = React.useMemo(
    () => getOverflowMenuSections(items, collapsedIds),
    [items, collapsedIds]
  )

  const fitState = React.useRef(initialOverflowFitState)
  /** What the DOM currently shows; a step is only valid for the layout it measured. */
  const rendered = React.useRef({ collapsedCount, collapsibleCount, collapseOrder })
  const isMenuOpen = React.useRef(false)
  const focusOrigin = React.useRef<FocusOrigin | null>(null)

  const fit = React.useCallback(() => {
    const root = rootRef.current
    const current = fitState.current
    if (!root || current.collapsedCount !== rendered.current.collapsedCount) return

    const next = stepOverflowFit(current, {
      width: root.clientWidth,
      overflows: root.scrollWidth > root.clientWidth,
      collapsibleCount: rendered.current.collapsibleCount,
      canRestore: !isMenuOpen.current,
    })
    fitState.current = next

    if (next.collapsedCount === current.collapsedCount) {
      focusOrigin.current = null
      return
    }

    focusOrigin.current ??= readFocusOrigin(root)
    setCollapsedCount(next.collapsedCount)
  }, [])

  const forgetFailedCount = React.useCallback(() => {
    fitState.current = { ...fitState.current, failedCount: null }
  }, [])

  const observation = React.useRef<{ observer: ResizeObserver; targets: Set<Element> } | null>(
    null
  )

  React.useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return

    const widths = new WeakMap<Element, number>()
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.target.getBoundingClientRect().width
        const previous = widths.get(entry.target)
        widths.set(entry.target, width)
        // An action changed size, so a count that overflowed before may fit now.
        if (previous !== undefined && previous !== width && entry.target !== rootRef.current) {
          forgetFailedCount()
        }
      }
      // Render before the browser paints, so no frame shows the toolbar clipped.
      flushSync(fit)
    })
    observation.current = { observer, targets: new Set() }

    return () => {
      observer.disconnect()
      observation.current = null
    }
  }, [fit, forgetFailedCount])

  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const itemElements = Array.from(root.querySelectorAll<HTMLElement>(`[${itemAttribute}]`))
    store.reorder(itemElements.map((element) => element.getAttribute(itemAttribute) ?? ""))

    // The root reports the space it has; each action reports its own size.
    if (observation.current) {
      const { observer, targets: previousTargets } = observation.current
      const targets = new Set<Element>([root, ...itemElements])
      for (const element of previousTargets) {
        if (!targets.has(element)) observer.unobserve(element)
      }
      for (const element of targets) {
        if (!previousTargets.has(element)) observer.observe(element)
      }
      observation.current.targets = targets
    }

    if (rendered.current.collapseOrder.join("\n") !== collapseOrder.join("\n")) forgetFailedCount()
    rendered.current = { collapsedCount, collapsibleCount, collapseOrder }

    if (focusOrigin.current) repairFocus(root, focusOrigin.current, collapseOrder[0])
    fit()
  })

  const registerMore = React.useCallback(() => {
    setHasMore(true)
    return () => setHasMore(false)
  }, [])

  const setMenuOpen = React.useCallback(
    (isOpen: boolean) => {
      isMenuOpen.current = isOpen
      if (isOpen) return

      // Focus is still in the closing menu and is about to return to the More
      // button. If this fit removes the button first, the repair needs to know that.
      if (!rootRef.current?.contains(document.activeElement)) focusOrigin.current = { kind: "more" }
      fit()
    },
    [fit]
  )

  const context = React.useMemo(
    () => ({ store, collapsedIds, menuSections, registerMore, setMenuOpen }),
    [store, collapsedIds, menuSections, registerMore, setMenuOpen]
  )

  return (
    <OverflowToolbarContext.Provider value={context}>
      <Toolbar
        ref={rootRef}
        data-slot="overflow-toolbar"
        // If the pinned actions alone are too wide, they scroll instead of being cut off.
        className={cn("w-full min-w-0 overflow-x-auto overflow-y-clip", className)}
        {...props}
      >
        {children}
      </Toolbar>
    </OverflowToolbarContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Group                                                                      */
/* -------------------------------------------------------------------------- */

export type OverflowToolbarGroupProps = Omit<
  React.ComponentProps<typeof ToolbarGroup>,
  "aria-label" | "aria-labelledby"
> & {
  /** Names the group for assistive technology and heads its actions in the More menu. */
  label: string
}

/**
 * Related actions that stay together in the toolbar and in the menu. A rule
 * divides the group from visible content before it, and the group disappears
 * with its rule once every action in it has collapsed.
 */
function OverflowToolbarGroup({ label, className, ...props }: OverflowToolbarGroupProps) {
  const id = React.useId()
  const group = React.useMemo(() => ({ id, label }), [id, label])

  return (
    <OverflowToolbarGroupContext.Provider value={group}>
      <ToolbarGroup
        aria-label={label}
        className={cn(
          "[&:not(:has(>:not([hidden])))]:hidden",
          "before:hidden before:h-[var(--hui-space-5)] before:w-px before:shrink-0 before:bg-[var(--hui-color-border-base-primary)] before:content-[''] forced-colors:before:bg-[CanvasText]",
          "[:is([data-overflow-toolbar-group]:has(>:not([hidden])),:not([hidden],[data-overflow-toolbar-group]))~&]:before:block",
          className
        )}
        {...props}
        data-overflow-toolbar-group=""
      />
    </OverflowToolbarGroupContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

export type OverflowToolbarItemProps = {
  /** The action's name, shown in the toolbar and in the More menu. */
  label: string
  /** Decorative; the label carries the name. */
  icon?: React.ReactNode
  /**
   * `"always"` keeps the action in the toolbar. A number ranks it against the
   * other actions: the lowest number moves into the menu first.
   */
  priority?: OverflowPriority
  /** Shows only the icon in the toolbar. The label becomes the accessible name and a tooltip. */
  iconOnly?: boolean
  disabled?: boolean
  onSelect?: () => void
  /** Identifies the action. Set it when you need a stable value to target in tests. */
  id?: string
  /** Applied to the toolbar button, not to the menu item. */
  className?: string
}

/** One action. It renders as a toolbar button while it fits and as a menu item when it does not. */
function OverflowToolbarItem({
  label,
  icon,
  priority = defaultOverflowPriority,
  iconOnly = false,
  disabled = false,
  onSelect,
  id: idProp,
  className,
}: OverflowToolbarItemProps) {
  const { store, collapsedIds } = useOverflowToolbar("OverflowToolbarItem")
  const group = React.useContext(OverflowToolbarGroupContext)
  const generatedId = React.useId()
  const id = idProp ?? generatedId

  // The handler is usually a new closure on each render; the menu calls the latest.
  const onSelectRef = React.useRef(onSelect)
  const select = React.useCallback(() => onSelectRef.current?.(), [])

  React.useLayoutEffect(() => {
    onSelectRef.current = onSelect
    store.upsert({
      id,
      priority,
      label,
      icon,
      disabled,
      groupId: group?.id ?? null,
      groupLabel: group?.label ?? null,
      select,
    })
  })

  React.useLayoutEffect(() => () => store.remove(id), [store, id])

  if (collapsedIds.has(id)) {
    // Keeps the action's place in the document order while it is in the menu.
    return <span hidden data-overflow-toolbar-item={id} />
  }

  const showsLabel = !iconOnly || icon == null
  const control = (
    <ToolbarButton
      render={<Button variant="ghost" size={showsLabel ? "default" : "icon"} />}
      aria-label={showsLabel ? undefined : label}
      disabled={disabled}
      // A disabled action stays reachable, so it can still be found and read out.
      focusableWhenDisabled
      className={cn(controlClassName, className)}
      onClick={select}
      data-overflow-toolbar-item={id}
    >
      {icon}
      {showsLabel && label}
    </ToolbarButton>
  )

  if (showsLabel) return control

  return (
    <Tooltip>
      <TooltipTrigger render={control} />
      <TooltipPopup sideOffset={8}>{label}</TooltipPopup>
    </Tooltip>
  )
}

/* -------------------------------------------------------------------------- */
/* More                                                                       */
/* -------------------------------------------------------------------------- */

export type OverflowToolbarMoreProps = {
  /** The button's name. Shown as its text unless `children` replace it. */
  label?: string
  /** Replaces the visible text, for example with an icon. `label` stays as the accessible name. */
  children?: React.ReactNode
  /** Applied to the toolbar button. */
  className?: string
}

/**
 * The menu that holds collapsed actions. Place it where the button should
 * appear, usually last. It renders nothing while every action fits.
 */
function OverflowToolbarMore(props: OverflowToolbarMoreProps) {
  const { menuSections, registerMore } = useOverflowToolbar("OverflowToolbarMore")

  React.useLayoutEffect(() => registerMore(), [registerMore])

  return menuSections.length === 0 ? null : <OverflowToolbarMenu sections={menuSections} {...props} />
}

function OverflowToolbarMenu({
  sections,
  label = "More",
  children,
  className,
}: OverflowToolbarMoreProps & { sections: readonly OverflowMenuSection[] }) {
  const { setMenuOpen } = useOverflowToolbar("OverflowToolbarMore")

  // The button can leave while its menu is open; restoring must not stay paused.
  React.useEffect(() => () => setMenuOpen(false), [setMenuOpen])

  return (
    <Menu
      onOpenChange={(isOpen) => {
        if (isOpen) setMenuOpen(true)
      }}
      // Restoring waits until the menu has closed and focus is back on the button.
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setMenuOpen(false)
      }}
    >
      <ToolbarButton
        render={<MenuTrigger render={<Button variant="ghost" />} />}
        aria-label={children == null ? undefined : label}
        className={cn(controlClassName, className)}
        data-overflow-toolbar-more=""
      >
        {children ?? label}
      </ToolbarButton>
      <MenuPopup
        align="end"
        // The menu belongs to the toolbar's React tree, so its key presses reach
        // the toolbar too, which would move focus along the toolbar and out of the menu.
        onKeyDown={(event) => {
          if (toolbarNavigationKeys.has(event.key)) event.stopPropagation()
        }}
      >
        {sections.map((section, index) => (
          <React.Fragment key={section.key}>
            {index > 0 && <MenuSeparator />}
            <MenuGroup>
              {section.label !== null && <MenuGroupLabel>{section.label}</MenuGroupLabel>}
              {section.items.map((item) => (
                <MenuItem key={item.id} disabled={item.disabled} onClick={item.select}>
                  {item.icon}
                  {item.label}
                </MenuItem>
              ))}
            </MenuGroup>
          </React.Fragment>
        ))}
      </MenuPopup>
    </Menu>
  )
}

export { OverflowToolbar, OverflowToolbarGroup, OverflowToolbarItem, OverflowToolbarMore }
