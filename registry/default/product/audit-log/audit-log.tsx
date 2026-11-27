"use client"

import * as React from "react"
import {
  ArrowRight as ArrowRightIcon,
  Bot as BotIcon,
  ChevronDown as ChevronDownIcon,
  Code as CodeIcon,
  History as HistoryIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/registry/default/ui/avatar"
import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/registry/default/ui/menu"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/registry/default/ui/tooltip"

import type {
  AuditLogActor,
  AuditLogChange,
  AuditLogEntry,
  AuditLogFilter,
  AuditLogLabels,
  AuditLogListChange,
  AuditLogValueChange,
} from "./audit-log-types"
import {
  defaultAuditLogLabels,
  filterEntries,
  formatAbsoluteTime,
  formatDayHeading,
  formatEntryTime,
  getActorId,
  getActors,
  getCategories,
  getInitials,
  groupEntriesByDay,
  toDate,
} from "./audit-log-utils"

export type {
  AuditLogActor,
  AuditLogActorKind,
  AuditLogChange,
  AuditLogDay,
  AuditLogDetail,
  AuditLogEntry,
  AuditLogFilter,
  AuditLogLabels,
  AuditLogListChange,
  AuditLogTarget,
  AuditLogValueChange,
} from "./audit-log-types"
export {
  defaultAuditLogLabels,
  filterEntries,
  formatEntryTime,
  groupEntriesByDay,
} from "./audit-log-utils"

/** 12px meta. */
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const secondaryText = cn("text-[var(--hui-color-foreground-base-secondary)]", metaText)
/** 13px: headings, diffs, the entry sentence. */
const labelText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"
const hairline = "border-[var(--hui-color-border-base-primary)]"
const quietButton =
  "h-6 px-[var(--hui-space-2)] shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-secondary)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)]"

type TimeOptions = { locale?: string | undefined; timeZone?: string | undefined }

type AuditLogContextValue = {
  labels: AuditLogLabels
  now: Date
  timeOptions: TimeOptions
  maxInlineChanges: number
  renderValue: ((value: unknown, change: AuditLogValueChange) => React.ReactNode) | undefined
}

const AuditLogContext = React.createContext<AuditLogContextValue | null>(null)

function useAuditLog() {
  const context = React.useContext(AuditLogContext)
  if (!context) throw new Error("Audit Log parts must be used inside <AuditLog>.")
  return context
}

export type AuditLogProps = Omit<React.ComponentProps<"section">, "title"> & {
  entries: AuditLogEntry[]
  /** The time relative times count from. Defaults to the time the log mounted, refreshed each minute. */
  now?: Date | number | undefined
  locale?: string | undefined
  /** Groups days and formats times in this zone, such as "UTC". Defaults to the viewer's zone. */
  timeZone?: string | undefined
  /** Shows the people and activity-type filters. */
  filterable?: boolean | undefined
  filter?: AuditLogFilter | undefined
  defaultFilter?: AuditLogFilter | undefined
  onFilterChange?: ((filter: AuditLogFilter) => void) | undefined
  /** Shows "Load older activity" when true. */
  hasMore?: boolean | undefined
  /** Fetch the next page. Returning a promise shows a loading state until it settles. */
  onLoadMore?: (() => void | Promise<void>) | undefined
  /** Field changes shown before the rest fold behind a button. */
  maxInlineChanges?: number | undefined
  /** Replaces the header. Pass `null` to remove it. */
  header?: React.ReactNode
  renderValue?: ((value: unknown, change: AuditLogValueChange) => React.ReactNode) | undefined
  labels?: Partial<AuditLogLabels> | undefined
}

/** The current minute, refreshed each minute. Null during server rendering, which has no viewer clock. */
function subscribeToMinutes(onChange: () => void) {
  const timer = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(timer)
}
const getMinute = () => Math.floor(Date.now() / 60_000) * 60_000
const getServerMinute = () => null

function useNow(nowProp: Date | number | undefined) {
  const minute = React.useSyncExternalStore(subscribeToMinutes, getMinute, getServerMinute)
  if (nowProp !== undefined) return toDate(nowProp)
  return minute === null ? null : new Date(minute)
}

function AuditLog({
  entries,
  now: nowProp,
  locale,
  timeZone,
  filterable = false,
  filter: filterProp,
  defaultFilter,
  onFilterChange,
  hasMore = false,
  onLoadMore,
  maxInlineChanges = 3,
  header,
  renderValue,
  labels: labelsProp,
  className,
  ...props
}: AuditLogProps) {
  const labels = React.useMemo(() => ({ ...defaultAuditLogLabels, ...labelsProp }), [labelsProp])
  const now = useNow(nowProp)

  const [internalFilter, setInternalFilter] = React.useState<AuditLogFilter>(defaultFilter ?? {})
  const filter = filterProp ?? internalFilter
  const setFilter = (next: AuditLogFilter) => {
    setInternalFilter(next)
    onFilterChange?.(next)
  }

  const visible = React.useMemo(() => filterEntries(entries, filter), [entries, filter])
  const days = React.useMemo(() => groupEntriesByDay(visible, timeZone), [visible, timeZone])
  const filtered = filter.actor != null || filter.category != null

  const [loadingMore, setLoadingMore] = React.useState(false)
  const loadMore = async () => {
    if (!onLoadMore || loadingMore) return
    setLoadingMore(true)
    try {
      await onLoadMore()
    } finally {
      setLoadingMore(false)
    }
  }

  const context = React.useMemo(
    (): AuditLogContextValue | null =>
      now
        ? { labels, now, timeOptions: { locale, timeZone }, maxInlineChanges, renderValue }
        : null,
    [labels, now, locale, timeZone, maxInlineChanges, renderValue]
  )

  return (
    <section
      data-slot="audit-log"
      aria-label={props["aria-labelledby"] ? undefined : labels.title}
      className={cn(
        "@container flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
        hairline,
        "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]",
        className
      )}
      {...props}
    >
      {header === undefined ? (
        <div
          data-slot="audit-log-header"
          className="flex min-h-12 flex-wrap items-center justify-between gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-2)] px-[var(--hui-space-5)] py-[var(--hui-space-2)]"
        >
          <p
            className={cn(
              "m-0 flex items-baseline gap-x-[var(--hui-space-3)] [font-weight:var(--hui-font-weight-medium)]",
              labelText
            )}
          >
            {labels.title}
            <span
              role="status"
              className={cn(
                "tabular-nums [font-weight:var(--hui-font-weight-regular)]",
                secondaryText
              )}
            >
              {labels.count(visible.length)}
            </span>
          </p>
          {filterable && (
            <div className="-me-[var(--hui-space-2)] flex flex-wrap items-center">
              <FilterMenu
                label={labels.people}
                allLabel={labels.everyone}
                value={filter.actor ?? null}
                options={getActors(entries).map((actor) => ({
                  value: getActorId(actor),
                  label: actor.name,
                }))}
                onValueChange={(actor) => setFilter({ ...filter, actor })}
              />
              {getCategories(entries).length > 0 && (
                <FilterMenu
                  label={labels.categories}
                  allLabel={labels.allActivity}
                  value={filter.category ?? null}
                  options={getCategories(entries).map((category) => ({
                    value: category,
                    label: category,
                  }))}
                  onValueChange={(category) => setFilter({ ...filter, category })}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        header
      )}

      {days.length === 0 ? (
        <div
          data-slot="audit-log-empty"
          className={cn(
            "flex flex-col items-center justify-center gap-[var(--hui-space-3)] px-[var(--hui-space-5)] py-[var(--hui-space-8,32px)] text-center text-[var(--hui-color-foreground-base-secondary)]",
            labelText
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-[var(--hui-radius-1)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
          >
            <HistoryIcon className="size-4" />
          </span>
          {filtered ? labels.emptyFiltered : labels.empty}
          {filtered && (
            <Button variant="link" size="sm" className={quietButton} onClick={() => setFilter({})}>
              {labels.clearFilters}
            </Button>
          )}
        </div>
      ) : context ? (
        <AuditLogContext.Provider value={context}>
          <div
            data-slot="audit-log-days"
            className="pb-[var(--hui-space-2)]"
          >
            {days.map((day) => (
              <AuditLogDayGroup key={day.key} day={day} />
            ))}
          </div>
        </AuditLogContext.Provider>
      ) : (
        // Times depend on the viewer's clock, so they wait for the client.
        <div aria-hidden="true" className="h-40" />
      )}

      {hasMore && onLoadMore && (
        <div className="flex justify-center px-[var(--hui-space-5)] py-[var(--hui-space-3)]">
          <Button
            variant="link"
            size="sm"
            className={quietButton}
            disabled={loadingMore}
            aria-busy={loadingMore || undefined}
            onClick={loadMore}
          >
            {loadingMore ? labels.loading : labels.loadMore}
          </Button>
        </div>
      )}
    </section>
  )
}

function FilterMenu({
  label,
  allLabel,
  value,
  options,
  onValueChange,
}: {
  label: string
  allLabel: string
  value: string | null
  options: { value: string; label: string }[]
  onValueChange: (value: string | null) => void
}) {
  const ALL = "\u0000all"
  const current = options.find((option) => option.value === value)
  return (
    <Menu>
      <MenuTrigger
        aria-label={`${label}: ${current?.label ?? allLabel}`}
        render={
          <Button
            variant="ghost"
            size="sm"
            data-slot="audit-log-filter"
            className="gap-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] hover:text-[var(--hui-color-foreground-base-primary)]"
          />
        }
      >
        <span className={cn(current && "[font-weight:var(--hui-font-weight-medium)]")}>
          {current?.label ?? allLabel}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-3 text-[var(--hui-color-foreground-base-secondary)]"
        />
      </MenuTrigger>
      <MenuPopup align="end" className="min-w-44">
        <MenuGroup>
          <MenuGroupLabel>{label}</MenuGroupLabel>
          <MenuRadioGroup
            value={value ?? ALL}
            onValueChange={(next: string) => onValueChange(next === ALL ? null : next)}
          >
            <MenuRadioItem value={ALL} closeOnClick>
              {allLabel}
            </MenuRadioItem>
            {options.map((option) => (
              <MenuRadioItem key={option.value} value={option.value} closeOnClick>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  )
}

function AuditLogDayGroup({ day }: { day: ReturnType<typeof groupEntriesByDay>[number] }) {
  const { labels, now, timeOptions } = useAuditLog()
  const headingId = React.useId()
  return (
    <div role="group" aria-labelledby={headingId} data-slot="audit-log-day">
      <div
        id={headingId}
        className={cn(
          "sticky top-0 z-[1] m-0 bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] pt-[var(--hui-space-5)] pb-[var(--hui-space-1)] [font-weight:var(--hui-font-weight-medium)]",
          secondaryText
        )}
      >
        {formatDayHeading(day, now, labels, timeOptions)}
      </div>
      <ol className="m-0 list-none px-[var(--hui-space-5)] [&>li+li]:border-t-[0.5px] [&>li+li]:border-t-[var(--hui-color-border-base-primary)]">
        {day.entries.map((entry) => (
          <AuditLogItem key={entry.id} entry={entry} />
        ))}
      </ol>
    </div>
  )
}

function ActorAvatar({ actor, tone }: { actor: AuditLogActor; tone: AuditLogEntry["tone"] }) {
  const { labels } = useAuditLog()
  if (actor.kind === "system" || actor.kind === "api") {
    const Icon = actor.kind === "api" ? CodeIcon : BotIcon
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-secondary)] text-[var(--hui-color-foreground-base-secondary)]",
          tone === "danger" && "text-[var(--hui-color-foreground-danger-primary)]"
        )}
        title={actor.kind === "api" ? labels.api : labels.system}
      >
        <Icon className="size-3.5" />
      </span>
    )
  }
  return (
    <Avatar size="3" aria-hidden="true" className="shrink-0">
      {actor.avatarUrl && <AvatarImage src={actor.avatarUrl} alt="" />}
      <AvatarFallback>{getInitials(actor.name)}</AvatarFallback>
    </Avatar>
  )
}

function AuditLogItem({ entry }: { entry: AuditLogEntry }) {
  const { labels, now, timeOptions, maxInlineChanges } = useAuditLog()
  const [showAllChanges, setShowAllChanges] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const changesId = React.useId()
  const detailsId = React.useId()

  const date = toDate(entry.timestamp)
  const changes = entry.changes ?? []
  const overflow = changes.length - maxInlineChanges
  const shownChanges =
    showAllChanges || overflow <= 1 ? changes : changes.slice(0, maxInlineChanges)
  const hidden = changes.length - shownChanges.length
  const details = entry.details ?? []
  const absolute = formatAbsoluteTime(date, timeOptions)

  return (
    <li
      data-slot="audit-log-entry"
      data-tone={entry.tone ?? "default"}
      className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-[var(--hui-space-4)] py-[var(--hui-space-4)]"
    >
      <ActorAvatar actor={entry.actor} tone={entry.tone} />
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-3)]">
        <div className="flex min-w-0 items-start justify-between gap-x-[var(--hui-space-4)]">
          <p
            className={cn(
              "m-0 min-w-0 pt-[2px] text-[var(--hui-color-foreground-base-secondary)]",
              labelText
            )}
          >
            <span className="text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
              {entry.actor.name}
            </span>{" "}
            {entry.action}
            {entry.target && (
              <>
                {" "}
                {entry.target.href ? (
                  <a
                    href={entry.target.href}
                    className="rounded-[2px] text-[var(--hui-color-foreground-base-primary)] underline decoration-[var(--hui-color-border-base-secondary)] underline-offset-2 [font-weight:var(--hui-font-weight-medium)] hover:decoration-[var(--hui-color-foreground-base-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hui-color-border-accent-emphasis)]"
                  >
                    {entry.target.label}
                  </a>
                ) : (
                  <span className="text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
                    {entry.target.label}
                  </span>
                )}
              </>
            )}
          </p>
          <Tooltip>
            <TooltipTrigger
              render={
                <time
                  dateTime={date.toISOString()}
                  data-slot="audit-log-time"
                  className={cn("shrink-0 pt-[3px] whitespace-nowrap tabular-nums", secondaryText)}
                />
              }
            >
              <span aria-hidden="true">{formatEntryTime(date, now, labels, timeOptions)}</span>
              <span className="sr-only">{absolute}</span>
            </TooltipTrigger>
            <TooltipPopup>{absolute}</TooltipPopup>
          </Tooltip>
        </div>

        {changes.length > 0 && (
          <ul
            id={changesId}
            data-slot="audit-log-changes"
            className="m-0 grid list-none grid-cols-[max-content_minmax(0,1fr)] gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-2)] p-0"
          >
            {shownChanges.map((change, index) => (
              <ChangeLine key={`${change.label}-${index}`} change={change} />
            ))}
          </ul>
        )}

        {(hidden > 0 || (showAllChanges && overflow > 1) || details.length > 0) && (
          <div className="-my-[var(--hui-space-1)] -ms-[var(--hui-space-2)] flex flex-wrap items-center gap-[var(--hui-space-1)]">
            {(hidden > 0 || (showAllChanges && overflow > 1)) && (
              <Button
                variant="link"
                size="sm"
                className={quietButton}
                aria-expanded={showAllChanges}
                aria-controls={changesId}
                onClick={() => setShowAllChanges((current) => !current)}
              >
                {showAllChanges ? labels.showFewerChanges : labels.showMoreChanges(hidden)}
              </Button>
            )}
            {details.length > 0 && (
              <Button
                variant="link"
                size="sm"
                className={quietButton}
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((current) => !current)}
              >
                {labels.details}
                <ChevronDownIcon
                  aria-hidden="true"
                  className={cn(
                    "size-3 motion-safe:[transition:transform_var(--hui-duration-fast)_var(--hui-ease-out)]",
                    detailsOpen && "rotate-180"
                  )}
                />
              </Button>
            )}
          </div>
        )}

        {details.length > 0 && (
          <dl
            id={detailsId}
            hidden={!detailsOpen}
            data-slot="audit-log-details"
            className={cn(
              "m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-[var(--hui-space-5)] gap-y-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]",
              metaText
            )}
          >
            <dt className="text-[var(--hui-color-foreground-base-secondary)]">{labels.time}</dt>
            <dd className="m-0 tabular-nums">{absolute}</dd>
            {details.map((detail) => (
              <React.Fragment key={detail.label}>
                <dt className="text-[var(--hui-color-foreground-base-secondary)]">
                  {detail.label}
                </dt>
                <dd className={cn("m-0 min-w-0 break-all", detail.mono && "font-mono")}>
                  {detail.value}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        )}
      </div>
    </li>
  )
}

function DisplayValue({ change, value }: { change: AuditLogValueChange; value: unknown }) {
  const { labels, renderValue } = useAuditLog()
  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-[var(--hui-color-foreground-base-secondary)] italic">
        {labels.notSet}
      </span>
    )
  }
  if (change.render) return <>{change.render(value)}</>
  if (renderValue) return <>{renderValue(value, change)}</>
  if (typeof value === "boolean") return <>{value ? labels.enabled : labels.disabled}</>
  if (typeof value === "number") return <>{value.toLocaleString()}</>
  if (value instanceof Date) return <>{value.toLocaleDateString()}</>
  if (Array.isArray(value)) return <>{value.map(String).join(", ")}</>
  if (typeof value === "object") return <code className="break-all">{JSON.stringify(value)}</code>
  return <>{String(value)}</>
}

function ChangeLine({ change }: { change: AuditLogChange }) {
  return (
    <li
      data-slot="audit-log-change"
      className={cn(
        "col-span-2 grid min-w-0 grid-cols-subgrid items-baseline",
        metaText
      )}
    >
      <span className="min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]">
        {change.label}
      </span>
      {change.kind === "list" ? (
        <ListChangeValue change={change} />
      ) : (
        <ValueChange change={change} />
      )}
    </li>
  )
}

function ValueChange({ change }: { change: AuditLogValueChange }) {
  const { labels } = useAuditLog()
  const hadValue = !(change.before === null || change.before === undefined || change.before === "")
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-2)] tabular-nums">
      <span className="sr-only">{labels.was} </span>
      <span
        data-slot="audit-log-before"
        className={cn(
          "min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]",
          hadValue && "line-through decoration-1"
        )}
      >
        <DisplayValue change={change} value={change.before} />
      </span>
      <span className="inline-flex min-w-0 items-center gap-x-[var(--hui-space-2)]">
        <ArrowRightIcon
          aria-hidden="true"
          className="size-3 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] rtl:rotate-180"
        />
        <span className="sr-only">, {labels.now} </span>
        <span
          data-slot="audit-log-after"
          className="min-w-0 break-words text-[var(--hui-color-foreground-base-primary)]"
        >
          <DisplayValue change={change} value={change.after} />
        </span>
      </span>
    </span>
  )
}

const listTone = {
  added: { Icon: PlusIcon },
  removed: { Icon: MinusIcon },
}

function ListChangeValue({ change }: { change: AuditLogListChange }) {
  const { labels } = useAuditLog()
  const itemLabel = change.itemLabel as ((item: unknown) => React.ReactNode) | undefined
  const items = [
    ...(change.added ?? []).map((item) => ({ tone: "added" as const, item })),
    ...(change.removed ?? []).map((item) => ({ tone: "removed" as const, item })),
  ]
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-1)]">
      {items.map(({ tone, item }, index) => {
        const { Icon } = listTone[tone]
        return (
          <span
            key={index}
            data-change={tone}
            className="inline-flex min-w-0 items-baseline gap-[var(--hui-space-1)]"
          >
            <Icon aria-hidden="true" className="size-3 shrink-0 translate-y-[1px] self-center text-[var(--hui-color-foreground-base-secondary)]" />
            <span className="sr-only">{labels[tone]}: </span>
            <span
              className={cn(
                "min-w-0 break-words",
                tone === "removed"
                  ? "text-[var(--hui-color-foreground-base-secondary)] line-through"
                  : "text-[var(--hui-color-foreground-base-primary)]"
              )}
            >
              {itemLabel ? itemLabel(item) : String(item)}
            </span>
          </span>
        )
      })}
    </span>
  )
}

export { AuditLog }
