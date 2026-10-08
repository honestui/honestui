import type {
  PasteTableCellResult,
  PasteTableColumn,
  PasteTableDateOrder,
  PasteTableDecimalSeparator,
  PasteTableLabels,
  PasteTableMapping,
  PasteTableRowResult,
  PasteTableSourceRow,
} from "./paste-table-types"

function trimCell(cell: string): string {
  // Spreadsheets pad cells with no-break spaces, which String.trim also removes.
  return cell.trim()
}

/**
 * Splits clipboard text into rows of trimmed cells. Excel and Google Sheets
 * separate cells with tabs and wrap a cell in double quotes when it contains
 * a tab, a line break, or a quote; a quote inside such a cell is doubled.
 * Blank rows are dropped and short rows are padded to the widest row.
 */
export function parseClipboardTable(text: string, delimiter = "\t"): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  let atCellStart = true

  const endCell = () => {
    row.push(trimCell(cell))
    cell = ""
    atCellStart = true
  }
  const endRow = () => {
    endCell()
    if (row.some((value) => value !== "")) rows.push(row)
    row = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quoted) {
      if (char !== '"') cell += char
      else if (text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else quoted = false
      continue
    }

    if (char === '"' && atCellStart) {
      quoted = true
      atCellStart = false
    } else if (char === delimiter) {
      endCell()
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1
      endRow()
    } else {
      cell += char
      atCellStart = false
    }
  }
  endRow()

  const width = Math.max(0, ...rows.map((cells) => cells.length))
  return rows.map((cells) =>
    cells.length === width ? cells : [...cells, ...Array<string>(width - cells.length).fill("")]
  )
}

/**
 * Reads a number written with the given decimal separator. Accepts thousands
 * groups, a sign or accounting parentheses, one currency symbol, and Excel's
 * scientific notation. Returns `null` for anything else, including a number
 * written for the other separator, so `1,5` is never read as fifteen.
 */
export function parseNumberCell(
  raw: string,
  decimalSeparator: PasteTableDecimalSeparator = "."
): number | null {
  let text = raw.replace(/\s/g, "")
  let negative = false

  const parenthesized = /^\((.+)\)$/.exec(text)
  if (parenthesized) {
    negative = true
    text = parenthesized[1]
  }

  text = text.replace(/^([+\-−]?)[$€£¥]/, "$1").replace(/[$€£¥]$/, "")

  const sign = /^[+\-−]/.exec(text)
  if (sign) {
    if (sign[0] !== "+") negative = !negative
    text = text.slice(1)
  }

  const group = decimalSeparator === "." ? "," : "\\."
  const decimal = decimalSeparator === "." ? "\\." : ","
  const match = new RegExp(
    `^(\\d{1,3}(?:${group}\\d{3})+|\\d+)?(?:${decimal}(\\d*))?(?:[eE]([+-]?\\d+))?$`
  ).exec(text)
  if (!match) return null

  const [, whole = "", fraction = "", exponent] = match
  if (whole === "" && fraction === "") return null

  const value = Number(
    `${whole.replace(/\D/g, "") || "0"}.${fraction || "0"}${exponent ? `e${exponent}` : ""}`
  )
  if (!Number.isFinite(value)) return null
  return negative ? -value : value
}

/**
 * Reads a calendar date and returns it as `YYYY-MM-DD`. A date that starts
 * with a four-digit year is accepted for every order. Two-digit years, times,
 * and days that do not exist return `null`.
 */
export function parseDateCell(raw: string, dateOrder: PasteTableDateOrder): string | null {
  const text = raw.trim()
  let year: number
  let month: number
  let day: number

  const yearFirst = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text)
  if (yearFirst) {
    ;[year, month, day] = yearFirst.slice(1).map(Number)
  } else {
    const yearLast = dateOrder === "ymd" ? null : /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(text)
    if (!yearLast) return null
    const [first, second] = [Number(yearLast[1]), Number(yearLast[2])]
    year = Number(yearLast[3])
    month = dateOrder === "mdy" ? first : second
    day = dateOrder === "mdy" ? second : first
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  const exists =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  if (!exists) return null

  const pad = (value: number, length: number) => String(value).padStart(length, "0")
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`
}

function normalizeHeader(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")
}

/**
 * Maps each pasted header to the field whose label, key, or alias it equals,
 * ignoring case, spaces, and punctuation. A field is used once; later
 * headers that match it stay unmapped.
 */
export function matchColumns(headers: string[], columns: PasteTableColumn[]): PasteTableMapping {
  const used = new Set<string>()

  return headers.map((header) => {
    const name = normalizeHeader(header)
    if (name === "") return null

    const column = columns.find(
      (candidate) =>
        !used.has(candidate.key) &&
        [candidate.label, candidate.key, ...(candidate.aliases ?? [])].some(
          (option) => normalizeHeader(option) === name
        )
    )
    if (!column) return null

    used.add(column.key)
    return column.key
  })
}

/** Without a header row there are no names to match, so fields follow column order. */
export function mapColumnsByPosition(columnCount: number, columns: PasteTableColumn[]): PasteTableMapping {
  return Array.from({ length: columnCount }, (_, index) => columns[index]?.key ?? null)
}

/** Labels of required fields that no pasted column is mapped to. */
export function getMissingColumns(mapping: PasteTableMapping, columns: PasteTableColumn[]): string[] {
  return columns
    .filter((column) => column.required && !mapping.includes(column.key))
    .map((column) => column.label)
}

function parseCell(raw: string, column: PasteTableColumn, labels: PasteTableLabels): PasteTableCellResult {
  if (raw === "") {
    return column.required ? { raw, value: null, error: labels.required } : { raw, value: null }
  }

  if (column.parse) {
    const result = column.parse(raw)
    return "error" in result ? { raw, value: undefined, error: result.error } : { raw, value: result.value }
  }

  if (column.type === "number") {
    const value = parseNumberCell(raw, column.decimalSeparator)
    return value === null
      ? { raw, value: undefined, error: labels.invalidNumber(column.decimalSeparator ?? ".") }
      : { raw, value }
  }

  if (column.type === "date") {
    const value = parseDateCell(raw, column.dateOrder)
    return value === null
      ? { raw, value: undefined, error: labels.invalidDate(column.dateOrder) }
      : { raw, value }
  }

  return { raw, value: raw }
}

/**
 * Parses and validates every mapped cell. Validation runs after the whole row
 * is parsed, so a `validate` callback can compare fields in the same row.
 */
export function evaluateRows(
  rows: PasteTableSourceRow[],
  mapping: PasteTableMapping,
  columns: PasteTableColumn[],
  labels: PasteTableLabels
): PasteTableRowResult[] {
  const mappedColumns = mapping.map((key) => columns.find((column) => column.key === key))

  return rows.map((row) => {
    const cells = mappedColumns.map((column, index) =>
      column ? parseCell(row.cells[index] ?? "", column, labels) : null
    )

    const values: Record<string, unknown> = {}
    cells.forEach((cell, index) => {
      const column = mappedColumns[index]
      if (column && cell && !cell.error) values[column.key] = cell.value
    })

    cells.forEach((cell, index) => {
      const validate = mappedColumns[index]?.validate
      if (!validate || !cell || cell.error || cell.value === null) return
      const message = validate(cell.value, { raw: cell.raw, row: values })
      if (message) cell.error = message
    })

    return { id: row.id, cells, values, isValid: cells.every((cell) => !cell?.error) }
  })
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count.toLocaleString("en")} ${count === 1 ? singular : pluralForm}`
}

const dateExamples: Record<PasteTableDateOrder, string> = {
  ymd: "YYYY-MM-DD",
  mdy: "MM/DD/YYYY",
  dmy: "DD/MM/YYYY",
}

export const defaultPasteTableLabels: PasteTableLabels = {
  pasteLabel: "Paste rows from a spreadsheet",
  pasteDescription: (columns) =>
    `Copy cells in Excel or Google Sheets, then paste them here. Fields: ${columns.join(", ")}.`,
  pastePlaceholder: "Paste cells here",
  readDraft: "Preview rows",
  emptyPaste: "There were no cells in that paste. Copy at least one row, then paste again.",
  tooManyRows: ({ rows, maxRows }) =>
    `That paste has ${plural(rows, "row", "rows")}. Paste ${maxRows.toLocaleString("en")} or fewer at a time.`,
  imported: (rows) => `${plural(rows, "row", "rows")} imported.`,
  headerRow: "First row is a header",
  columnName: (position) => `Column ${position}`,
  rowHeading: "Row",
  actionsHeading: "Remove",
  skipColumn: "Do not import",
  mapColumn: (columnName) => `Field for ${columnName}`,
  missingColumn: (fieldLabel) =>
    `No column is mapped to ${fieldLabel}. Choose ${fieldLabel} for one of the columns.`,
  summary: ({ rows, problemRows, problemCells }) =>
    problemRows === 0
      ? `${plural(rows, "row", "rows")} ready to import.`
      : `${plural(rows, "row", "rows")}. ${plural(problemCells, "cell", "cells")} in ${plural(problemRows, "row", "rows")} ${problemCells === 1 ? "needs" : "need"} fixing.`,
  noRows: "There are no rows to import.",
  emptyCell: "Empty",
  editCell: ({ row, column, value }) => `Edit ${column} in row ${row}: ${value}`,
  cellInput: ({ row, column }) => `${column}, row ${row}`,
  removeRow: (row) => `Remove row ${row}`,
  removeProblemRows: (rows) => `Remove ${plural(rows, "row", "rows")} with problems`,
  nextProblem: "Next problem",
  showMoreRows: (rows) => `Show ${plural(rows, "more row", "more rows")}`,
  discard: "Discard paste",
  import: (rows) => `Import ${plural(rows, "row", "rows")}`,
  importing: "Importing…",
  importBlocked: "Fix or remove the rows with problems before importing.",
  importFailed: (reason) =>
    `The rows were not imported. They are still here, so you can try again.${reason ? ` Reason: ${reason}` : ""}`,
  required: "Required",
  invalidNumber: (decimalSeparator) =>
    `Enter a number, such as ${decimalSeparator === "." ? "1,234.5" : "1.234,5"}`,
  invalidDate: (dateOrder) => `Enter a date as ${dateExamples[dateOrder]}`,
}
