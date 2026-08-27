import type * as React from "react"

export type FilterType =
  | "text"
  | "select"
  | "multi-select"
  | "number"
  | "date"
  | "date-range"
  | "boolean"
  | "custom"

export type TextOperator =
  | "contains"
  | "does-not-contain"
  | "is"
  | "is-not"
  | "starts-with"
  | "ends-with"
  | "is-empty"
  | "is-not-empty"

export type SelectOperator = "is" | "is-not"

export type NumberOperator =
  | "equals"
  | "not-equals"
  | "greater-than"
  | "greater-than-or-equal"
  | "less-than"
  | "less-than-or-equal"
  | "between"
  | "is-empty"
  | "is-not-empty"

export type DateOperator = "on" | "before" | "after"

export type BooleanOperator = "is" | "any"

export type FilterOperator =
  | TextOperator
  | SelectOperator
  | NumberOperator
  | DateOperator
  | BooleanOperator

/**
 * One active filter. This is Filter Bar UI state; applications transform it
 * into their own query shape for tables, URLs, or APIs.
 */
export interface FilterValue {
  key: string
  operator?: string
  value: unknown
}

/** One choice inside a select, multi-select, radio, or checkbox list. */
export interface FilterOption {
  label: string
  /** Use strings or numbers so defaults like chips and forms stay simple. */
  value: string | number
  count?: number
  disabled?: boolean
}

export interface FilterTextMeta {
  placeholder?: string
}

export interface FilterNumberMeta {
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  /** Rough number formatting controls forwarded to NumberField. */
  maximumFractionDigits?: number
}

export interface FilterDateRangePreset {
  label: string
  value: () => { from: Date; to?: Date }
}

export interface FilterDefinition {
  key: string
  label: string
  type: FilterType
  /** Operators follow each type's documented order. */
  operators?: FilterOperator[]
  options?: FilterOption[]
  /** Turns on search below this many options too. */
  searchable?: boolean
  /** Options may change after other selections do. */
  disabled?: boolean
  /** Explain why a disabled filter cannot be used yet. */
  disabledReason?: string
  defaultOperator?: string
  /** Replaces the automatic chip text for one filter. */
  formatValue?: (value: unknown) => string
  /** Lower sorts earlier in the panel and among initial values. */
  priority?: number
  placeholder?: string
  /** Extra settings passed straight to the matching control. */
  meta?: FilterTextMeta &
    FilterNumberMeta & {
      datePresets?: FilterDateRangePreset[]
      /** "switch" hides yes/no uncertainty behind one toggle. */
      booleanStyle?: "radio" | "switch"
    }
  /** Loads server-backed options. Provide your own debounce when needed. */
  loadOptions?: (query: string) => Promise<FilterOption[]>
  /** Renders controls for values outside the built-in types. */
  render?: FilterCustomRenderer
}

export interface FilterRenderProps {
  value: unknown
  operator?: string
  onChange: (value: unknown) => void
  clear: () => void
  disabled: boolean
  definition: FilterDefinition
  /** Connect the custom control to Filter Bar's field label. */
  labelId: string
  /** Connect the custom control to its disabled explanation when present. */
  descriptionId?: string
}

type FilterCustomRenderer = (props: FilterRenderProps) => React.ReactNode
