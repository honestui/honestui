import type {
  AuditLogActor,
  AuditLogDay,
  AuditLogEntry,
  AuditLogFilter,
  AuditLogLabels,
} from "./audit-log-types"

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

export function getActorId(actor: AuditLogActor): string {
  return actor.id ?? actor.name
}

/** Up to two initials: "Ana Ruiz" → "AR", "deploy-bot" → "DE". */
export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

/** The calendar day of `date` in `timeZone`, as `YYYY-MM-DD`, so days group the same way everywhere. */
export function getDayKey(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00"
  return `${part("year")}-${part("month")}-${part("day")}`
}

/** Newest first, grouped by calendar day. Entries with the same time keep their given order. */
export function groupEntriesByDay(entries: AuditLogEntry[], timeZone?: string): AuditLogDay[] {
  const sorted = entries
    .map((entry, index) => ({ entry, index, time: toDate(entry.timestamp).getTime() }))
    .sort((a, b) => b.time - a.time || a.index - b.index)

  const days: AuditLogDay[] = []
  for (const { entry, time } of sorted) {
    const date = new Date(time)
    const key = getDayKey(date, timeZone)
    const last = days[days.length - 1]
    if (last && last.key === key) last.entries.push(entry)
    else days.push({ key, date, entries: [entry] })
  }
  return days
}

/** The day before `key`, as `YYYY-MM-DD`. */
function previousDayKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day - 1))
  return date.toISOString().slice(0, 10)
}

export function formatDayHeading(
  day: Pick<AuditLogDay, "key" | "date">,
  now: Date,
  labels: Pick<AuditLogLabels, "today" | "yesterday">,
  options: { locale?: string | undefined; timeZone?: string | undefined } = {}
): string {
  const today = getDayKey(now, options.timeZone)
  if (day.key === today) return labels.today
  if (day.key === previousDayKey(today)) return labels.yesterday
  const sameYear = day.key.slice(0, 4) === today.slice(0, 4)
  return new Intl.DateTimeFormat(options.locale, {
    timeZone: options.timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(day.date)
}

/**
 * The short time beside an entry. Today's entries read as relative time
 * ("5 min ago"); older ones read as a clock time, because the day heading
 * already says which day.
 */
export function formatEntryTime(
  date: Date,
  now: Date,
  labels: Pick<AuditLogLabels, "justNow" | "minutesAgo" | "hoursAgo">,
  options: { locale?: string | undefined; timeZone?: string | undefined } = {}
): string {
  const sameDay = getDayKey(date, options.timeZone) === getDayKey(now, options.timeZone)
  const elapsed = now.getTime() - date.getTime()
  if (sameDay && elapsed >= 0) {
    const minutes = Math.floor(elapsed / 60_000)
    if (minutes < 1) return labels.justNow
    if (minutes < 60) return labels.minutesAgo(minutes)
    return labels.hoursAgo(Math.floor(minutes / 60))
  }
  return new Intl.DateTimeFormat(options.locale, {
    timeZone: options.timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function formatAbsoluteTime(
  date: Date,
  options: { locale?: string | undefined; timeZone?: string | undefined } = {}
): string {
  return new Intl.DateTimeFormat(options.locale, {
    timeZone: options.timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function filterEntries(entries: AuditLogEntry[], filter: AuditLogFilter): AuditLogEntry[] {
  return entries.filter(
    (entry) =>
      (filter.actor == null || getActorId(entry.actor) === filter.actor) &&
      (filter.category == null || entry.category === filter.category)
  )
}

/** Each actor once, in order of first appearance. */
export function getActors(entries: AuditLogEntry[]): AuditLogActor[] {
  const seen = new Map<string, AuditLogActor>()
  for (const entry of entries) {
    const id = getActorId(entry.actor)
    if (!seen.has(id)) seen.set(id, entry.actor)
  }
  return [...seen.values()]
}

/** Each category once, sorted by name. */
export function getCategories(entries: AuditLogEntry[]): string[] {
  return [...new Set(entries.flatMap((entry) => (entry.category ? [entry.category] : [])))].sort(
    (a, b) => a.localeCompare(b)
  )
}

export const defaultAuditLogLabels: AuditLogLabels = {
  title: "Activity",
  count: (count) => `${count} ${count === 1 ? "event" : "events"}`,
  today: "Today",
  yesterday: "Yesterday",
  justNow: "Just now",
  minutesAgo: (minutes) => `${minutes} min ago`,
  hoursAgo: (hours) => `${hours} hr ago`,
  notSet: "Not set",
  enabled: "On",
  disabled: "Off",
  was: "Was",
  now: "now",
  added: "Added",
  removed: "Removed",
  details: "Details",
  time: "Time",
  showMoreChanges: (count) => `${count} more ${count === 1 ? "change" : "changes"}`,
  showFewerChanges: "Show fewer",
  everyone: "Everyone",
  people: "People",
  allActivity: "All activity",
  categories: "Activity type",
  loadMore: "Load older activity",
  loading: "Loading…",
  empty: "No activity yet.",
  emptyFiltered: "No activity matches these filters.",
  clearFilters: "Clear filters",
  system: "System",
  api: "API",
}
