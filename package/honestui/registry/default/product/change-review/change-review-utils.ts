import type {
  ChangeReviewChange,
  ChangeReviewCounts,
  ChangeReviewDecision,
  ChangeReviewDecisions,
  ChangeReviewFieldNode,
  ChangeReviewGroupNode,
  ChangeReviewLabels,
  ChangeReviewListChange,
  ChangeReviewListField,
  ChangeReviewStatus,
} from "./change-review-types"

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object") return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Reads a dot path such as `billing.email`; missing steps read as undefined. */
export function getValueAtPath(source: unknown, path: string): unknown {
  let current = source
  for (const segment of path.split(".")) {
    if (current === null || current === undefined) return undefined
    current = (current as PlainObject)[segment]
  }
  return current
}

/** Returns a copy of `source` with `path` set, sharing every untouched branch. */
export function setValueAtPath<T>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".")
  const base: PlainObject = isPlainObject(source) ? { ...source } : {}
  base[head] = rest.length === 0 ? value : setValueAtPath(base[head], rest.join("."), value)
  return base as T
}

/** A field with no value on one side reads as added or removed, not changed. */
export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === ""
}

export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && isDeepEqual(a[key], b[key]))
    )
  }
  return false
}

function toList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  return isEmptyValue(value) ? [] : [value]
}

function listItemKey(item: unknown, itemKey: ChangeReviewListField["itemKey"]): string {
  if (typeof itemKey === "function") return itemKey(item as never)
  if (typeof itemKey === "string") return String((item as PlainObject | null)?.[itemKey])
  return typeof item === "string" ? item : JSON.stringify(item)
}

/**
 * Matches items by key. An item on both sides whose contents differ is
 * reported as changed, so equal membership is never mistaken for no change.
 */
export function compareLists(
  before: unknown,
  after: unknown,
  itemKey?: ChangeReviewListField["itemKey"]
): Pick<ChangeReviewListChange, "added" | "removed" | "changed"> {
  const beforeByKey = new Map(toList(before).map((item) => [listItemKey(item, itemKey), item]))
  const afterKeys = new Set<string>()
  const added: unknown[] = []
  const changed: unknown[] = []

  for (const item of toList(after)) {
    const key = listItemKey(item, itemKey)
    afterKeys.add(key)
    if (!beforeByKey.has(key)) added.push(item)
    else if (!isDeepEqual(beforeByKey.get(key), item)) changed.push(item)
  }

  const removed = [...beforeByKey].filter(([key]) => !afterKeys.has(key)).map(([, item]) => item)
  return { added, removed, changed }
}

export function getChangeStatus(change: ChangeReviewChange): ChangeReviewStatus {
  if (change.status) return change.status

  if (change.kind === "list") {
    const size = change.added.length + change.removed.length + (change.changed?.length ?? 0)
    return size === 0 ? "unchanged" : "changed"
  }

  if (isDeepEqual(change.before, change.after)) return "unchanged"
  const hadValue = !isEmptyValue(change.before)
  const hasValue = !isEmptyValue(change.after)
  if (!hadValue && !hasValue) return "unchanged"
  if (!hadValue) return "added"
  if (!hasValue) return "removed"
  return "changed"
}

/** Compares two versions of an object, one entry per field, in field order. */
export function getChanges(
  before: unknown,
  after: unknown,
  fields: ChangeReviewFieldNode[],
  groups: string[] = []
): ChangeReviewChange[] {
  return fields.flatMap((field): ChangeReviewChange[] => {
    if ("group" in field) {
      return getChanges(before, after, field.fields, [...groups, field.group])
    }

    const base = { id: field.key, label: field.label, groups: groups.length ? groups : undefined }
    const previous = getValueAtPath(before, field.key)
    const next = getValueAtPath(after, field.key)

    if (field.type === "list") {
      return [
        {
          ...base,
          kind: "list",
          ...compareLists(previous, next, field.itemKey),
          itemLabel: field.itemLabel,
        },
      ]
    }

    const change: ChangeReviewChange = {
      ...base,
      type: field.type,
      before: previous,
      after: next,
      render: field.render,
    }
    // A custom comparison can call two different raw values the same.
    if (field.isEqual?.(previous, next)) change.status = "unchanged"
    return [change]
  })
}

export function countChanges(
  changes: ChangeReviewChange[],
  decisions: ChangeReviewDecisions
): ChangeReviewCounts {
  const counts: ChangeReviewCounts = {
    total: changes.length,
    changed: 0,
    accepted: 0,
    rejected: 0,
    undecided: 0,
  }

  for (const change of changes) {
    if (getChangeStatus(change) === "unchanged") continue
    counts.changed += 1
    const decision = decisions[change.id]
    if (decision === "accepted") counts.accepted += 1
    else if (decision === "rejected") counts.rejected += 1
    else counts.undecided += 1
  }

  return counts
}

/** Sets one decision on every change that actually changed. */
export function decideAllChanges(
  changes: ChangeReviewChange[],
  decision: ChangeReviewDecision
): ChangeReviewDecisions {
  const decisions: ChangeReviewDecisions = {}
  for (const change of changes) {
    if (getChangeStatus(change) !== "unchanged") decisions[change.id] = decision
  }
  return decisions
}

/**
 * Builds the object an approval produces: `before`, with each accepted field
 * taken from `after`. Rejected and undecided fields keep their `before` value.
 * Decision ids are field keys, so this applies to reviews built from `fields`.
 */
export function applyAcceptedChanges<T>(before: T, after: T, decisions: ChangeReviewDecisions): T {
  let result = before
  for (const [key, decision] of Object.entries(decisions)) {
    if (decision === "accepted") {
      result = setValueAtPath(result, key, getValueAtPath(after, key))
    }
  }
  return result
}

/** Nests changes under their group labels, keeping the order they arrived in. */
export function groupChanges(changes: ChangeReviewChange[]): ChangeReviewGroupNode {
  const root: ChangeReviewGroupNode = { label: "", id: "root", changes: [], groups: [] }

  for (const change of changes) {
    let node = root
    for (const label of change.groups ?? []) {
      let child = node.groups.find((group) => group.label === label)
      if (!child) {
        child = { label, id: `${node.id}/${label}`, changes: [], groups: [] }
        node.groups.push(child)
      }
      node = child
    }
    node.changes.push(change)
  }

  return root
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export const defaultChangeReviewLabels: ChangeReviewLabels = {
  notSet: "Not set",
  enabled: "Enabled",
  disabled: "Disabled",
  noChange: "No change",
  was: "Was",
  now: "now",
  added: "Added",
  removed: "Removed",
  changed: "Changed",
  changedOnly: "Changed fields only",
  accept: "Accept",
  reject: "Reject",
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  empty: "There are no fields to review.",
  emptyFiltered: "Nothing changed.",
  summary: ({ changed, total }) =>
    changed === total
      ? plural(changed, "change", "changes")
      : `${plural(changed, "change", "changes")} in ${plural(total, "field", "fields")}`,
  decisionSummary: ({ accepted, rejected, undecided }) =>
    `${accepted} accepted, ${rejected} rejected, ${undecided} undecided`,
  listSummary: ({ added, removed, changed }) =>
    [
      added ? `${added} added` : "",
      removed ? `${removed} removed` : "",
      changed ? `${changed} changed` : "",
    ]
      .filter(Boolean)
      .join(", "),
  acceptChange: (label) => `Accept change to ${label}`,
  rejectChange: (label) => `Reject change to ${label}`,
  showMore: (count) => `Show ${count} more`,
  showFewer: "Show fewer",
}
