import type * as React from "react"

export type AuditLogActorKind = "person" | "system" | "api"

export type AuditLogActor = {
  /** Identifies the actor for filtering. Defaults to `name`. */
  id?: string | undefined
  name: string
  avatarUrl?: string | undefined
  /** `system` and `api` actors show an icon instead of initials. */
  kind?: AuditLogActorKind | undefined
}

export type AuditLogTarget = {
  label: string
  href?: string | undefined
}

export type AuditLogValueChange = {
  kind?: "value" | undefined
  label: string
  before?: unknown
  after?: unknown
  render?: ((value: unknown) => React.ReactNode) | undefined
}

export type AuditLogListChange = {
  kind: "list"
  label: string
  added?: unknown[] | undefined
  removed?: unknown[] | undefined
  itemLabel?: ((item: never) => React.ReactNode) | undefined
}

export type AuditLogChange = AuditLogValueChange | AuditLogListChange

export type AuditLogDetail = {
  label: string
  value: React.ReactNode
  /** Sets the value in the monospace face, for ids, addresses, and keys. */
  mono?: boolean | undefined
}

export type AuditLogEntry = {
  id: string
  actor: AuditLogActor
  /** The verb phrase between the actor and the target, such as "changed the plan of". */
  action: string
  target?: AuditLogTarget | undefined
  /** A Date, an ISO string, or milliseconds since the epoch. */
  timestamp: Date | string | number
  /** A short grouping used by the action filter, such as "Billing" or "Members". */
  category?: string | undefined
  changes?: AuditLogChange[] | undefined
  /** Facts about the event behind a Details disclosure, such as the IP address or request id. */
  details?: AuditLogDetail[] | undefined
  /** Marks an event that removed or revoked something. Adds a danger tint to its icon. */
  tone?: "default" | "danger" | undefined
}

export type AuditLogFilter = {
  /** An actor id, or null for everyone. */
  actor?: string | null | undefined
  /** A category, or null for every category. */
  category?: string | null | undefined
}

export type AuditLogDay = {
  /** `YYYY-MM-DD` in the log's time zone. */
  key: string
  date: Date
  entries: AuditLogEntry[]
}

export type AuditLogLabels = {
  title: string
  count: (count: number) => string
  today: string
  yesterday: string
  justNow: string
  minutesAgo: (minutes: number) => string
  hoursAgo: (hours: number) => string
  notSet: string
  enabled: string
  disabled: string
  was: string
  now: string
  added: string
  removed: string
  details: string
  time: string
  showMoreChanges: (count: number) => string
  showFewerChanges: string
  everyone: string
  people: string
  allActivity: string
  categories: string
  loadMore: string
  loading: string
  empty: string
  emptyFiltered: string
  clearFilters: string
  system: string
  api: string
}
