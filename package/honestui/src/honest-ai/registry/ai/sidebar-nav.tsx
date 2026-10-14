"use client"

import * as React from "react"
import {
  PanelLeft as PanelLeftIcon,
  Search as SearchIcon,
  SquarePen as SquarePenIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type SidebarNavItem = {
  id: string
  label: string
  icon: React.ReactNode
  /** A short count or state shown at the end of the row. */
  badge?: string
}

export type SidebarNavThread = {
  id: string
  title: string
}

export type SidebarNavLabels = {
  navigation: string
  collapse: string
  expand: string
  newChat: string
  threads: string
  searchThreads: string
  searchPlaceholder: string
  noThreads: string
  noMatches: (query: string) => string
}

export const defaultSidebarNavLabels: SidebarNavLabels = {
  navigation: "Workspace",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  newChat: "New chat",
  threads: "Chats",
  searchThreads: "Search chats",
  searchPlaceholder: "Search chats…",
  noThreads: "No chats yet.",
  noMatches: (query) => `No chats match “${query}”.`,
}

const rowText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const row =
  "flex min-h-[var(--hui-space-9)] w-full min-w-0 cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-3)] text-left text-[var(--hui-color-foreground-base-primary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] aria-[current]:bg-[var(--hui-color-background-neutral-secondary)] [&_svg]:size-4 [&_svg]:shrink-0"

export type SidebarNavProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** Shown at the top, such as a workspace name or switcher. Hidden when collapsed. */
  header?: React.ReactNode
  items: SidebarNavItem[]
  /** The `id` of the item for the current page. */
  activeItemId?: string
  onNavigate: (itemId: string) => void
  /** Past conversations, newest first. */
  threads: SidebarNavThread[]
  activeThreadId?: string
  onThreadSelect: (threadId: string) => void
  /** Passing it adds the New chat button. */
  onNewChat?: () => void
  /** Shown at the bottom. Hidden when collapsed. */
  footer?: React.ReactNode
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  labels?: Partial<SidebarNavLabels>
}

/**
 * Navigation for a chat product: primary destinations, a searchable list of
 * past conversations, and a collapse to an icon rail.
 */
function SidebarNav({
  header,
  items,
  activeItemId,
  onNavigate,
  threads,
  activeThreadId,
  onThreadSelect,
  onNewChat,
  footer,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  labels: labelsProp,
  className,
  ...props
}: SidebarNavProps) {
  const labels = { ...defaultSidebarNavLabels, ...labelsProp }
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = React.useState(defaultCollapsed)
  const isCollapsed = collapsedProp ?? uncontrolledCollapsed
  const [query, setQuery] = React.useState("")
  const threadsId = React.useId()

  const normalizedQuery = query.trim().toLowerCase()
  const visibleThreads = normalizedQuery
    ? threads.filter((thread) => thread.title.toLowerCase().includes(normalizedQuery))
    : threads

  const toggleCollapsed = () => {
    if (collapsedProp === undefined) setUncontrolledCollapsed(!isCollapsed)
    onCollapsedChange?.(!isCollapsed)
  }

  return (
    <nav
      aria-label={labels.navigation}
      data-slot="sidebar-nav"
      data-collapsed={isCollapsed ? "" : undefined}
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col gap-[var(--hui-space-3)] border-e-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] motion-safe:transition-[width] motion-safe:duration-200",
        rowText,
        isCollapsed ? "w-[calc(var(--hui-space-9)+var(--hui-space-3)*2)]" : "w-60",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-[var(--hui-space-2)]">
        {!isCollapsed && header && <div className="min-w-0 flex-1 truncate">{header}</div>}
        <Button
          variant="link"
          size="icon"
          className={cn("shrink-0", !isCollapsed && "ms-auto")}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? labels.expand : labels.collapse}
          onClick={toggleCollapsed}
        >
          <PanelLeftIcon aria-hidden="true" />
        </Button>
      </div>

      <ul role="list" className="m-0 flex list-none flex-col gap-[var(--hui-space-1)] p-0">
        {onNewChat && (
          <li>
            <button
              type="button"
              className={row}
              aria-label={isCollapsed ? labels.newChat : undefined}
              onClick={onNewChat}
            >
              <SquarePenIcon aria-hidden="true" />
              {!isCollapsed && <span className="min-w-0 truncate">{labels.newChat}</span>}
            </button>
          </li>
        )}
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={row}
              aria-current={item.id === activeItemId ? "page" : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span aria-hidden="true" className="flex shrink-0">
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="shrink-0 tabular-nums text-[var(--hui-color-foreground-base-secondary)]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* The rail has no room for titles, so the thread list is left out when collapsed. */}
      {!isCollapsed && (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--hui-space-2)]">
          <p
            id={threadsId}
            className="m-0 px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-medium)]"
          >
            {labels.threads}
          </p>
          {threads.length > 0 && (
            <label className="flex min-h-[var(--hui-space-9)] items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] focus-within:border-[var(--hui-color-border-accent-emphasis)]">
              <SearchIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={labels.searchThreads}
                placeholder={labels.searchPlaceholder}
                className={cn(
                  "min-w-0 flex-1 border-0 bg-transparent text-[var(--hui-color-foreground-base-primary)] outline-none placeholder:text-[var(--hui-color-foreground-base-tertiary)]",
                  rowText
                )}
              />
            </label>
          )}
          {visibleThreads.length > 0 ? (
            <ul
              role="list"
              aria-labelledby={threadsId}
              className="m-0 flex min-h-0 list-none flex-col gap-[var(--hui-space-1)] overflow-y-auto p-0"
            >
              {visibleThreads.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    className={row}
                    aria-current={thread.id === activeThreadId ? "true" : undefined}
                    onClick={() => onThreadSelect(thread.id)}
                  >
                    <span className="min-w-0 truncate">{thread.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="m-0 px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]">
              {threads.length === 0 ? labels.noThreads : labels.noMatches(query.trim())}
            </p>
          )}
        </div>
      )}

      {!isCollapsed && footer && <div className="mt-auto min-w-0">{footer}</div>}
    </nav>
  )
}

export { SidebarNav }
