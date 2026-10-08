"use client"

import * as React from "react"
import {
  LoaderCircle as LoaderCircleIcon,
  TriangleAlert as TriangleAlertIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/registry/default/ui/field"
import { Input } from "@/registry/default/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Switch } from "@/registry/default/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/default/ui/table"
import { Textarea } from "@/registry/default/ui/textarea"

import type {
  PasteTableCellResult,
  PasteTableColumn,
  PasteTableLabels,
  PasteTableMapping,
  PasteTableRowResult,
  PasteTableSourceRow,
} from "./paste-table-types"
import {
  defaultPasteTableLabels,
  evaluateRows,
  getMissingColumns,
  mapColumnsByPosition,
  matchColumns,
  parseClipboardTable,
} from "./paste-table-utils"

export type {
  PasteTableCellResult,
  PasteTableColumn,
  PasteTableDateColumn,
  PasteTableDateOrder,
  PasteTableDecimalSeparator,
  PasteTableLabels,
  PasteTableMapping,
  PasteTableNumberColumn,
  PasteTableParseResult,
  PasteTableRowResult,
  PasteTableSourceRow,
  PasteTableTextColumn,
  PasteTableValidateContext,
} from "./paste-table-types"
export {
  defaultPasteTableLabels,
  evaluateRows,
  getMissingColumns,
  matchColumns,
  parseClipboardTable,
  parseDateCell,
  parseNumberCell,
} from "./paste-table-utils"

const miniText =
  "[font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"
const bodyText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
/** Table headings default to the tertiary text color, which is too faint for 12px text. */
const headText = "text-[var(--hui-color-foreground-base-secondary)]"
/** The danger color is 3.8:1 on the base background: enough for an icon, too faint for small text. */
const dangerText = "text-[var(--hui-color-foreground-danger-primary)]"
/** Filled buttons lose their fill in forced colors, so they get an edge instead. */
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

/** Rows rendered at first, and added by each press of "Show more rows". */
const ROW_PAGE = 50

type PasteSession = {
  /** Every pasted row, including the header row when there is one. */
  rows: PasteTableSourceRow[]
  hasHeaderRow: boolean
  mapping: PasteTableMapping
}

type CellAddress = { rowId: number; column: number }

function cellKey({ rowId, column }: CellAddress) {
  return `${rowId}:${column}`
}

function displayValue(cell: PasteTableCellResult): string {
  if (cell.error) return cell.raw
  // Show the value that will be imported, so "3/4/2026" is seen as the date it was read as.
  return typeof cell.value === "string" || typeof cell.value === "number"
    ? String(cell.value)
    : cell.raw
}

export type PasteTableProps = Omit<React.ComponentProps<"section">, "onPaste"> & {
  /** The fields a pasted column can be mapped to. Define them outside the component. */
  columns: PasteTableColumn[]
  /**
   * Receives the valid rows when Import is pressed. Return a promise to keep
   * the rows on screen until it settles; a rejection leaves them in place.
   */
  onImport: (rows: Record<string, unknown>[]) => void | Promise<void>
  /** Character between cells. Spreadsheets copy with tabs. */
  delimiter?: string
  /** A paste with more data rows than this is refused with a message. */
  maxRows?: number
  disabled?: boolean
  labels?: Partial<PasteTableLabels> | undefined
}

function PasteTable({
  columns,
  onImport,
  delimiter = "\t",
  maxRows = 1000,
  disabled = false,
  labels: labelsProp,
  className,
  ...props
}: PasteTableProps) {
  const labels = React.useMemo(() => ({ ...defaultPasteTableLabels, ...labelsProp }), [labelsProp])

  const [session, setSession] = React.useState<PasteSession | null>(null)
  const [draft, setDraft] = React.useState("")
  const [pasteError, setPasteError] = React.useState<string | null>(null)
  const [importedCount, setImportedCount] = React.useState<number | null>(null)
  const [visibleCount, setVisibleCount] = React.useState(ROW_PAGE)
  const [editing, setEditing] = React.useState<CellAddress | null>(null)
  const [importState, setImportState] = React.useState<
    { status: "idle" | "blocked" | "importing" } | { status: "failed"; reason: string | undefined }
  >({ status: "idle" })

  const rootRef = React.useRef<HTMLElement>(null)
  /** A `data-focus` target to move to once the render that produces it has committed. */
  const [focusRequest, setFocusRequest] = React.useState<{ target: string } | null>(null)
  const requestFocus = (target: string) => setFocusRequest({ target })
  const lastProblem = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!focusRequest) return
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-focus="${focusRequest.target}"]`)
      ?.focus()
  }, [focusRequest])

  const dataRows = React.useMemo(
    () => (session ? session.rows.slice(session.hasHeaderRow ? 1 : 0) : []),
    [session]
  )
  const results = React.useMemo(
    () => (session ? evaluateRows(dataRows, session.mapping, columns, labels) : []),
    [session, dataRows, columns, labels]
  )
  const missingColumns = React.useMemo(
    () => (session ? getMissingColumns(session.mapping, columns) : []),
    [session, columns]
  )

  const problemCells = React.useMemo(
    () =>
      results.flatMap((row) =>
        row.cells.flatMap((cell, column) => (cell?.error ? [{ rowId: row.id, column }] : []))
      ),
    [results]
  )
  const problemRowCount = results.filter((row) => !row.isValid).length
  const isImporting = importState.status === "importing"
  const isLocked = disabled || isImporting

  function readText(text: string) {
    const table = parseClipboardTable(text, delimiter)
    if (table.length === 0) {
      setPasteError(labels.emptyPaste)
      return
    }

    const headerMapping = matchColumns(table[0], columns)
    const hasHeaderRow = headerMapping.some((key) => key !== null)
    const rowCount = table.length - (hasHeaderRow ? 1 : 0)
    if (rowCount > maxRows) {
      setPasteError(labels.tooManyRows({ rows: rowCount, maxRows }))
      return
    }

    setSession({
      rows: table.map((cells, id) => ({ id, cells })),
      hasHeaderRow,
      mapping: hasHeaderRow ? headerMapping : mapColumnsByPosition(table[0].length, columns),
    })
    setDraft("")
    setPasteError(null)
    setImportedCount(null)
    setVisibleCount(ROW_PAGE)
    setImportState({ status: "idle" })
    // The paste field is about to unmount, so move focus to the result of the paste.
    requestFocus("summary")
  }

  function closeSession(imported: number | null) {
    setSession(null)
    setEditing(null)
    setImportedCount(imported)
    setImportState({ status: "idle" })
    lastProblem.current = null
    requestFocus("paste")
  }

  function updateSession(update: (current: PasteSession) => PasteSession) {
    setSession((current) => (current ? update(current) : current))
    setImportState({ status: "idle" })
  }

  function setHeaderRow(hasHeaderRow: boolean) {
    updateSession((current) => {
      if (!hasHeaderRow) return { ...current, hasHeaderRow }
      // Headers that match a field take it; other columns keep the choice already made.
      const matched = matchColumns(current.rows[0]?.cells ?? [], columns)
      const taken = new Set(matched)
      return {
        ...current,
        hasHeaderRow,
        mapping: matched.map((key, index) => {
          const previous = current.mapping[index]
          return key ?? (previous !== null && !taken.has(previous) ? previous : null)
        }),
      }
    })
  }

  function mapColumn(column: number, key: string | null) {
    updateSession((current) => ({
      ...current,
      // A field holds one column, so choosing it here releases it from any other column.
      mapping: current.mapping.map((existing, index) =>
        index === column ? key : existing === key ? null : existing
      ),
    }))
  }

  function commitCell(address: CellAddress, value: string) {
    updateSession((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === address.rowId
          ? { ...row, cells: row.cells.map((cell, index) => (index === address.column ? value : cell)) }
          : row
      ),
    }))
  }

  function removeRows(ids: Set<number>) {
    updateSession((current) => ({ ...current, rows: current.rows.filter((row) => !ids.has(row.id)) }))
    requestFocus("summary")
  }

  function focusNextProblem() {
    if (missingColumns.length > 0) {
      requestFocus("problems")
    } else if (problemCells.length > 0) {
      const keys = problemCells.map(cellKey)
      const next = keys[(keys.indexOf(lastProblem.current ?? "") + 1) % keys.length]
      const rowIndex = results.findIndex((row) => row.id === Number(next.split(":")[0]))
      lastProblem.current = next
      setVisibleCount((count) => Math.max(count, rowIndex + 1))
      requestFocus(next)
    }
  }

  async function runImport() {
    if (isLocked || results.length === 0) return
    if (missingColumns.length > 0 || problemCells.length > 0) {
      setImportState({ status: "blocked" })
      focusNextProblem()
      return
    }

    setImportState({ status: "importing" })
    try {
      await onImport(results.map((row) => row.values))
      closeSession(results.length)
    } catch (error) {
      setImportState({
        status: "failed",
        reason: error instanceof Error && error.message ? error.message : undefined,
      })
      requestFocus("summary")
    }
  }

  return (
    <section
      ref={rootRef}
      data-slot="paste-table-root"
      data-step={session ? "review" : "paste"}
      className={cn("@container flex w-full min-w-0 flex-col gap-[var(--hui-space-3)]", className)}
      {...props}
    >
      {session ? (
        <>
          <ReviewHeader
            labels={labels}
            rowCount={results.length}
            problemRowCount={problemRowCount}
            problemCellCount={problemCells.length}
            hasHeaderRow={session.hasHeaderRow}
            onHeaderRowChange={setHeaderRow}
            disabled={isLocked}
          />

          {(missingColumns.length > 0 || importState.status === "blocked" || importState.status === "failed") && (
            <div
              data-slot="paste-table-problems"
              data-focus="problems"
              role="alert"
              tabIndex={-1}
              className={cn(
                "flex items-start gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-danger-emphasis)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)]",
                bodyText
              )}
            >
              <TriangleAlertIcon aria-hidden="true" className={cn("mt-0.5 size-3.5 shrink-0", dangerText)} />
              <ul className="m-0 flex min-w-0 list-none flex-col gap-[var(--hui-space-1)] p-0">
                {importState.status === "failed" && <li>{labels.importFailed(importState.reason)}</li>}
                {importState.status === "blocked" && missingColumns.length === 0 && (
                  <li>{labels.importBlocked}</li>
                )}
                {missingColumns.map((label) => (
                  <li key={label}>{labels.missingColumn(label)}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            data-slot="paste-table-preview"
            className="w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-secondary)]"
          >
            {/* Table sets tabular figures, which also widens the spaces and points in names and emails. */}
            <Table className="normal-nums">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className={cn("w-px whitespace-nowrap", headText)}>
                    {labels.rowHeading}
                  </TableHead>
                  {session.mapping.map((key, column) => {
                    const pastedName = session.hasHeaderRow ? session.rows[0]?.cells[column] : ""
                    const name = pastedName || labels.columnName(column + 1)
                    return (
                      <TableHead key={column} scope="col" className={cn("min-w-28 align-top", headText)}>
                        <span className="flex flex-col gap-[var(--hui-space-2)]">
                          <span className="break-words">{name}</span>
                          <ColumnSelect
                            label={labels.mapColumn(name)}
                            skipLabel={labels.skipColumn}
                            columns={columns}
                            value={key}
                            onValueChange={(next) => mapColumn(column, next)}
                            disabled={isLocked}
                          />
                        </span>
                      </TableHead>
                    )
                  })}
                  <TableHead scope="col" className="w-px">
                    <span className="sr-only">{labels.actionsHeading}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={session.mapping.length + 2} className="text-center">
                      {labels.noRows}
                    </TableCell>
                  </TableRow>
                )}
                {results.slice(0, visibleCount).map((row, rowIndex) => (
                  <PreviewRow
                    key={row.id}
                    row={row}
                    rowNumber={rowIndex + 1}
                    source={dataRows[rowIndex]}
                    mapping={session.mapping}
                    columns={columns}
                    labels={labels}
                    editing={editing?.rowId === row.id ? editing.column : null}
                    disabled={isLocked}
                    onEdit={(column) => setEditing({ rowId: row.id, column })}
                    onCommit={(column, value, returnFocus) => {
                      const address = { rowId: row.id, column }
                      if (value !== null) commitCell(address, value)
                      if (returnFocus) requestFocus(cellKey(address))
                      setEditing(null)
                    }}
                    onRemove={() => removeRows(new Set([row.id]))}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {results.length > visibleCount && (
            <Button
              variant="link"
              size="sm"
              className="self-start"
              onClick={() => setVisibleCount((count) => count + ROW_PAGE)}
            >
              {labels.showMoreRows(Math.min(ROW_PAGE, results.length - visibleCount))}
            </Button>
          )}

          <div
            data-slot="paste-table-actions"
            className="flex flex-wrap items-center justify-between gap-[var(--hui-space-2)]"
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={isLocked}
              onClick={() => closeSession(null)}
            >
              {labels.discard}
            </Button>
            <div className="flex flex-wrap items-center gap-[var(--hui-space-2)]">
              {problemCells.length > 0 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={forcedColorsBorder}
                    disabled={isLocked}
                    onClick={() =>
                      removeRows(new Set(results.filter((row) => !row.isValid).map((row) => row.id)))
                    }
                  >
                    {labels.removeProblemRows(problemRowCount)}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={forcedColorsBorder}
                    disabled={isLocked}
                    onClick={focusNextProblem}
                  >
                    {labels.nextProblem}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                className={forcedColorsBorder}
                disabled={isLocked || results.length === 0}
                onClick={runImport}
              >
                {isImporting && (
                  <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
                )}
                {isImporting ? labels.importing : labels.import(results.length)}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <Field disabled={disabled}>
            <FieldLabel>{labels.pasteLabel}</FieldLabel>
            <FieldControl
              value={draft}
              onValueChange={(value) => {
                setDraft(value)
                setPasteError(null)
              }}
              onPaste={(event) => {
                const text = event.clipboardData.getData("text/plain")
                if (text.trim() === "") return
                event.preventDefault()
                readText(text)
              }}
              render={(controlProps) => (
                <Textarea
                  rows={4}
                  placeholder={labels.pastePlaceholder}
                  data-focus="paste"
                  aria-invalid={pasteError ? true : undefined}
                  {...controlProps}
                />
              )}
            />
            <FieldDescription>
              {labels.pasteDescription(columns.map((column) => column.label))}
            </FieldDescription>
          </Field>
          {pasteError && (
            <p
              role="alert"
              data-slot="paste-table-paste-error"
              className={cn(
                "m-0 flex items-start gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]",
                bodyText
              )}
            >
              <TriangleAlertIcon aria-hidden="true" className={cn("mt-0.5 size-3.5 shrink-0", dangerText)} />
              {pasteError}
            </p>
          )}
          {/* Text that arrived without a paste event, such as typed or dictated rows. */}
          {draft.trim() !== "" && (
            <Button
              variant="secondary"
              size="sm"
              className={cn("self-start", forcedColorsBorder)}
              disabled={disabled}
              onClick={() => readText(draft)}
            >
              {labels.readDraft}
            </Button>
          )}
          <p
            role="status"
            data-slot="paste-table-result"
            className={cn("m-0 text-[var(--hui-color-foreground-base-primary)] empty:hidden", bodyText)}
          >
            {importedCount !== null && labels.imported(importedCount)}
          </p>
        </>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Review header                                                              */
/* -------------------------------------------------------------------------- */

function ReviewHeader({
  labels,
  rowCount,
  problemRowCount,
  problemCellCount,
  hasHeaderRow,
  onHeaderRowChange,
  disabled,
}: {
  labels: PasteTableLabels
  rowCount: number
  problemRowCount: number
  problemCellCount: number
  hasHeaderRow: boolean
  onHeaderRowChange: (hasHeaderRow: boolean) => void
  disabled: boolean
}) {
  const labelId = React.useId()

  return (
    <div
      data-slot="paste-table-header"
      className="flex flex-wrap items-center justify-between gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)]"
    >
      <p
        role="status"
        tabIndex={-1}
        data-slot="paste-table-summary"
        data-focus="summary"
        className={cn(
          "m-0 rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-primary)] outline-none [font-weight:var(--hui-font-weight-medium)] focus-visible:[outline:var(--hui-focus-ring)]",
          bodyText
        )}
      >
        {rowCount === 0
          ? labels.noRows
          : labels.summary({ rows: rowCount, problemRows: problemRowCount, problemCells: problemCellCount })}
      </p>
      <div
        className={cn(
          "inline-flex min-h-6 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]",
          bodyText
        )}
      >
        {/* The switch is not a form control a <label> can name, so it is named by reference. */}
        <Switch
          aria-labelledby={labelId}
          checked={hasHeaderRow}
          onCheckedChange={onHeaderRowChange}
          disabled={disabled}
          // Forced colors removes the track and thumb fills, so draw both with system colors.
          className={cn(forcedColorsBorder, "forced-colors:box-content forced-colors:[&>span]:bg-[ButtonText]")}
        />
        <span
          id={labelId}
          className={disabled ? undefined : "cursor-pointer"}
          onClick={disabled ? undefined : () => onHeaderRowChange(!hasHeaderRow)}
        >
          {labels.headerRow}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Column mapping                                                             */
/* -------------------------------------------------------------------------- */

function ColumnSelect({
  label,
  skipLabel,
  columns,
  value,
  onValueChange,
  disabled,
}: {
  label: string
  skipLabel: string
  columns: PasteTableColumn[]
  value: string | null
  onValueChange: (key: string | null) => void
  disabled: boolean
}) {
  const items = React.useMemo(
    () => [
      { label: skipLabel, value: null },
      ...columns.map((column) => ({ label: column.label, value: column.key })),
    ],
    [skipLabel, columns]
  )

  return (
    <Select items={items} value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger size="sm" aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value ?? ""} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

/* -------------------------------------------------------------------------- */
/* Rows and cells                                                             */
/* -------------------------------------------------------------------------- */

function PreviewRow({
  row,
  rowNumber,
  source,
  mapping,
  columns,
  labels,
  editing,
  disabled,
  onEdit,
  onCommit,
  onRemove,
}: {
  row: PasteTableRowResult
  rowNumber: number
  source: PasteTableSourceRow | undefined
  mapping: PasteTableMapping
  columns: PasteTableColumn[]
  labels: PasteTableLabels
  /** Index of the column being edited in this row. */
  editing: number | null
  disabled: boolean
  onEdit: (column: number) => void
  /** `value` is `null` when the edit was cancelled. */
  onCommit: (column: number, value: string | null, returnFocus: boolean) => void
  onRemove: () => void
}) {
  return (
    <TableRow data-slot="paste-table-row" data-invalid={row.isValid ? undefined : ""}>
      <th
        scope="row"
        className={cn(
          "border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-left align-top text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-regular)]",
          miniText
        )}
      >
        {rowNumber}
      </th>
      {row.cells.map((cell, column) => {
        if (!cell) {
          return (
            <TableCell
              key={column}
              data-slot="paste-table-skipped-cell"
              className={cn(
                "max-w-80 py-[var(--hui-space-2)] align-top break-words whitespace-normal text-[var(--hui-color-foreground-base-secondary)]",
                bodyText
              )}
            >
              {source?.cells[column]}
            </TableCell>
          )
        }

        const columnLabel = columns.find((candidate) => candidate.key === mapping[column])?.label ?? ""
        return (
          <PreviewCell
            key={column}
            cell={cell}
            focusKey={cellKey({ rowId: row.id, column })}
            rowNumber={rowNumber}
            columnLabel={columnLabel}
            labels={labels}
            isEditing={editing === column}
            disabled={disabled}
            onEdit={() => onEdit(column)}
            onCommit={(value, returnFocus) => onCommit(column, value, returnFocus)}
          />
        )
      })}
      <TableCell className="py-[var(--hui-space-2)] align-top">
        <Button
          variant="link"
          size="icon-sm"
          aria-label={labels.removeRow(rowNumber)}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon aria-hidden="true" className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

function PreviewCell({
  cell,
  focusKey,
  rowNumber,
  columnLabel,
  labels,
  isEditing,
  disabled,
  onEdit,
  onCommit,
}: {
  cell: PasteTableCellResult
  focusKey: string
  rowNumber: number
  columnLabel: string
  labels: PasteTableLabels
  isEditing: boolean
  disabled: boolean
  onEdit: () => void
  onCommit: (value: string | null, returnFocus: boolean) => void
}) {
  const errorId = React.useId()
  /** Enter and Escape settle the edit themselves, so the blur they cause must not settle it again. */
  const settled = React.useRef(false)
  const editorRef = React.useRef<HTMLSpanElement>(null)
  const shown = displayValue(cell)

  React.useEffect(() => {
    if (!isEditing) return
    settled.current = false
    const input = editorRef.current?.querySelector("input")
    input?.focus()
    input?.select()
  }, [isEditing])

  return (
    <TableCell
      data-slot="paste-table-cell"
      data-invalid={cell.error ? "" : undefined}
      className={cn(
        "max-w-80 py-[var(--hui-space-2)] align-top whitespace-normal text-[var(--hui-color-foreground-base-primary)]",
        bodyText
      )}
    >
      {isEditing ? (
        <span ref={editorRef} className="block">
          <Input
            size="sm"
            defaultValue={cell.raw}
            aria-label={labels.cellInput({ row: rowNumber, column: columnLabel })}
            aria-invalid={cell.error ? true : undefined}
            aria-describedby={cell.error ? errorId : undefined}
            onBlur={(event) => {
              if (!settled.current) onCommit(event.currentTarget.value.trim(), false)
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== "Escape") return
              event.preventDefault()
              settled.current = true
              onCommit(event.key === "Enter" ? event.currentTarget.value.trim() : null, true)
            }}
          />
        </span>
      ) : (
        <button
          type="button"
          data-focus={focusKey}
          disabled={disabled}
          aria-label={labels.editCell({
            row: rowNumber,
            column: columnLabel,
            value: shown || labels.emptyCell,
          })}
          aria-describedby={cell.error ? errorId : undefined}
          onClick={onEdit}
          className={cn(
            "block min-h-6 w-full cursor-text rounded-[var(--hui-radius-1)] border-0 bg-transparent p-0 text-left break-words text-inherit outline-none [font:inherit] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] disabled:cursor-not-allowed",
            cell.error && "underline decoration-[var(--hui-color-border-danger-emphasis)] decoration-wavy underline-offset-4",
            shown === "" && "text-[var(--hui-color-foreground-base-secondary)]"
          )}
        >
          {shown || labels.emptyCell}
        </button>
      )}
      {cell.error && (
        <span
          id={errorId}
          data-slot="paste-table-cell-error"
          className={cn("mt-[var(--hui-space-1)] flex items-start gap-[var(--hui-space-1)]", miniText)}
        >
          <TriangleAlertIcon aria-hidden="true" className={cn("mt-px size-3 shrink-0", dangerText)} />
          {cell.error}
        </span>
      )}
    </TableCell>
  )
}

export { PasteTable }
