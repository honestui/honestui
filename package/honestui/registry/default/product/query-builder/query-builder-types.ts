import type { FilterDefinition } from "../filter-bar/filter-bar-types"

export type { FilterDefinition, FilterOperator, FilterOption, FilterType, FilterValue } from "../filter-bar/filter-bar-types"

/** How a group joins its children: every one must match, or any one may. */
export type QueryCombinator = "and" | "or"

/**
 * One rule. `value` follows Filter Bar's shapes, except that dates are
 * `YYYY-MM-DD` strings so the whole tree stays JSON-serializable:
 * - text: `string`
 * - select: `string | number`
 * - multi-select: `(string | number)[]`
 * - number: `number`, or `{ min?, max? }` for `between`
 * - date: `string`
 * - date-range: `{ from?: string; to?: string }`
 * - boolean: `boolean`
 */
export type QueryCondition = {
  id: string
  kind: "condition"
  /** Key of a field definition. */
  field: string
  operator: string
  value: unknown
}

export type QueryGroup = {
  id: string
  kind: "group"
  combinator: QueryCombinator
  children: QueryNode[]
}

export type QueryNode = QueryCondition | QueryGroup

/** The fields a condition can test. Filter Bar's definitions work unchanged. */
export type QueryField = FilterDefinition

export type QueryBuilderLabels = {
  /** Text before the first condition in a group. */
  where: string
  combinators: Record<QueryCombinator, string>
  /** Accessible name of the select that switches a group between and and or. */
  combinatorLabel: (path: string) => string
  /** Accessible name of a group, such as "Group 2, match any". */
  group: (details: { path: string; combinator: QueryCombinator }) => string
  rootGroup: (combinator: QueryCombinator) => string
  condition: (path: string) => string
  field: (path: string) => string
  operator: (path: string) => string
  value: (path: string) => string
  rangeFrom: (path: string) => string
  rangeTo: (path: string) => string
  valuePlaceholder: string
  choosePlaceholder: string
  yes: string
  no: string
  addCondition: string
  addGroup: string
  removeCondition: (path: string) => string
  removeGroup: (path: string) => string
  empty: string
  /** Status read after a condition or group is added or removed. */
  summary: (counts: { conditions: number; groups: number }) => string
  operatorLabels: Record<string, string>
}
