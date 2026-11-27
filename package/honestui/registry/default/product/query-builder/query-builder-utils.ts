import type { FilterValue } from "../filter-bar/filter-bar-types"
import {
  OPERATOR_LABELS,
  getOperatorsFor,
  isValuelessOperator,
  resolveDefaultOperator,
} from "../filter-bar/filter-bar-utils"
import type {
  QueryBuilderLabels,
  QueryCombinator,
  QueryCondition,
  QueryField,
  QueryGroup,
  QueryNode,
} from "./query-builder-types"

/* -------------------------------------------------------------------------- */
/* Creating nodes                                                             */
/* -------------------------------------------------------------------------- */

let idCounter = 0

/** A fresh node id. Ids only need to be unique within one tree. */
export function createQueryId(): string {
  idCounter += 1
  return `q${Date.now().toString(36)}${idCounter.toString(36)}`
}

/** The value a new condition starts with, by field type and operator. */
export function getEmptyConditionValue(field: QueryField, operator: string): unknown {
  switch (field.type) {
    case "multi-select":
      return []
    case "number":
      return operator === "between" ? {} : null
    case "date-range":
      return {}
    case "boolean":
      return true
    case "select":
      return null
    default:
      return ""
  }
}

export function createQueryCondition(field: QueryField, id = createQueryId()): QueryCondition {
  const operator = resolveDefaultOperator(field)
  return { id, kind: "condition", field: field.key, operator, value: getEmptyConditionValue(field, operator) }
}

export function createQueryGroup(
  combinator: QueryCombinator = "and",
  children: QueryNode[] = [],
  id = createQueryId()
): QueryGroup {
  return { id, kind: "group", combinator, children }
}

/** Operators the builder offers for a field. Boolean drops "Any of", which matches everything. */
export function getQueryOperators(field: QueryField): string[] {
  const operators = getOperatorsFor(field)
  return field.type === "boolean" ? operators.filter((operator) => operator !== "any") : operators
}

/* -------------------------------------------------------------------------- */
/* Editing the tree                                                           */
/* -------------------------------------------------------------------------- */

/** Returns a new tree with the node `id` replaced by `update(node)`. */
export function updateQueryNode(
  root: QueryGroup,
  id: string,
  update: (node: QueryNode) => QueryNode
): QueryGroup {
  if (root.id === id) {
    const next = update(root)
    return next.kind === "group" ? next : root
  }
  return {
    ...root,
    children: root.children.map((child) => {
      if (child.id === id) return update(child)
      return child.kind === "group" ? updateQueryNode(child, id, update) : child
    }),
  }
}

/** Returns a new tree without the node `id`. The root cannot be removed. */
export function removeQueryNode(root: QueryGroup, id: string): QueryGroup {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => (child.kind === "group" ? removeQueryNode(child, id) : child)),
  }
}

/** Returns a new tree with `node` added to the group `groupId`, at the end unless `index` is given. */
export function insertQueryNode(root: QueryGroup, groupId: string, node: QueryNode, index?: number): QueryGroup {
  return updateQueryNode(root, groupId, (group) => {
    if (group.kind !== "group") return group
    const children = [...group.children]
    children.splice(index ?? children.length, 0, node)
    return { ...group, children }
  })
}

/** Finds a node and the group that holds it. */
export function findQueryNode(
  root: QueryGroup,
  id: string,
  parent: QueryGroup | null = null
): { node: QueryNode; parent: QueryGroup | null; depth: number } | null {
  if (root.id === id) return { node: root, parent, depth: 0 }
  for (const child of root.children) {
    if (child.id === id) return { node: child, parent: root, depth: 1 }
    if (child.kind === "group") {
      const found = findQueryNode(child, id, root)
      if (found) return { ...found, depth: found.depth + 1 }
    }
  }
  return null
}

export function countQuery(root: QueryGroup): { conditions: number; groups: number } {
  let conditions = 0
  let groups = 0
  for (const child of root.children) {
    if (child.kind === "condition") {
      conditions += 1
    } else {
      const nested = countQuery(child)
      conditions += nested.conditions
      groups += nested.groups + 1
    }
  }
  return { conditions, groups }
}

/* -------------------------------------------------------------------------- */
/* Completeness                                                               */
/* -------------------------------------------------------------------------- */

function hasValue(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === "string") return value.trim() !== ""
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "boolean") return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasValue)
  return true
}

/** Whether a condition has everything it needs to filter: a known field and a value. */
export function isQueryConditionComplete(condition: QueryCondition, fields: QueryField[]): boolean {
  const field = fields.find((candidate) => candidate.key === condition.field)
  if (!field) return false
  if (isValuelessOperator(condition.operator) || condition.operator === "any") return true
  return hasValue(condition.value)
}

/**
 * Drops incomplete conditions and groups left empty, and unwraps groups with
 * one child. Use it before sending a tree to a server.
 */
export function pruneQuery(root: QueryGroup, fields: QueryField[]): QueryGroup {
  const children: QueryNode[] = []
  for (const child of root.children) {
    if (child.kind === "condition") {
      if (isQueryConditionComplete(child, fields)) children.push(child)
      continue
    }
    const pruned = pruneQuery(child, fields)
    if (pruned.children.length === 1) children.push(pruned.children[0])
    else if (pruned.children.length > 1) children.push(pruned)
  }
  return { ...root, children }
}

/* -------------------------------------------------------------------------- */
/* Filter Bar conversion                                                      */
/* -------------------------------------------------------------------------- */

function pad(value: number) {
  return String(value).padStart(2, "0")
}

/** A local date as `YYYY-MM-DD`. */
export function toQueryDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** A `YYYY-MM-DD` string as a local date, or `undefined`. */
export function fromQueryDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value !== "string") return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return undefined
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function dateToQuery(value: unknown): string {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? toQueryDate(value) : typeof value === "string" ? value : ""
}

/**
 * Filter Bar values as a query: one "and" group with a condition per filter.
 * Dates become `YYYY-MM-DD` strings.
 */
export function filtersToQuery(values: FilterValue[], fields: QueryField[]): QueryGroup {
  const children: QueryNode[] = []
  for (const entry of values) {
    const field = fields.find((candidate) => candidate.key === entry.key)
    if (!field) continue
    const operator = entry.operator ?? resolveDefaultOperator(field)
    let value = entry.value
    if (field.type === "date") value = dateToQuery(value)
    if (field.type === "date-range") {
      const range = (value ?? {}) as { from?: unknown; to?: unknown }
      value = {
        ...(range.from ? { from: dateToQuery(range.from) } : {}),
        ...(range.to ? { to: dateToQuery(range.to) } : {}),
      }
    }
    children.push({ id: createQueryId(), kind: "condition", field: entry.key, operator, value })
  }
  return createQueryGroup("and", children)
}

/**
 * The query as Filter Bar values, when it can be written that way: only "and",
 * no nested groups, and one condition per field. Returns `null` otherwise, so
 * the interface can keep the advanced view open instead of losing conditions.
 */
export function queryToFilters(root: QueryGroup, fields: QueryField[]): FilterValue[] | null {
  const pruned = pruneQuery(root, fields)
  if (pruned.children.length > 1 && pruned.combinator !== "and") return null

  const seen = new Set<string>()
  const values: FilterValue[] = []
  for (const child of pruned.children) {
    if (child.kind !== "condition" || seen.has(child.field)) return null
    seen.add(child.field)
    const field = fields.find((candidate) => candidate.key === child.field)
    let value = child.value
    if (field?.type === "date") value = fromQueryDate(value)
    if (field?.type === "date-range") {
      const range = (value ?? {}) as { from?: unknown; to?: unknown }
      value = { from: fromQueryDate(range.from), to: fromQueryDate(range.to) }
    }
    values.push({ key: child.field, operator: child.operator, value })
  }
  return values
}

/* -------------------------------------------------------------------------- */
/* Evaluating                                                                 */
/* -------------------------------------------------------------------------- */

function toComparableDate(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toQueryDate(value)
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return null
}

function isEmptyRecordValue(value: unknown) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0)
}

function matchesCondition(record: Record<string, unknown>, condition: QueryCondition, field: QueryField): boolean {
  const actual = record[condition.field]
  const { operator, value } = condition

  if (operator === "is-empty") return isEmptyRecordValue(actual)
  if (operator === "is-not-empty") return !isEmptyRecordValue(actual)
  if (operator === "any") return true

  switch (field.type) {
    case "text": {
      const haystack = String(actual ?? "").toLocaleLowerCase()
      const needle = String(value ?? "").toLocaleLowerCase()
      switch (operator) {
        case "contains":
          return haystack.includes(needle)
        case "does-not-contain":
          return !haystack.includes(needle)
        case "is":
          return haystack === needle
        case "is-not":
          return haystack !== needle
        case "starts-with":
          return haystack.startsWith(needle)
        case "ends-with":
          return haystack.endsWith(needle)
        default:
          return true
      }
    }
    case "select":
    case "multi-select": {
      const wanted = (Array.isArray(value) ? value : [value]).map(String)
      const present = (Array.isArray(actual) ? actual : [actual]).map(String)
      const hit = present.some((entry) => wanted.includes(entry))
      return operator === "is-not" ? !hit : hit
    }
    case "number": {
      const number = typeof actual === "number" ? actual : Number(actual)
      if (!Number.isFinite(number)) return false
      if (operator === "between") {
        const range = (value ?? {}) as { min?: number | null; max?: number | null }
        return (range.min == null || number >= range.min) && (range.max == null || number <= range.max)
      }
      const target = Number(value)
      switch (operator) {
        case "equals":
          return number === target
        case "not-equals":
          return number !== target
        case "greater-than":
          return number > target
        case "greater-than-or-equal":
          return number >= target
        case "less-than":
          return number < target
        case "less-than-or-equal":
          return number <= target
        default:
          return true
      }
    }
    case "date": {
      const day = toComparableDate(actual)
      const target = toComparableDate(value)
      if (!day || !target) return false
      if (operator === "before") return day < target
      if (operator === "after") return day > target
      return day === target
    }
    case "date-range": {
      const day = toComparableDate(actual)
      if (!day) return false
      const range = (value ?? {}) as { from?: unknown; to?: unknown }
      const from = toComparableDate(range.from)
      const to = toComparableDate(range.to)
      return (!from || day >= from) && (!to || day <= to)
    }
    case "boolean": {
      const matches = Boolean(actual) === Boolean(value)
      return operator === "is" ? matches : true
    }
    default:
      return String(actual ?? "") === String(value ?? "")
  }
}

/**
 * Whether a record passes the query. Incomplete conditions and empty groups
 * are skipped, so a half-written condition never hides every row.
 */
export function matchesQuery(record: Record<string, unknown>, root: QueryGroup, fields: QueryField[]): boolean {
  const results: boolean[] = []
  for (const child of root.children) {
    if (child.kind === "group") {
      if (countQuery(pruneQuery(child, fields)).conditions === 0) continue
      results.push(matchesQuery(record, child, fields))
      continue
    }
    const field = fields.find((candidate) => candidate.key === child.field)
    if (!field || !isQueryConditionComplete(child, fields)) continue
    results.push(matchesCondition(record, child, field))
  }
  if (results.length === 0) return true
  return root.combinator === "and" ? results.every(Boolean) : results.some(Boolean)
}

/* -------------------------------------------------------------------------- */
/* Describing                                                                 */
/* -------------------------------------------------------------------------- */

function optionLabel(field: QueryField, value: unknown) {
  return field.options?.find((option) => String(option.value) === String(value))?.label ?? String(value)
}

function describeValue(field: QueryField, condition: QueryCondition, labels: QueryBuilderLabels): string {
  const { value, operator } = condition
  switch (field.type) {
    case "select":
      return optionLabel(field, value)
    case "multi-select":
      return (Array.isArray(value) ? value : [value]).map((entry) => optionLabel(field, entry)).join(", ")
    case "number": {
      const prefix = field.meta?.prefix ?? ""
      const suffix = field.meta?.suffix ?? ""
      if (operator === "between") {
        const range = (value ?? {}) as { min?: number; max?: number }
        return `${prefix}${range.min ?? "…"}${suffix}–${prefix}${range.max ?? "…"}${suffix}`
      }
      return `${prefix}${String(value)}${suffix}`
    }
    case "date-range": {
      const range = (value ?? {}) as { from?: string; to?: string }
      return `${range.from ?? "…"}–${range.to ?? "…"}`
    }
    case "boolean":
      return value ? labels.yes : labels.no
    default:
      return String(value ?? "")
  }
}

/**
 * A one-line reading of the query, such as
 * `Status is Active and (Amount greater than 500 or Region is EMEA)`.
 * Incomplete conditions are left out.
 */
export function formatQuery(
  root: QueryGroup,
  fields: QueryField[],
  labels: Pick<QueryBuilderLabels, "combinators" | "operatorLabels" | "yes" | "no"> = defaultQueryBuilderLabels
): string {
  const pruned = pruneQuery(root, fields)
  const parts = pruned.children.map((child) => {
    if (child.kind === "group") return `(${formatQuery(child, fields, labels)})`
    const field = fields.find((candidate) => candidate.key === child.field)
    if (!field) return ""
    const operator = (
      (field.type === "multi-select" ? labels.operatorLabels[`multi-${child.operator}`] : undefined) ??
      labels.operatorLabels[child.operator] ??
      child.operator
    ).toLocaleLowerCase()
    if (isValuelessOperator(child.operator)) return `${field.label} ${operator}`
    return `${field.label} ${operator} ${describeValue(field, child, labels as QueryBuilderLabels)}`
  })
  return parts.filter(Boolean).join(` ${labels.combinators[pruned.combinator]} `)
}

export const defaultQueryBuilderLabels: QueryBuilderLabels = {
  where: "Where",
  combinators: { and: "and", or: "or" },
  combinatorLabel: (path) => (path ? `How group ${path} joins its conditions` : "How the conditions join"),
  group: ({ path, combinator }) => `Group ${path}, match ${combinator === "and" ? "all" : "any"}`,
  rootGroup: (combinator) => `Conditions, match ${combinator === "and" ? "all" : "any"}`,
  condition: (path) => `Condition ${path}`,
  field: (path) => `Field for condition ${path}`,
  operator: (path) => `Operator for condition ${path}`,
  value: (path) => `Value for condition ${path}`,
  rangeFrom: (path) => `From value for condition ${path}`,
  rangeTo: (path) => `To value for condition ${path}`,
  valuePlaceholder: "Enter a value",
  choosePlaceholder: "Choose…",
  yes: "Yes",
  no: "No",
  addCondition: "Add condition",
  addGroup: "Add group",
  removeCondition: (path) => `Remove condition ${path}`,
  removeGroup: (path) => `Remove group ${path}`,
  empty: "No conditions. Every row matches.",
  summary: ({ conditions, groups }) => {
    const conditionText = conditions === 1 ? "1 condition" : `${conditions} conditions`
    if (groups === 0) return conditionText
    return `${conditionText} in ${groups === 1 ? "1 group" : `${groups} groups`}`
  },
  operatorLabels: { ...OPERATOR_LABELS, "multi-is": "Is any of", "multi-is-not": "Is none of" },
}
