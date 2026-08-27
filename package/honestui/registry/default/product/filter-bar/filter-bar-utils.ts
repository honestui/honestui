import type {
  FilterDefinition,
  FilterOperator,
  FilterType,
  FilterValue,
} from "./filter-bar-types"

export const OPERATOR_LABELS: Record<string, string> = {
  contains: "Contains",
  "does-not-contain": "Does not contain",
  is: "Is",
  "is-not": "Is not",
  "starts-with": "Starts with",
  "ends-with": "Ends with",
  "is-empty": "Is empty",
  "is-not-empty": "Is not empty",
  equals: "Equals",
  "not-equals": "Does not equal",
  "greater-than": "Greater than",
  "greater-than-or-equal": "Greater than or equal",
  "less-than": "Less than",
  "less-than-or-equal": "Less than or equal",
  between: "Between",
  on: "On",
  before: "Before",
  after: "After",
  any: "Any of",
}

const DEFAULT_OPERATORS: Record<FilterType, FilterOperator[]> = {
  text: ["contains", "does-not-contain", "is", "is-not", "starts-with", "ends-with", "is-empty", "is-not-empty"],
  select: ["is", "is-not"],
  "multi-select": ["is"],
  number: [
    "equals",
    "not-equals",
    "greater-than",
    "greater-than-or-equal",
    "less-than",
    "less-than-or-equal",
    "between",
    "is-empty",
    "is-not-empty",
  ],
  date: ["on", "before", "after"],
  "date-range": ["between"],
  boolean: ["is"],
  custom: ["is"],
}

export function getDefaultOperators(type: FilterType) {
  return DEFAULT_OPERATORS[type] ?? ["is"]
}

export function getOperatorsFor(
  definition: FilterDefinition
): FilterOperator[] {
  if (definition.operators && definition.operators.length > 0) {
    return definition.operators
  }

  return getDefaultOperators(definition.type)
}

export function resolveDefaultOperator(definition: FilterDefinition) {
  const operators = getOperatorsFor(definition)

  if (definition.defaultOperator && operators.includes(definition.defaultOperator as FilterOperator)) {
    return definition.defaultOperator
  }

  return operators[0]
}

/** Operators where the selected rule carries the meaning on its own. */
export function isValuelessOperator(operator: string | undefined) {
  return operator === "is-empty" || operator === "is-not-empty"
}

export function needsTwoValues(operator: string | undefined) {
  return operator === "between"
}

export interface ResolvedDateRange {
  from?: Date
  to?: Date
}

function startOfDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isSameDay(a: Date | undefined, b: Date | undefined) {
  if (!a || !b) return false

  const aDay = startOfDate(a).getTime()
  const bDay = startOfDate(b).getTime()

  return aDay === bDay
}

/**
 * Matches committed ranges against known presets so chips can read
 * "Last 30 days" instead of two raw dates.
 */
export function matchDatePresets(
  range: ResolvedDateRange,
  presets: Array<{ label: string; value: () => ResolvedDateRange }>
) {
  if (!range.from || !range.to) return undefined

  for (const preset of presets) {
    const candidate = preset.value()

    if (
      candidate.from &&
      candidate.to &&
      isSameDay(candidate.from, range.from) &&
      isSameDay(candidate.to, range.to)
    ) {
      return preset.label
    }
  }

  return undefined
}

const numberFormatCache = new Map<number, Intl.NumberFormat>()

function formatNumberForDisplay(input: number, fractionDigits?: number) {
  if (Number.isInteger(input)) {
    return String(input)
  }

  const digits = fractionDigits ?? 2
  let formatter = numberFormatCache.get(digits)

  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: digits,
    })
    numberFormatCache.set(digits, formatter)
  }

  return formatter.format(input)
}

function formatOptionLabels(definition: FilterDefinition, values: unknown[]) {
  const labels = new Map(
    (definition.options ?? []).map((option) => [String(option.value), option.label])
  )

  return values
    .map((value) =>
      value == null ? "" : labels.get(String(value)) ?? String(value)
    )
    .filter(Boolean)
}

/** Restores the public option value after string-only UI primitives select it. */
export function resolveFilterOptionValue(
  definition: Pick<FilterDefinition, "options">,
  key: string
): string | number {
  return (
    definition.options?.find((option) => String(option.value) === key)?.value ??
    key
  )
}

function formatMultiSelectLabels(labels: string[]) {
  if (labels.length <= 3) return labels.join(", ")

  return `${labels[0]} +${labels.length - 1}`
}

export interface FilterNumberDisplayContext {
  meta?: { prefix?: string; suffix?: string; maximumFractionDigits?: number }
}

function formatNumberTerm(
  amount: unknown,
  context: FilterNumberDisplayContext
) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return ""

  const { prefix = "", suffix = "", maximumFractionDigits } =
    context.meta ?? {}

  return `${prefix}${formatNumberForDisplay(amount, maximumFractionDigits)}${suffix}`
}

function formatNumericPhrase(
  definition: FilterDefinition,
  operator: string,
  value: unknown,
  context: FilterNumberDisplayContext
) {
  const term = formatNumberTerm(value, context)

  if (!term) return ""

  switch (operator) {
    case "greater-than":
      return `Over ${term}`
    case "less-than":
      return `Under ${term}`
    case "greater-than-or-equal":
      return `${term} or higher`
    case "less-than-or-equal":
      return `${term} or lower`
    case "not-equals":
      return `Not ${term}`
    default:
      return term
  }
}

function compactDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

/** Returns the readable text shown inside an active filter chip. */
export function formatFilterValueText(
  definition: FilterDefinition,
  filterValue: FilterValue
): string {
  const operator = filterValue.operator ?? resolveDefaultOperator(definition)

  if (isValuelessOperator(operator)) {
    return OPERATOR_LABELS[operator] ?? operator
  }

  if (definition.formatValue) {
    return definition.formatValue(filterValue.value)
  }

  switch (definition.type) {
    case "text": {
      return typeof filterValue.value === "string" ? filterValue.value : ""
    }
    case "select": {
      return formatOptionLabels(definition, [filterValue.value]).join("") ||
        (filterValue.value == null ? "" : String(filterValue.value))
    }
    case "multi-select": {
      const values = Array.isArray(filterValue.value)
        ? filterValue.value
        : [filterValue.value]

      return formatMultiSelectLabels(formatOptionLabels(definition, values))
    }
    case "number": {
      if (operator === "between" && typeof filterValue.value === "object") {
        const range = filterValue.value as { min?: number; max?: number }
        const min = formatNumberTerm(range.min, { meta: definition.meta })
        const max = formatNumberTerm(range.max, { meta: definition.meta })

        if (min && max) return `${min} to ${max}`

        return min || max
      }

      return formatNumericPhrase(definition, operator, filterValue.value, {
        meta: definition.meta,
      })
    }
    case "date": {
      if (filterValue.value instanceof Date && !isNaN(filterValue.value.getTime())) {
        return filterValue.value.toLocaleDateString()
      }

      return typeof filterValue.value === "string"
        ? filterValue.value
        : ""
    }
    case "date-range": {
      const range = filterValue.value as ResolvedDateRange

      if (!range?.from && !range?.to) return ""

      const presets = definition.meta?.datePresets ?? []
      const presetLabel = matchDatePresets(range, presets)

      if (presetLabel) return presetLabel

      const parts = [
        range.from ? compactDate(range.from) : "",
        range.to ? compactDate(range.to) : "",
      ].filter(Boolean)

      return parts.join(" to ")
    }
    case "boolean": {
      if (filterValue.value === true) return "Yes"
      if (filterValue.value === false) return "No"

      return ""
    }
    default: {
      if (typeof filterValue.value === "string") return filterValue.value
      if (Array.isArray(filterValue.value)) {
        return filterValue.value.map(String).join(", ")
      }
      if (filterValue.value == null) return ""

      return String(filterValue.value)
    }
  }
}

export interface FilterDefinitionMap {
  get(key: string): FilterDefinition | undefined
}

export function createFilterDefinitionMap(
  definitions: FilterDefinition[]
): FilterDefinitionMap & { ordered(): FilterDefinition[] } {
  const byKey = new Map(definitions.map((definition) => [definition.key, definition]))
  const orderedDefinitions = [...definitions].sort((a, b) => {
    const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER
    const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER

    return priorityA - priorityB
  })

  return {
    get: (key) => byKey.get(key),
    ordered: () => orderedDefinitions,
  }
}

function findFilterEntry(
  values: FilterValue[],
  key: string
): FilterValue | undefined {
  return values.find((entry) => entry.key === key)
}

export { findFilterEntry as getFilterEntry }

function normalizeBoolean(
  definition: FilterDefinition,
  value: unknown
): boolean {
  return !(definition.type === "boolean" && value === false)
}

function hasMeaningfulScalarValue(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === "string") return value.trim() !== ""
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  if (value instanceof Date) return !isNaN(value.getTime())
  if (typeof value === "object") {
    const record = value as Record<string, unknown>

    return Object.values(record).some(hasMeaningfulScalarValue)
  }

  return Boolean(value)
}

/**
 * Whether one entry counts as active. Switch-style boolean filters stay
 * active while present so turning the switch off keeps its meaning.
 */
export function isActiveFilterValue(
  definition: FilterDefinition | undefined,
  entry: FilterValue | undefined
): boolean {
  if (!definition || !entry) return false

  if (isValuelessOperator(entry.operator)) return true

  if (normalizeBoolean(definition, entry.value)) {
    return hasMeaningfulScalarValue(entry.value)
  }

  return true
}

export function getActiveFilterValues(
  values: FilterValue[],
  definitions: Iterable<FilterDefinition>
) {
  const map = createFilterDefinitionMap([...definitions])

  return values.filter((entry) => isActiveFilterValue(map.get(entry.key), entry))
}

/** The trigger count counts active fields, never selected options. */
export function getActiveFilterCount(values: FilterValue[], definitions: Iterable<FilterDefinition>) {
  return getActiveFilterValues(values, definitions).length
}
