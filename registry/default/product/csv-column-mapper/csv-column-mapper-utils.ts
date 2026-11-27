import type {
  CsvColumnMapperLabels,
  CsvColumnMapping,
  CsvColumnProfile,
  CsvColumnSuggestion,
  CsvDetectedType,
  CsvMapperField,
  CsvMappingResult,
  CsvValueType,
} from "./csv-column-mapper-types"

/* -------------------------------------------------------------------------- */
/* Type detection                                                             */
/* -------------------------------------------------------------------------- */

const BOOLEAN = /^(?:true|false|yes|no|y|n)$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_VALUE = /^(?:https?:\/\/|www\.)[^\s]+$/i
const PERCENT = /^[-+]?\d+(?:[.,]\d+)?\s?%$/
const CURRENCY_SYMBOL = "[$€£¥₹₩]"
const CURRENCY_CODE = "(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|INR)"
const AMOUNT = "\\d[\\d,.\\s']*"
const CURRENCY = new RegExp(
  `^(?:[-+(]\\s?)?(?:${CURRENCY_SYMBOL}|${CURRENCY_CODE}\\s?)\\s?${AMOUNT}\\)?$|^[-+]?${AMOUNT}\\s?(?:${CURRENCY_SYMBOL}|\\s${CURRENCY_CODE})$`,
  "i"
)
const INTEGER = /^[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)$/
const DECIMAL = /^[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)?\.\d+$|^[-+]?\d+(?:\.\d+)?e[-+]?\d+$/i
const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?"
const DATES = [
  /^\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[-+]\d{2}:?\d{2})?)?$/,
  /^\d{4}\/\d{1,2}\/\d{1,2}$/,
  /^\d{1,2}[/.-]\d{1,2}[/.-](?:\d{2}|\d{4})$/,
  new RegExp(`^${MONTH}\\s\\d{1,2}(?:st|nd|rd|th)?,?\\s\\d{4}$`, "i"),
  new RegExp(`^\\d{1,2}(?:st|nd|rd|th)?\\s${MONTH},?\\s\\d{4}$`, "i"),
]

/** The type one cell looks like, or `null` for a blank cell. */
export function detectValueType(raw: string): CsvValueType | null {
  const value = raw.trim()
  if (value === "") return null
  if (BOOLEAN.test(value)) return "boolean"
  if (EMAIL.test(value)) return "email"
  if (URL_VALUE.test(value)) return "url"
  if (PERCENT.test(value)) return "percent"
  if (CURRENCY.test(value)) return "currency"
  if (INTEGER.test(value)) return "integer"
  if (DECIMAL.test(value)) return "number"
  if (DATES.some((pattern) => pattern.test(value))) return "date"
  return "text"
}

/** Types that a wider type absorbs when a column mixes them, such as 12 and 12.5. */
const WIDENS_TO: Partial<Record<CsvValueType, CsvValueType[]>> = {
  number: ["integer"],
  currency: ["integer", "number"],
  percent: ["integer", "number"],
}

/**
 * The type most cells in a column share. A column whose cells mostly disagree
 * is text, because text accepts every value.
 */
export function detectColumnType(
  values: string[],
  threshold = 0.8
): { type: CsvDetectedType; confidence: number } {
  const counts = new Map<CsvValueType, number>()
  let filled = 0

  for (const value of values) {
    const type = detectValueType(value)
    if (!type) continue
    filled += 1
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }

  if (filled === 0) return { type: "empty", confidence: 1 }

  let best: { type: CsvValueType; count: number } = { type: "text", count: counts.get("text") ?? 0 }
  for (const [type, count] of counts) {
    const absorbed = (WIDENS_TO[type] ?? []).reduce((total, narrower) => total + (counts.get(narrower) ?? 0), 0)
    // A wider type only claims narrower cells when at least one cell needs the wider type.
    const total = count + absorbed
    if (total > best.count || (total === best.count && absorbed > 0)) best = { type, count: total }
  }

  const confidence = best.count / filled
  return confidence >= threshold ? { type: best.type, confidence } : { type: "text", confidence: (counts.get("text") ?? 0) / filled }
}

/** Profiles each source column from its cells: detected type, blanks, and samples. */
export function profileColumns(
  headers: string[],
  rows: string[][],
  { sampleCount = 3, scanRows = 500 }: { sampleCount?: number; scanRows?: number } = {}
): CsvColumnProfile[] {
  const scanned = rows.slice(0, scanRows)

  return headers.map((header, index) => {
    const values = scanned.map((row) => row[index] ?? "")
    const filled = values.filter((value) => value.trim() !== "")
    const { type, confidence } = detectColumnType(values)

    return {
      index,
      header,
      type,
      confidence,
      samples: filled.slice(0, sampleCount).map((value) => value.trim()),
      emptyCount: values.length - filled.length,
    }
  })
}

/** Which detected column types a field of each type accepts without a warning. */
const ACCEPTS: Record<CsvValueType, CsvDetectedType[]> = {
  text: ["text", "number", "integer", "currency", "percent", "date", "boolean", "email", "url"],
  number: ["number", "integer", "currency", "percent"],
  integer: ["integer"],
  currency: ["currency", "number", "integer"],
  percent: ["percent", "number", "integer"],
  date: ["date"],
  boolean: ["boolean"],
  email: ["email"],
  url: ["url"],
}

/** Whether a column of the detected type fits a field. Blank columns fit every field. */
export function isTypeCompatible(fieldType: CsvValueType | undefined, detected: CsvDetectedType): boolean {
  if (detected === "empty") return true
  return ACCEPTS[fieldType ?? "text"].includes(detected)
}

/* -------------------------------------------------------------------------- */
/* Header matching                                                            */
/* -------------------------------------------------------------------------- */

/** Lowercase letters and digits only, so "E-mail" and "email" compare equal. */
export function normalizeHeader(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
}

function words(value: string): string[] {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    previous = current
  }
  return previous[b.length]
}

/** How alike two header names are, from 0 to 1. */
export function headerSimilarity(a: string, b: string): number {
  const left = normalizeHeader(a)
  const right = normalizeHeader(b)
  if (!left || !right) return 0
  if (left === right) return 1

  const shorter = left.length < right.length ? left : right
  const longer = left.length < right.length ? right : left
  // "Email address" against "Email", or "Customer name" against "Name".
  const contained = shorter.length >= 3 && longer.includes(shorter) ? 0.7 + 0.2 * (shorter.length / longer.length) : 0

  const leftWords = new Set(words(a))
  const rightWords = new Set(words(b))
  const shared = [...leftWords].filter((word) => rightWords.has(word)).length
  const union = new Set([...leftWords, ...rightWords]).size
  const overlap = shared > 0 ? 0.55 + 0.4 * (shared / union) : 0

  const spelling = 1 - editDistance(left, right) / longer.length

  return Math.max(contained, overlap, spelling)
}

function scoreField(header: string, field: CsvMapperField): CsvColumnSuggestion {
  const normalized = normalizeHeader(header)
  if (normalized === normalizeHeader(field.label) || normalized === normalizeHeader(field.key)) {
    return { field: field.key, reason: "name", score: 1 }
  }
  if ((field.aliases ?? []).some((alias) => normalizeHeader(alias) === normalized)) {
    return { field: field.key, reason: "alias", score: 1 }
  }
  const score = Math.max(
    headerSimilarity(header, field.label),
    headerSimilarity(header, field.key),
    ...(field.aliases ?? []).map((alias) => headerSimilarity(header, alias))
  )
  return { field: field.key, reason: "similar", score }
}

/**
 * Matches source headers to fields. Exact names and aliases win, then the most
 * similar pairs above `threshold`. Each field takes at most one column, and a
 * column whose detected type the field cannot accept is passed over.
 */
export function suggestMapping(
  headers: string[],
  fields: CsvMapperField[],
  {
    threshold = 0.72,
    profiles,
  }: { threshold?: number; profiles?: CsvColumnProfile[] | undefined } = {}
): { mapping: CsvColumnMapping; suggestions: (CsvColumnSuggestion | null)[] } {
  const candidates: (CsvColumnSuggestion & { column: number })[] = []

  headers.forEach((header, column) => {
    for (const field of fields) {
      const suggestion = scoreField(header, field)
      if (suggestion.score < threshold) continue
      const detected = profiles?.[column]?.type
      // A similar name is not enough when the values plainly disagree; an exact name is.
      if (suggestion.reason === "similar" && detected && !isTypeCompatible(field.type, detected)) continue
      candidates.push({ ...suggestion, column })
    }
  })

  candidates.sort((a, b) => b.score - a.score || a.column - b.column)

  const mapping: CsvColumnMapping = headers.map(() => null)
  const suggestions: (CsvColumnSuggestion | null)[] = headers.map(() => null)
  const taken = new Set<string>()

  for (const candidate of candidates) {
    if (mapping[candidate.column] !== null || taken.has(candidate.field)) continue
    mapping[candidate.column] = candidate.field
    suggestions[candidate.column] = { field: candidate.field, reason: candidate.reason, score: candidate.score }
    taken.add(candidate.field)
  }

  return { mapping, suggestions }
}

/** Assigns `field` to `column`, releasing it from any other column. `null` skips the column. */
export function setColumnField(mapping: CsvColumnMapping, column: number, field: string | null): CsvColumnMapping {
  return mapping.map((existing, index) =>
    index === column ? field : field !== null && existing === field ? null : existing
  )
}

/** Required fields that no column is mapped to. */
export function getMissingRequiredFields(mapping: CsvColumnMapping, fields: CsvMapperField[]): CsvMapperField[] {
  const mapped = new Set(mapping.filter((key): key is string => key !== null))
  return fields.filter((field) => field.required && !mapped.has(field.key))
}

/** The rows keyed by field, the shape `onConfirm` receives. */
export function applyMapping(rows: string[][], mapping: CsvColumnMapping): Record<string, string>[] {
  return rows.map((row) => {
    const record: Record<string, string> = {}
    mapping.forEach((key, column) => {
      if (key !== null) record[key] = (row[column] ?? "").trim()
    })
    return record
  })
}

/**
 * The mapped columns as a table with field labels in the first row, in field
 * order. Hand it to Paste Table's `defaultRows` to review and fix cells next.
 */
export function toMappedTable(rows: string[][], mapping: CsvColumnMapping, fields: CsvMapperField[]): string[][] {
  const columns = fields.flatMap((field) => {
    const column = mapping.indexOf(field.key)
    return column === -1 ? [] : [{ label: field.label, column }]
  })
  return [columns.map((entry) => entry.label), ...rows.map((row) => columns.map((entry) => (row[entry.column] ?? "").trim()))]
}

export function createMappingResult(
  rows: string[][],
  mapping: CsvColumnMapping,
  fields: CsvMapperField[]
): CsvMappingResult {
  return { mapping, rows: applyMapping(rows, mapping), table: toMappedTable(rows, mapping, fields) }
}

export const defaultCsvColumnMapperLabels: CsvColumnMapperLabels = {
  title: "Map columns",
  summary: ({ mapped, columns, rows }) =>
    `${mapped} of ${columns} ${columns === 1 ? "column" : "columns"} mapped · ${rows.toLocaleString()} ${rows === 1 ? "row" : "rows"}`,
  columnHeading: "Column in file",
  samplesHeading: "Sample values",
  fieldHeading: "Imports as",
  typeNames: {
    text: "Text",
    number: "Number",
    integer: "Whole number",
    currency: "Currency",
    percent: "Percent",
    date: "Date",
    boolean: "Yes / no",
    email: "Email",
    url: "Link",
    empty: "Blank",
  },
  columnMeta: ({ type, empty }) => (empty > 0 ? `${type} · ${empty} blank` : type),
  noSamples: "No values",
  skipColumn: "Don't import",
  requiredSuffix: "required",
  usedBy: (columnName) => `used by ${columnName}`,
  fieldFor: (columnName) => `Field for ${columnName}`,
  matchedBy: {
    name: "Matched by name",
    alias: "Matched by alias",
    similar: "Matched by similar name",
  },
  notImported: "Not imported",
  typeMismatch: ({ detected, field, expected }) =>
    `Values look like ${detected.toLowerCase()}; ${field} expects ${expected.toLowerCase()}`,
  missingRequired: (fieldLabel) => `Choose a column for ${fieldLabel}. It is required.`,
  cancel: "Cancel",
  confirm: (rows) => (rows === 1 ? "Continue with 1 row" : `Continue with ${rows.toLocaleString()} rows`),
  confirming: "Continuing…",
  confirmBlocked: "Map every required field before continuing.",
}
