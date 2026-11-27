"use client"

import * as React from "react"
import {
  Pencil as PencilIcon,
  Pin as PinIcon,
  PinOff as PinOffIcon,
  Search as SearchIcon,
  Trash2 as TrashIcon,
  Undo2 as UndoIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import { Checkbox } from "../../components/ui/checkbox.js"
import { Input } from "../../components/ui/input.js"
import { Textarea } from "../../components/ui/textarea.js"

export type MemoryItem = {
  id: string
  /** What the agent remembers, as one sentence. */
  content: string
  /** The group it belongs to, matching a `MemoryGroup` `kind`. */
  kind: string
  /** Where it was learned, such as a conversation title. */
  source?: { label: string; href?: string }
  createdAt: Date | string | number
  /** When the agent last used it. `null` means never. */
  lastUsedAt?: Date | string | number | null
  /** How sure the agent is, from 0 to 1. */
  confidence?: number
  pinned?: boolean
}

export type MemoryGroup = {
  kind: string
  label: string
}

export const defaultMemoryGroups: MemoryGroup[] = [
  { kind: "profile", label: "About you" },
  { kind: "preference", label: "Preferences" },
  { kind: "fact", label: "Facts" },
  { kind: "project", label: "Projects" },
]

export type MemoryViewerLabels = {
  title: string
  /** The count beside the title. */
  count: (count: number) => string
  search: string
  all: string
  /** Names the group filter. */
  filter: string
  edit: string
  save: string
  cancel: string
  editField: string
  forget: string
  pin: string
  unpin: string
  pinned: string
  select: (content: string) => string
  selectAll: string
  selected: (count: number) => string
  forgetSelected: (count: number) => string
  clearSelection: string
  /** The inline confirmation, when forgetting cannot be undone. */
  confirmForget: (count: number) => string
  forgot: (count: number) => string
  undo: string
  from: string
  learned: (date: string) => string
  used: (relative: string) => string
  neverUsed: string
  confidence: (percent: number) => string
  lowConfidence: string
  emptyTitle: string
  emptyDescription: string
  noMatches: (query: string) => string
}

export const defaultMemoryViewerLabels: MemoryViewerLabels = {
  title: "Memory",
  count: (count) => (count === 1 ? "1 memory" : `${count} memories`),
  search: "Search memories",
  all: "All",
  filter: "Show",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
  editField: "Edit memory",
  forget: "Forget",
  pin: "Pin",
  unpin: "Unpin",
  pinned: "Pinned",
  select: (content) => `Select: ${content}`,
  selectAll: "Select all shown",
  selected: (count) => `${count} selected`,
  forgetSelected: (count) => (count === 1 ? "Forget 1" : `Forget ${count}`),
  clearSelection: "Clear",
  confirmForget: (count) =>
    count === 1 ? "Forget this? The agent won't use it again." : `Forget ${count} memories? The agent won't use them again.`,
  forgot: (count) => (count === 1 ? "Forgot 1 memory." : `Forgot ${count} memories.`),
  undo: "Undo",
  from: "From",
  learned: (date) => `Learned ${date}`,
  used: (relative) => `used ${relative}`,
  neverUsed: "not used yet",
  confidence: (percent) => `${percent}% sure`,
  lowConfidence: "Unsure",
  emptyTitle: "Nothing remembered yet",
  emptyDescription: "What the agent learns about you and your work will appear here.",
  noMatches: (query) => `No memories match “${query}”.`,
}

export type MemoryViewerProps = Omit<React.ComponentProps<"section">, "children"> & {
  memories: MemoryItem[]
  /** Group order and names. Memories of other kinds are listed after them, by kind. */
  groups?: MemoryGroup[]
  /** Passing it shows Edit. Called with the new text on Save. */
  onEdit?: (id: string, content: string) => void
  /** Passing it shows Forget and selection. Called with every id forgotten at once. */
  onForget?: (ids: string[]) => void
  /**
   * Called with the forgotten memories when Undo is pressed. With it, forgetting
   * happens at once and offers Undo; without it, forgetting asks to confirm.
   */
  onRestore?: (memories: MemoryItem[]) => void
  /** Passing it shows Pin. Pinned memories lead their group. */
  onPinnedChange?: (id: string, pinned: boolean) => void
  query?: string
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  /** The group shown, or `null` for all. */
  filter?: string | null
  defaultFilter?: string | null
  onFilterChange?: (kind: string | null) => void
  /** Confidence below this is marked unsure. */
  lowConfidence?: number
  /** The time relative dates are measured from. Defaults to the time on the reader's device. */
  now?: Date
  locale?: string
  labels?: Partial<MemoryViewerLabels>
}

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const secondary = "text-[var(--hui-color-foreground-base-secondary)]"
const hairline = "border-[var(--hui-color-border-base-primary)]"
const iconButton = "text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)]"

const UNDO_MS = 8000

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value)
}

const subscribeNever = () => () => {}

/** The reader's time, read after hydration so server and client markup agree. */
function useClientNow(now?: Date) {
  const clientNow = React.useSyncExternalStore(
    subscribeNever,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null
  )
  return now ?? (clientNow === null ? null : new Date(clientNow))
}

function formatRelative(date: Date, now: Date, locale?: string) {
  const seconds = (date.getTime() - now.getTime()) / 1000
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, "minute")
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase()
  if (!needle) return <>{text}</>
  const parts: React.ReactNode[] = []
  const haystack = text.toLowerCase()
  let start = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    if (index > start) parts.push(text.slice(start, index))
    parts.push(
      <mark
        key={index}
        className="rounded-[2px] bg-[var(--hui-color-background-attention-primary)] text-inherit"
      >
        {text.slice(index, index + needle.length)}
      </mark>
    )
    start = index + needle.length
    index = haystack.indexOf(needle, start)
  }
  parts.push(text.slice(start))
  return <>{parts}</>
}

/**
 * What an agent remembers about a person and their work, grouped by kind,
 * with search, editing, pinning, and forgetting. It shows the memories you
 * pass and calls back on every change; storing them is your application's work.
 */
function MemoryViewer({
  memories,
  groups = defaultMemoryGroups,
  onEdit,
  onForget,
  onRestore,
  onPinnedChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  filter: filterProp,
  defaultFilter = null,
  onFilterChange,
  lowConfidence = 0.5,
  now: nowProp,
  locale,
  labels: labelsProp,
  className,
  ...props
}: MemoryViewerProps) {
  const labels = { ...defaultMemoryViewerLabels, ...labelsProp }
  const titleId = React.useId()
  const now = useClientNow(nowProp)

  const [queryState, setQueryState] = React.useState(defaultQuery)
  const query = queryProp ?? queryState
  const setQuery = (next: string) => {
    if (queryProp === undefined) setQueryState(next)
    onQueryChange?.(next)
  }

  const [filterState, setFilterState] = React.useState<string | null>(defaultFilter)
  const filter = filterProp === undefined ? filterState : filterProp
  const setFilter = (next: string | null) => {
    if (filterProp === undefined) setFilterState(next)
    onFilterChange?.(next)
  }

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  // Ids waiting on the inline confirmation, when forgetting cannot be undone.
  const [confirming, setConfirming] = React.useState<string[] | null>(null)
  const [undoable, setUndoable] = React.useState<MemoryItem[] | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  // Where focus goes after a change re-renders the list.
  const [focusRequest, setFocusRequest] = React.useState<
    { id: string; action: string } | { to: "undo" | "search" } | null
  >(null)

  React.useEffect(() => {
    if (!focusRequest) return
    if ("to" in focusRequest) {
      if (focusRequest.to === "undo") undoRef.current?.focus()
      else searchRef.current?.focus()
      return
    }
    listRef.current
      ?.querySelector<HTMLElement>(
        `[data-memory-id="${CSS.escape(focusRequest.id)}"] [data-action="${focusRequest.action}"]`
      )
      ?.focus()
  }, [focusRequest])

  // Undo stays available for a while, then the bar goes away.
  React.useEffect(() => {
    if (!undoable) return
    const timer = window.setTimeout(() => setUndoable(null), UNDO_MS)
    return () => window.clearTimeout(timer)
  }, [undoable])

  // Drop selections that no longer exist.
  const ids = React.useMemo(() => new Set(memories.map((memory) => memory.id)), [memories])
  const liveSelected = React.useMemo(() => new Set([...selected].filter((id) => ids.has(id))), [selected, ids])

  const needle = query.trim().toLowerCase()
  const visible = memories.filter(
    (memory) =>
      (filter === null || memory.kind === filter) &&
      (!needle ||
        memory.content.toLowerCase().includes(needle) ||
        memory.source?.label.toLowerCase().includes(needle))
  )

  const knownKinds = new Set(groups.map((group) => group.kind))
  const extraKinds = [...new Set(memories.map((memory) => memory.kind))].filter((kind) => !knownKinds.has(kind))
  const allGroups = [...groups, ...extraKinds.map((kind) => ({ kind, label: kind }))]
  const groupsWithItems = allGroups.filter((group) => memories.some((memory) => memory.kind === group.kind))

  const forgetNow = (forgetIds: string[]) => {
    if (!onForget || forgetIds.length === 0) return
    const forgotten = memories.filter((memory) => forgetIds.includes(memory.id))
    onForget(forgetIds)
    setSelected((current) => new Set([...current].filter((id) => !forgetIds.includes(id))))
    setConfirming(null)
    if (onRestore) {
      setUndoable(forgotten)
      setFocusRequest({ to: "undo" })
    } else {
      setFocusRequest({ to: "search" })
    }
  }

  const requestForget = (forgetIds: string[]) => {
    if (onRestore) forgetNow(forgetIds)
    else setConfirming(forgetIds)
  }

  const visibleIds = visible.map((memory) => memory.id)
  const selectedVisible = visibleIds.filter((id) => liveSelected.has(id)).length
  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <section
      aria-labelledby={titleId}
      data-slot="memory-viewer"
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        hairline,
        regularText,
        className
      )}
      {...props}
    >
      <div className={cn("flex flex-col gap-[var(--hui-space-4)] border-b-[0.5px] px-[var(--hui-space-5)] py-[var(--hui-space-4)]", hairline)}>
        <div className="flex min-w-0 items-baseline gap-[var(--hui-space-3)]">
          <span id={titleId} className="[font-weight:var(--hui-font-weight-medium)]">
            {labels.title}
          </span>
          <span className={cn("tabular-nums", secondary, metaText)}>{labels.count(memories.length)}</span>
        </div>
        {memories.length > 0 && (
          <>
            <div className="relative">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute start-[var(--hui-space-4)] top-1/2 z-10 size-3.5 -translate-y-1/2 text-[var(--hui-color-foreground-base-tertiary)]"
              />
              <Input
                ref={searchRef}
                type="search"
                size="sm"
                aria-label={labels.search}
                placeholder={labels.search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="[&_input]:ps-[calc(var(--hui-space-4)+var(--hui-space-5))]"
              />
            </div>
            {groupsWithItems.length > 1 && (
              <div
                role="group"
                aria-label={labels.filter}
                data-slot="memory-viewer-filter"
                className="flex min-w-0 flex-wrap gap-[var(--hui-space-2)]"
              >
                {[{ kind: null as string | null, label: labels.all }, ...groupsWithItems].map((group) => {
                  const count =
                    group.kind === null ? memories.length : memories.filter((memory) => memory.kind === group.kind).length
                  const active = filter === group.kind
                  return (
                    <button
                      key={group.kind ?? "all"}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(group.kind)}
                      className={cn(
                        "inline-flex h-7 items-center gap-[var(--hui-space-2)] rounded-full border-[0.5px] px-[var(--hui-space-4)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-accent)]",
                        metaText,
                        active
                          ? "border-transparent bg-[var(--hui-color-background-neutral-secondary)] text-[var(--hui-color-foreground-base-primary)]"
                          : cn(hairline, secondary, "hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)]")
                      )}
                    >
                      {group.label}
                      <span className="tabular-nums opacity-80">{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {onForget && visible.length > 0 && (
        <div
          data-slot="memory-viewer-selection"
          className={cn("flex min-h-10 items-center gap-[var(--hui-space-3)] border-b-[0.5px] px-[var(--hui-space-5)] py-[var(--hui-space-2)]", hairline)}
        >
          <Checkbox
            size="small"
            aria-label={labels.selectAll}
            checked={selectedVisible > 0 && selectedVisible === visibleIds.length}
            indeterminate={selectedVisible > 0 && selectedVisible < visibleIds.length}
            onCheckedChange={(checked) =>
              setSelected((current) => {
                const next = new Set(current)
                for (const id of visibleIds) {
                  if (checked) next.add(id)
                  else next.delete(id)
                }
                return next
              })
            }
          />
          <span className={cn("me-auto tabular-nums", secondary, metaText)}>
            {liveSelected.size > 0 ? labels.selected(liveSelected.size) : labels.selectAll}
          </span>
          {liveSelected.size > 0 && (
            <>
              <Button variant="ghost" size="xs" onClick={() => setSelected(new Set())}>
                {labels.clearSelection}
              </Button>
              <Button
                variant="destructive-outline"
                size="xs"
                data-slot="memory-viewer-forget-selected"
                onClick={() => requestForget([...liveSelected])}
              >
                <TrashIcon aria-hidden="true" />
                {labels.forgetSelected(liveSelected.size)}
              </Button>
            </>
          )}
        </div>
      )}

      {confirming && confirming.length > 1 && (
        <ForgetConfirm
          count={confirming.length}
          labels={labels}
          onCancel={() => setConfirming(null)}
          onConfirm={() => forgetNow(confirming)}
          className={cn("border-b-[0.5px] px-[var(--hui-space-5)] py-[var(--hui-space-3)]", hairline)}
        />
      )}

      <div ref={listRef} data-slot="memory-viewer-groups">
        {memories.length === 0 ? (
          <div data-slot="memory-viewer-empty" className="px-[var(--hui-space-5)] py-[var(--hui-space-8)] text-center">
            <p className="m-0 [font-weight:var(--hui-font-weight-medium)]">{labels.emptyTitle}</p>
            <p className={cn("m-0 mt-[var(--hui-space-2)] text-pretty", secondary, metaText)}>{labels.emptyDescription}</p>
          </div>
        ) : visible.length === 0 ? (
          <p className={cn("m-0 px-[var(--hui-space-5)] py-[var(--hui-space-7)] text-center", secondary)}>
            {labels.noMatches(query.trim())}
          </p>
        ) : (
          allGroups.map((group) => {
            const items = visible
              .filter((memory) => memory.kind === group.kind)
              .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
            if (items.length === 0) return null
            const groupId = `${titleId}-${group.kind}`
            return (
              <div key={group.kind} data-slot="memory-viewer-group" className={cn("border-b-[0.5px] last:border-b-0", hairline)}>
                <p
                  id={groupId}
                  className={cn(
                    "m-0 px-[var(--hui-space-5)] pt-[var(--hui-space-4)] pb-[var(--hui-space-1)] [font-weight:var(--hui-font-weight-medium)]",
                    secondary,
                    metaText
                  )}
                >
                  {group.label}
                </p>
                <ul aria-labelledby={groupId} className="m-0 list-none p-0">
                  {items.map((memory) => (
                    <MemoryRow
                      key={memory.id}
                      memory={memory}
                      query={query}
                      labels={labels}
                      now={now}
                      locale={locale}
                      lowConfidence={lowConfidence}
                      isEditing={editingId === memory.id}
                      isConfirming={confirming?.length === 1 && confirming[0] === memory.id}
                      selected={liveSelected.has(memory.id)}
                      onSelect={onForget ? (on) => toggle(memory.id, on) : undefined}
                      onStartEdit={onEdit ? () => setEditingId(memory.id) : undefined}
                      onEndEdit={(content) => {
                        if (content !== undefined && onEdit) onEdit(memory.id, content)
                        setEditingId(null)
                        setFocusRequest({ id: memory.id, action: "edit" })
                      }}
                      onForget={onForget ? () => requestForget([memory.id]) : undefined}
                      onCancelForget={() => {
                        setConfirming(null)
                        setFocusRequest({ id: memory.id, action: "forget" })
                      }}
                      onConfirmForget={() => forgetNow([memory.id])}
                      onPin={
                        onPinnedChange
                          ? () => {
                              onPinnedChange(memory.id, !memory.pinned)
                              setFocusRequest({ id: memory.id, action: "pin" })
                            }
                          : undefined
                      }
                    />
                  ))}
                </ul>
              </div>
            )
          })
        )}
      </div>

      <div aria-live="polite" data-slot="memory-viewer-status">
        {undoable && (
          <div
            className={cn(
              "flex items-center gap-[var(--hui-space-3)] border-t-[0.5px] px-[var(--hui-space-5)] py-[var(--hui-space-2)]",
              hairline,
              metaText
            )}
          >
            <span className={cn("me-auto", secondary)}>{labels.forgot(undoable.length)}</span>
            <Button
              ref={undoRef}
              variant="ghost"
              size="xs"
              data-slot="memory-viewer-undo"
              onClick={() => {
                onRestore?.(undoable)
                setFocusRequest({ id: undoable[0].id, action: "forget" })
                setUndoable(null)
              }}
            >
              <UndoIcon aria-hidden="true" />
              {labels.undo}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function ForgetConfirm({
  count,
  labels,
  onCancel,
  onConfirm,
  className,
}: {
  count: number
  labels: MemoryViewerLabels
  onCancel: () => void
  onConfirm: () => void
  className?: string
}) {
  const confirmRef = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => confirmRef.current?.focus(), [])
  return (
    <div
      role="group"
      data-slot="memory-viewer-confirm"
      className={cn("flex flex-wrap items-center gap-[var(--hui-space-3)]", metaText, className)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      <span className="me-auto min-w-0 flex-1 text-pretty">{labels.confirmForget(count)}</span>
      <Button variant="ghost" size="xs" onClick={onCancel}>
        {labels.cancel}
      </Button>
      <Button ref={confirmRef} variant="destructive" size="xs" onClick={onConfirm}>
        {labels.forget}
      </Button>
    </div>
  )
}

function MemoryRow({
  memory,
  query,
  labels,
  now,
  locale,
  lowConfidence,
  isEditing,
  isConfirming,
  selected,
  onSelect,
  onStartEdit,
  onEndEdit,
  onForget,
  onCancelForget,
  onConfirmForget,
  onPin,
}: {
  memory: MemoryItem
  query: string
  labels: MemoryViewerLabels
  now: Date | null
  locale?: string
  lowConfidence: number
  isEditing: boolean
  isConfirming: boolean
  selected: boolean
  onSelect?: (on: boolean) => void
  onStartEdit?: () => void
  onEndEdit: (content?: string) => void
  onForget?: () => void
  onCancelForget: () => void
  onConfirmForget: () => void
  onPin?: () => void
}) {
  const created = toDate(memory.createdAt)
  const lastUsed = memory.lastUsedAt == null ? null : toDate(memory.lastUsedAt)
  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: now && created.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
  const percent = memory.confidence === undefined ? null : Math.round(memory.confidence * 100)
  const unsure = memory.confidence !== undefined && memory.confidence < lowConfidence

  return (
    <li
      data-slot="memory-viewer-item"
      data-memory-id={memory.id}
      data-pinned={memory.pinned || undefined}
      data-selected={selected || undefined}
      className={cn(
        "group/memory relative flex min-w-0 items-start gap-[var(--hui-space-4)] bg-[var(--memory-row-bg)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] [--memory-row-bg:var(--hui-color-background-base-primary)]",
        selected && "[--memory-row-bg:var(--hui-color-background-base-secondary)]"
      )}
    >
      {onSelect && (
        <Checkbox
          size="small"
          className="mt-[3px]"
          aria-label={labels.select(memory.content)}
          checked={selected}
          onCheckedChange={(checked) => onSelect(Boolean(checked))}
        />
      )}
      {isEditing ? (
        <MemoryEditForm content={memory.content} labels={labels} onEndEdit={onEndEdit} />
      ) : (
        <div className="min-w-0 flex-1">
          <p className="m-0 break-words text-pretty">
            {memory.pinned && (
              <>
                <PinIcon aria-hidden="true" className="me-[var(--hui-space-2)] inline size-3 -translate-y-px text-[var(--hui-color-foreground-base-tertiary)]" />
                <span className="sr-only">{labels.pinned}: </span>
              </>
            )}
            <Highlight text={memory.content} query={query} />
          </p>
          <p className={cn("m-0 mt-[var(--hui-space-1)] flex flex-wrap items-center gap-x-[var(--hui-space-2)]", secondary, metaText)}>
            {memory.source && (
              <>
                <span>
                  {labels.from}{" "}
                  {memory.source.href ? (
                    <a
                      href={memory.source.href}
                      className="text-[var(--hui-color-foreground-base-primary)] underline decoration-[var(--hui-color-border-base-primary)] underline-offset-2 hover:decoration-current"
                    >
                      <Highlight text={memory.source.label} query={query} />
                    </a>
                  ) : (
                    <Highlight text={memory.source.label} query={query} />
                  )}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="tabular-nums">
              <time dateTime={created.toISOString()}>{labels.learned(dateFormat.format(created))}</time>
              {now && (
                <>
                  {", "}
                  {lastUsed ? (
                    <time dateTime={lastUsed.toISOString()}>{labels.used(formatRelative(lastUsed, now, locale))}</time>
                  ) : (
                    labels.neverUsed
                  )}
                </>
              )}
            </span>
            {percent !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={cn("tabular-nums", unsure && "text-[var(--hui-color-foreground-attention-primary-hover)]")}
                >
                  {unsure ? `${labels.lowConfidence}, ${labels.confidence(percent)}` : labels.confidence(percent)}
                </span>
              </>
            )}
          </p>
          {isConfirming && (
            <ForgetConfirm
              count={1}
              labels={labels}
              onCancel={onCancelForget}
              onConfirm={onConfirmForget}
              className="mt-[var(--hui-space-3)]"
            />
          )}
        </div>
      )}
      {!isEditing && !isConfirming && (
        <div
          data-slot="memory-viewer-item-actions"
          // With a mouse, the actions float over the end of the text and stay hidden
          // until the row is hovered or one has focus, so they never squeeze the text.
          className="-my-[2px] flex shrink-0 items-center gap-[var(--hui-space-1)] motion-safe:[transition:opacity_150ms] pointer-fine:absolute pointer-fine:end-[var(--hui-space-4)] pointer-fine:top-[var(--hui-space-3)] pointer-fine:my-0 pointer-fine:bg-[linear-gradient(to_right,transparent,var(--memory-row-bg)_var(--hui-space-6))] pointer-fine:ps-[var(--hui-space-7)] pointer-fine:opacity-0 pointer-fine:group-hover/memory:opacity-100 pointer-fine:group-focus-within/memory:opacity-100"
        >
          {onPin && (
            <Button
              variant="link"
              size="icon-sm"
              data-action="pin"
              aria-pressed={Boolean(memory.pinned)}
              aria-label={`${labels.pin}: ${memory.content}`}
              title={memory.pinned ? labels.unpin : labels.pin}
              className={iconButton}
              onClick={onPin}
            >
              {memory.pinned ? <PinOffIcon aria-hidden="true" /> : <PinIcon aria-hidden="true" />}
            </Button>
          )}
          {onStartEdit && (
            <Button
              variant="link"
              size="icon-sm"
              data-action="edit"
              aria-label={`${labels.edit}: ${memory.content}`}
              title={labels.edit}
              className={iconButton}
              onClick={onStartEdit}
            >
              <PencilIcon aria-hidden="true" />
            </Button>
          )}
          {onForget && (
            <Button
              variant="link"
              size="icon-sm"
              data-action="forget"
              aria-label={`${labels.forget}: ${memory.content}`}
              title={labels.forget}
              className={iconButton}
              onClick={onForget}
            >
              <TrashIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

function MemoryEditForm({
  content: initialContent,
  labels,
  onEndEdit,
}: {
  content: string
  labels: MemoryViewerLabels
  onEndEdit: (content?: string) => void
}) {
  const [draft, setDraft] = React.useState(initialContent)
  const fieldRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const field = fieldRef.current
    field?.focus()
    field?.setSelectionRange(field.value.length, field.value.length)
  }, [])

  const save = () => {
    const content = draft.trim()
    onEndEdit(content && content !== initialContent ? content : undefined)
  }

  return (
    <form
      className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-3)]"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <Textarea
        ref={fieldRef}
        size="sm"
        rows={2}
        aria-label={labels.editField}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            onEndEdit()
          } else if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            save()
          }
        }}
        className="resize-none [font-size:var(--hui-font-size-regular)]"
      />
      <div className="flex justify-end gap-[var(--hui-space-2)]">
        <Button type="button" variant="ghost" size="xs" onClick={() => onEndEdit()}>
          {labels.cancel}
        </Button>
        <Button type="submit" size="xs" disabled={!draft.trim()}>
          {labels.save}
        </Button>
      </div>
    </form>
  )
}

export { MemoryViewer }
