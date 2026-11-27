/** The kinds of value the mapper can recognise in a column, and a field can expect. */
export type CsvValueType =
  | "text"
  | "number"
  | "integer"
  | "currency"
  | "percent"
  | "date"
  | "boolean"
  | "email"
  | "url"

/** A column's detected type. `"empty"` means every sampled cell was blank. */
export type CsvDetectedType = CsvValueType | "empty"

/**
 * One field in your schema. The shape is a subset of Paste Table's column, so
 * the same `columns` array can describe both steps of an import.
 */
export type CsvMapperField = {
  /** Property name of this field in each mapped row. */
  key: string
  label: string
  /** The kind of value the field expects. Defaults to `"text"`, which accepts anything. */
  type?: CsvValueType | undefined
  /** Other header names that should match this field, such as `E-mail`. */
  aliases?: string[] | undefined
  /** A column must be mapped to this field before the mapping can be confirmed. */
  required?: boolean | undefined
}

/** Field key for each source column, or `null` when the column is not imported. */
export type CsvColumnMapping = (string | null)[]

/** What the mapper learned about one source column. */
export type CsvColumnProfile = {
  index: number
  header: string
  type: CsvDetectedType
  /** Share of non-empty cells that fit `type`, from 0 to 1. */
  confidence: number
  /** The first few non-empty values, as they appear in the source. */
  samples: string[]
  /** Blank cells in the column. */
  emptyCount: number
}

/** Why a column was mapped to a field when the mapper opened. */
export type CsvMatchReason = "name" | "alias" | "similar"

export type CsvColumnSuggestion = {
  field: string
  reason: CsvMatchReason
  /** From 0 to 1. Exact names and aliases score 1. */
  score: number
}

export type CsvMappingResult = {
  mapping: CsvColumnMapping
  /** One object per source row, keyed by field. Cells are the source text, unparsed. */
  rows: Record<string, string>[]
  /**
   * The mapped columns as a table whose first row holds the field labels. Paste
   * Table reads it as a header row and maps every column without guessing.
   */
  table: string[][]
}

export type CsvColumnMapperLabels = {
  title: string
  /** Summary in the header, such as "5 of 7 columns mapped". */
  summary: (counts: { mapped: number; columns: number; rows: number }) => string
  columnHeading: string
  samplesHeading: string
  fieldHeading: string
  typeNames: Record<CsvDetectedType, string>
  /** Text under a column name, such as "Number · 2 blank". */
  columnMeta: (details: { type: string; empty: number }) => string
  noSamples: string
  skipColumn: string
  requiredSuffix: string
  /** Select option suffix for a field another column already uses. */
  usedBy: (columnName: string) => string
  fieldFor: (columnName: string) => string
  matchedBy: Record<CsvMatchReason, string>
  notImported: string
  /** Warning under a field select whose column does not look like the field's type. */
  typeMismatch: (details: { detected: string; field: string; expected: string }) => string
  missingRequired: (fieldLabel: string) => string
  cancel: string
  confirm: (rows: number) => string
  confirming: string
  confirmBlocked: string
}
