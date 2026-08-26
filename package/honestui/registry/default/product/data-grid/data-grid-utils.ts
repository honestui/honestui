import type { Row } from "@tanstack/react-table"

import type {
  DataGridFilterType,
  DataGridFilterValue,
} from "./data-grid-context"

export const DATA_GRID_FILTER_OPERATORS: Record<
  DataGridFilterType,
  Array<{ value: string; label: string; needsValue: boolean; needsSecondValue?: boolean }>
> = {
  text: [
    { value: "contains", label: "contains", needsValue: true },
    { value: "not-contains", label: "does not contain", needsValue: true },
    { value: "is", label: "is", needsValue: true },
    { value: "is-not", label: "is not", needsValue: true },
    { value: "starts-with", label: "starts with", needsValue: true },
    { value: "ends-with", label: "ends with", needsValue: true },
    { value: "is-empty", label: "is empty", needsValue: false },
    { value: "is-not-empty", label: "is not empty", needsValue: false },
  ],
  number: [
    { value: "equals", label: "equals", needsValue: true },
    { value: "not-equal", label: "does not equal", needsValue: true },
    { value: "greater-than", label: "is greater than", needsValue: true },
    { value: "greater-than-or-equal", label: "is at least", needsValue: true },
    { value: "less-than", label: "is less than", needsValue: true },
    { value: "less-than-or-equal", label: "is at most", needsValue: true },
    { value: "between", label: "is between", needsValue: true, needsSecondValue: true },
    { value: "is-empty", label: "is empty", needsValue: false },
  ],
  currency: [],
  date: [
    { value: "is", label: "is", needsValue: true },
    { value: "before", label: "is before", needsValue: true },
    { value: "after", label: "is after", needsValue: true },
    { value: "between", label: "is between", needsValue: true, needsSecondValue: true },
    { value: "is-empty", label: "is empty", needsValue: false },
  ],
  enum: [
    { value: "is", label: "is", needsValue: true },
    { value: "is-not", label: "is not", needsValue: true },
    { value: "is-any-of", label: "is any of", needsValue: true },
  ],
  boolean: [
    { value: "is", label: "is", needsValue: true },
  ],
}

DATA_GRID_FILTER_OPERATORS.currency = DATA_GRID_FILTER_OPERATORS.number

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === ""
}

function comparableDate(value: unknown) {
  if (value instanceof Date) return value.getTime()
  const time = new Date(String(value)).getTime()
  return Number.isNaN(time) ? null : time
}

export function dataGridFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  rawFilter: unknown,
) {
  const filter = rawFilter as DataGridFilterValue | undefined
  if (!filter?.operator) return true

  const rowValue = row.getValue(columnId)
  const operator = filter.operator

  if (operator === "is-empty") return isEmpty(rowValue)
  if (operator === "is-not-empty") return !isEmpty(rowValue)

  if (operator === "is-any-of") {
    const values = Array.isArray(filter.value) ? filter.value : [filter.value]
    return values.map(String).includes(String(rowValue))
  }

  if (typeof rowValue === "boolean") {
    return rowValue === (filter.value === true || filter.value === "true")
  }

  const rowDate = comparableDate(rowValue)
  const filterDate = comparableDate(filter.value)
  const filterDateTo = comparableDate(filter.valueTo)
  const looksLikeDate =
    rowValue instanceof Date ||
    (typeof rowValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(rowValue))

  if (looksLikeDate && rowDate !== null && filterDate !== null) {
    if (operator === "is") return rowDate === filterDate
    if (operator === "before") return rowDate < filterDate
    if (operator === "after") return rowDate > filterDate
    if (operator === "between" && filterDateTo !== null) {
      return rowDate >= filterDate && rowDate <= filterDateTo
    }
  }

  const rowNumber = typeof rowValue === "number" ? rowValue : Number(rowValue)
  const filterNumber = Number(filter.value)
  const filterNumberTo = Number(filter.valueTo)
  const hasNumericValues =
    !Number.isNaN(rowNumber) &&
    !Number.isNaN(filterNumber) &&
    typeof rowValue !== "string"

  if (hasNumericValues) {
    if (operator === "equals") return rowNumber === filterNumber
    if (operator === "not-equal") return rowNumber !== filterNumber
    if (operator === "greater-than") return rowNumber > filterNumber
    if (operator === "greater-than-or-equal") return rowNumber >= filterNumber
    if (operator === "less-than") return rowNumber < filterNumber
    if (operator === "less-than-or-equal") return rowNumber <= filterNumber
    if (operator === "between" && !Number.isNaN(filterNumberTo)) {
      return rowNumber >= filterNumber && rowNumber <= filterNumberTo
    }
  }

  const actual = String(rowValue ?? "").toLocaleLowerCase()
  const expected = String(filter.value ?? "").toLocaleLowerCase()

  if (operator === "contains") return actual.includes(expected)
  if (operator === "not-contains") return !actual.includes(expected)
  if (operator === "is") return actual === expected
  if (operator === "is-not") return actual !== expected
  if (operator === "starts-with") return actual.startsWith(expected)
  if (operator === "ends-with") return actual.endsWith(expected)

  return true
}

export function moveDataGridColumn(
  order: string[],
  sourceId: string,
  targetId: string,
) {
  if (sourceId === targetId) return order
  const next = order.filter((id) => id !== sourceId)
  const targetIndex = next.indexOf(targetId)
  if (targetIndex === -1) return order
  next.splice(targetIndex, 0, sourceId)
  return next
}

export function getDataGridPageItems(currentPage: number, pageCount: number) {
  const visiblePages = new Set([
    0,
    pageCount - 1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])
  const items: Array<{ type: "page"; page: number } | { type: "ellipsis" }> = []

  for (let page = 0; page < pageCount; page++) {
    if (visiblePages.has(page)) {
      items.push({ type: "page", page })
    } else if (items.at(-1)?.type !== "ellipsis") {
      items.push({ type: "ellipsis" })
    }
  }

  return items
}

export function formatDataGridFilter(
  title: string,
  filter: DataGridFilterValue,
) {
  const operator = Object.values(DATA_GRID_FILTER_OPERATORS)
    .flat()
    .find((item) => item.value === filter.operator)?.label ?? filter.operator
  const rawValue = Array.isArray(filter.value)
    ? filter.value.join(", ")
    : String(filter.value ?? "")
  const value = filter.valueTo
    ? `${rawValue} and ${String(filter.valueTo)}`
    : rawValue

  return `${title} ${operator}${value ? ` ${value}` : ""}`
}

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r\n\0\uFEFF\uFF0B\uFF0D\uFF1D\uFF20]/

function escapeCsvCell(value: unknown) {
  const text = value == null ? "" : String(value)
  const safeText =
    typeof value === "string" && CSV_FORMULA_PREFIX.test(text)
      ? `'${text}`
      : text
  return `"${safeText.replaceAll('"', '""')}"`
}

export function buildDataGridCsv(
  headers: string[],
  rows: unknown[][],
) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n")
}
