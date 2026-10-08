import type * as React from "react"

export type ChangeReviewStatus = "added" | "removed" | "changed" | "unchanged"

export type ChangeReviewDecision = "accepted" | "rejected"

/** Decisions keyed by change id. A change without an entry is undecided. */
export type ChangeReviewDecisions = Record<string, ChangeReviewDecision>

type ChangeReviewFieldBase = {
  /** Dot path into both objects, such as `billing.email`. Also the change id. */
  key: string
  label: string
}

export type ChangeReviewValueField = ChangeReviewFieldBase & {
  type?: "value" | "boolean"
  /** Display for one side of the change. Receives the raw value. */
  render?: ((value: unknown) => React.ReactNode) | undefined
  /** Replaces the structural comparison, for values such as trimmed text. */
  isEqual?: ((before: unknown, after: unknown) => boolean) | undefined
}

export type ChangeReviewListField = ChangeReviewFieldBase & {
  type: "list"
  /** Property name or function that identifies an item across both lists. */
  itemKey?: string | ((item: never) => string) | undefined
  itemLabel?: ((item: never) => React.ReactNode) | undefined
}

export type ChangeReviewField = ChangeReviewValueField | ChangeReviewListField

export type ChangeReviewFieldGroup = {
  group: string
  fields: ChangeReviewFieldNode[]
}

export type ChangeReviewFieldNode = ChangeReviewField | ChangeReviewFieldGroup

type ChangeReviewChangeBase = {
  id: string
  label: string
  /** Group labels from the outermost inward. */
  groups?: string[] | undefined
  /** Set when the comparison is already known; derived from the values otherwise. */
  status?: ChangeReviewStatus | undefined
}

export type ChangeReviewValueChange = ChangeReviewChangeBase & {
  kind?: "value" | undefined
  type?: "value" | "boolean" | undefined
  before?: unknown
  after?: unknown
  render?: ((value: unknown) => React.ReactNode) | undefined
}

export type ChangeReviewListChange = ChangeReviewChangeBase & {
  kind: "list"
  added: unknown[]
  removed: unknown[]
  /** Items present on both sides whose contents differ. */
  changed?: unknown[] | undefined
  itemLabel?: ((item: never) => React.ReactNode) | undefined
}

export type ChangeReviewChange = ChangeReviewValueChange | ChangeReviewListChange

export type ChangeReviewGroupNode = {
  label: string
  /** Stable within one review; built from the group path. */
  id: string
  changes: ChangeReviewChange[]
  groups: ChangeReviewGroupNode[]
}

export type ChangeReviewCounts = {
  total: number
  changed: number
  accepted: number
  rejected: number
  undecided: number
}

export type ChangeReviewLabels = {
  notSet: string
  enabled: string
  disabled: string
  noChange: string
  /** Read before the old value by screen readers. */
  was: string
  /** Read before the new value by screen readers. */
  now: string
  added: string
  removed: string
  changed: string
  changedOnly: string
  accept: string
  reject: string
  acceptAll: string
  rejectAll: string
  empty: string
  emptyFiltered: string
  summary: (counts: { changed: number; total: number }) => string
  decisionSummary: (counts: { accepted: number; rejected: number; undecided: number }) => string
  listSummary: (counts: { added: number; removed: number; changed: number }) => string
  acceptChange: (label: string) => string
  rejectChange: (label: string) => string
  showMore: (count: number) => string
  showFewer: string
}

export type ChangeReviewControllerValue = {
  changes: ChangeReviewChange[]
  visibleChanges: ChangeReviewChange[]
  counts: ChangeReviewCounts
  /** True when some fields did not change, so the filter has something to hide. */
  hasUnchanged: boolean
  changedOnly: boolean
  setChangedOnly: (changedOnly: boolean) => void
  /** True when the application handles decisions, so the controls are shown. */
  canDecide: boolean
  disabled: boolean
  decisions: ChangeReviewDecisions
  /** Pass `null` to return a change to undecided. */
  decide: (id: string, decision: ChangeReviewDecision | null) => void
  decideAll: (decision: ChangeReviewDecision) => void
  labels: ChangeReviewLabels
  renderValue: ((value: unknown, change: ChangeReviewValueChange) => React.ReactNode) | undefined
  maxListItems: number
}
