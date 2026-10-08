/** Which part of a date comes first in a pasted cell such as `03/04/2026`. */
export type PasteTableDateOrder = "ymd" | "mdy" | "dmy"

export type PasteTableDecimalSeparator = "." | ","

/** What a custom `parse` returns: the value to import, or why the cell is invalid. */
export type PasteTableParseResult = { value: unknown } | { error: string }

export type PasteTableValidateContext = {
  /** The cell's text as pasted or last edited. */
  raw: string
  /** Parsed values of the same pasted row, keyed by column. Invalid cells are absent. */
  row: Record<string, unknown>
}

type PasteTableColumnBase = {
  /** Property name of this field in each imported row. */
  key: string
  label: string
  /** Other header names that should map to this field, such as `E-mail`. */
  aliases?: string[] | undefined
  /** An empty cell is invalid, and a pasted column must be mapped to this field. */
  required?: boolean | undefined
  /** Replaces the built-in parsing for the column's type. Not called for empty cells. */
  parse?: ((raw: string) => PasteTableParseResult) | undefined
  /** Returns a message when a parsed value is not acceptable. Not called for empty cells. */
  validate?: ((value: unknown, context: PasteTableValidateContext) => string | undefined) | undefined
}

export type PasteTableTextColumn = PasteTableColumnBase & {
  type?: "text" | undefined
}

export type PasteTableNumberColumn = PasteTableColumnBase & {
  type: "number"
  /** The character before the fraction. The other of `.` and `,` groups thousands. */
  decimalSeparator?: PasteTableDecimalSeparator | undefined
}

export type PasteTableDateColumn = PasteTableColumnBase & {
  type: "date"
  /** Required, because `03/04/2026` is a different day in different countries. */
  dateOrder: PasteTableDateOrder
}

export type PasteTableColumn = PasteTableTextColumn | PasteTableNumberColumn | PasteTableDateColumn

/** One pasted row. `id` stays the same while cells are edited and rows are removed. */
export type PasteTableSourceRow = {
  id: number
  cells: string[]
}

/** Field key for each pasted column, or `null` when the column is not imported. */
export type PasteTableMapping = (string | null)[]

export type PasteTableCellResult = {
  raw: string
  /** The value that would be imported. `null` for an empty cell. */
  value: unknown
  error?: string | undefined
}

export type PasteTableRowResult = {
  id: number
  /** One entry per pasted column; `null` where the column is not imported. */
  cells: (PasteTableCellResult | null)[]
  /** Parsed values keyed by field. Only complete when `isValid` is true. */
  values: Record<string, unknown>
  isValid: boolean
}

export type PasteTableLabels = {
  pasteLabel: string
  pasteDescription: (columns: string[]) => string
  pastePlaceholder: string
  /** Button that reads text which arrived without a paste event, such as typed text. */
  readDraft: string
  emptyPaste: string
  tooManyRows: (counts: { rows: number; maxRows: number }) => string
  imported: (rows: number) => string
  headerRow: string
  /** Column heading when the paste has no header row. */
  columnName: (position: number) => string
  rowHeading: string
  actionsHeading: string
  skipColumn: string
  mapColumn: (columnName: string) => string
  missingColumn: (fieldLabel: string) => string
  summary: (counts: { rows: number; problemRows: number; problemCells: number }) => string
  noRows: string
  emptyCell: string
  editCell: (cell: { row: number; column: string; value: string }) => string
  cellInput: (cell: { row: number; column: string }) => string
  removeRow: (row: number) => string
  removeProblemRows: (rows: number) => string
  nextProblem: string
  showMoreRows: (rows: number) => string
  discard: string
  import: (rows: number) => string
  importing: string
  /** Shown when Import is pressed while cells or mappings still need attention. */
  importBlocked: string
  importFailed: (reason: string | undefined) => string
  required: string
  invalidNumber: (decimalSeparator: PasteTableDecimalSeparator) => string
  invalidDate: (dateOrder: PasteTableDateOrder) => string
}
