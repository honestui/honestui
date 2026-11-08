"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  LoaderCircle as LoaderCircleIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import { Checkbox } from "../../components/ui/checkbox.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.js"

export type DiffTableColumn = {
  id: string
  header: string
}

export type DiffTableRow = {
  id: string
  /** "added" and "removed" rows are proposed edits. "unchanged" rows give context. */
  change: "unchanged" | "added" | "removed"
  /** Names the row in its checkbox label, such as "Rocky Road". */
  name: string
  /** The cell for each column `id`. */
  cells: Record<string, React.ReactNode>
}

export type DiffTableLabels = {
  change: string
  added: string
  removed: string
  unchanged: string
  includeAdded: (name: string) => string
  includeRemoved: (name: string) => string
  summary: (additions: number, removals: number) => string
  apply: (count: number) => string
  applying: string
  applied: (count: number) => string
  error: string
}

export const defaultDiffTableLabels: DiffTableLabels = {
  change: "Change",
  added: "Add",
  removed: "Remove",
  unchanged: "No change",
  includeAdded: (name) => `Include adding ${name}`,
  includeRemoved: (name) => `Include removing ${name}`,
  summary: (additions, removals) =>
    `${additions} ${additions === 1 ? "addition" : "additions"}, ${removals} ${removals === 1 ? "removal" : "removals"} selected`,
  apply: (count) => (count === 1 ? "Apply 1 change" : `Apply ${count} changes`),
  applying: "Applying…",
  applied: (count) => (count === 1 ? "1 change applied." : `${count} changes applied.`),
  error: "The changes were not applied. Your selection is still here, so you can apply again.",
}

// Table's own header color is too light for small text, so these headers use the secondary foreground.
const headText = "text-[var(--hui-color-foreground-base-secondary)]!"

const regularText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

// The title, footer, and the first and last cells keep clear of the card's
// rounded corners; inner cells keep the density's own padding.
const edgePadding = "px-[var(--hui-space-5)]"
const edgeCells = "[&_tr>*:first-child]:ps-[var(--hui-space-5)] [&_tr>*:last-child]:pe-[var(--hui-space-5)]"

// A half-strength tint keeps the values the focus; the change word carries the full color.
const rowTone = {
  added: "bg-[color-mix(in_oklch,var(--hui-color-background-success-primary)_50%,var(--hui-color-background-base-primary))]",
  removed: "bg-[color-mix(in_oklch,var(--hui-color-background-danger-primary)_50%,var(--hui-color-background-base-primary))]",
} as const

const changeText = {
  added: "text-[var(--hui-color-foreground-success-primary-hover)]",
  removed: "text-[var(--hui-color-foreground-danger-primary)]",
} as const

export type DiffTableProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** What the edit is, such as "Proposed menu cleanup". */
  title: string
  columns: DiffTableColumn[]
  rows: DiffTableRow[]
  /**
   * Receives the ids of the changed rows the person kept selected. Return a
   * promise to show progress; if it rejects, the selection is kept.
   */
  onApply: (includedRowIds: string[]) => void | Promise<void>
  labels?: Partial<DiffTableLabels>
}

/**
 * Row-level edits an agent proposes to a table. Every change starts selected;
 * the person clears the ones they do not want and then applies the rest.
 */
function DiffTable({
  title,
  columns,
  rows,
  onApply,
  labels: labelsProp,
  className,
  ...props
}: DiffTableProps) {
  const labels = React.useMemo(
    () => ({ ...defaultDiffTableLabels, ...labelsProp }),
    [labelsProp]
  )
  const [excluded, setExcluded] = React.useState<ReadonlySet<string>>(new Set())
  const [phase, setPhase] = React.useState<"editing" | "applying" | "applied" | "error">("editing")
  const titleId = React.useId()
  const statusRef = React.useRef<HTMLParagraphElement>(null)
  const applyRef = React.useRef<HTMLButtonElement>(null)
  // Apply goes away once the changes are in. If it had focus, hand focus to
  // the summary that replaces it rather than letting it fall to the page.
  const refocusStatus = React.useRef(false)
  React.useEffect(() => {
    if (phase !== "applied" || !refocusStatus.current) return
    refocusStatus.current = false
    statusRef.current?.focus()
  }, [phase])

  const changedRows = rows.filter((row) => row.change !== "unchanged")
  const included = changedRows.filter((row) => !excluded.has(row.id))
  const additions = included.filter((row) => row.change === "added").length
  const removals = included.length - additions
  const isLocked = phase === "applying" || phase === "applied"

  const apply = async () => {
    setPhase("applying")
    try {
      await onApply(included.map((row) => row.id))
      refocusStatus.current = document.activeElement === applyRef.current
      setPhase("applied")
    } catch {
      setPhase("error")
    }
  }

  return (
    <div
      data-slot="diff-table"
      data-phase={phase}
      className={cn(
        "@container/diff-table w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        regularText,
        edgeCells,
        className
      )}
      {...props}
    >
      <p
        id={titleId}
        className={cn(
          "m-0 border-b-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-4)] [font-weight:var(--hui-font-weight-medium)]",
          edgePadding
        )}
      >
        {title}
      </p>
      {/* Short values such as "EMEA" wrap between words, never mid-word. */}
      <Table aria-labelledby={titleId} className="[&_td]:[overflow-wrap:break-word]">
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className={headText}>{labels.change}</TableHead>
            {columns.map((column) => (
              <TableHead key={column.id} scope="col" className={headText}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isChange = row.change !== "unchanged"
            const isIncluded = isChange && !excluded.has(row.id)
            return (
              <TableRow
                key={row.id}
                data-change={row.change}
                data-included={isIncluded ? "" : undefined}
                className={cn(isIncluded && row.change !== "unchanged" && rowTone[row.change])}
              >
                <TableCell>
                  {isChange ? (
                    <label className="flex cursor-pointer items-center gap-[var(--hui-space-3)]">
                      <Checkbox
                        size="small"
                        disabled={isLocked}
                        // Once applied, the checks read as a record, not as controls to change.
                        className="data-disabled:border-[var(--hui-color-border-base-secondary)]! data-disabled:bg-[var(--hui-color-background-neutral-secondary)]! data-disabled:shadow-none! data-disabled:[&_*]:text-[var(--hui-color-foreground-base-secondary)]!"
                        checked={isIncluded}
                        aria-label={
                          row.change === "added"
                            ? labels.includeAdded(row.name)
                            : labels.includeRemoved(row.name)
                        }
                        onCheckedChange={(checked) => {
                          setExcluded((current) => {
                            const next = new Set(current)
                            if (checked) next.delete(row.id)
                            else next.add(row.id)
                            return next
                          })
                          if (phase === "error") setPhase("editing")
                        }}
                      />
                      {/* The word carries the change, so the row tint is never the only cue. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "whitespace-nowrap [font-weight:var(--hui-font-weight-medium)]",
                          isIncluded ? changeText[row.change as "added" | "removed"] : "text-[var(--hui-color-foreground-base-secondary)]"
                        )}
                      >
                        {row.change === "added" ? `+ ${labels.added}` : `− ${labels.removed}`}
                      </span>
                    </label>
                  ) : (
                    // The spacer holds a checkbox's width, so every change word starts on one line.
                    <span className="flex items-center gap-[var(--hui-space-3)] whitespace-nowrap text-[var(--hui-color-foreground-base-secondary)]">
                      <span aria-hidden="true" className="size-[var(--hui-space-4)] shrink-0" />
                      {labels.unchanged}
                    </span>
                  )}
                </TableCell>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      // The row's name is struck through; the other values stay readable for review.
                      isIncluded && row.change === "removed" && index === 0 && "line-through decoration-[var(--hui-color-foreground-danger-primary)]",
                      row.change !== "unchanged" && "text-[var(--hui-color-foreground-base-primary)]"
                    )}
                  >
                    {row.cells[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* On a narrow card the summary sits above the button, so neither clips. */}
      <div className={cn("flex flex-col items-start gap-[var(--hui-space-3)] border-t-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-3)] @sm/diff-table:flex-row @sm/diff-table:items-center", edgePadding)}>
        <p
          ref={statusRef}
          tabIndex={-1}
          role={phase === "error" ? "alert" : "status"}
          className="m-0 flex min-w-0 items-start @sm/diff-table:me-auto gap-[var(--hui-space-3)] rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)]"
        >
          {phase === "applied" ? (
            <>
              <CircleCheckIcon
                aria-hidden="true"
                className="mt-[3px] size-3.5 shrink-0 text-[var(--hui-color-foreground-success-primary)]"
              />
              <span className="text-[var(--hui-color-foreground-base-primary)]">
                {labels.applied(included.length)}
              </span>
            </>
          ) : phase === "error" ? (
            <>
              <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
                aria-hidden="true"
                className="mt-[3px] size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
              />
              <span className="min-w-0 text-[var(--hui-color-foreground-base-primary)]">{labels.error}</span>
            </>
          ) : (
            labels.summary(additions, removals)
          )}
        </p>
        {phase !== "applied" && (
          // aria-disabled while applying, so the pressed button keeps focus.
          <Button
            ref={applyRef}
            size="sm"
            disabled={included.length === 0}
            aria-disabled={phase === "applying" || undefined}
            className="aria-disabled:cursor-progress"
            onClick={() => {
              if (phase !== "applying") void apply()
            }}
          >
            {phase === "applying" && (
              <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
            )}
            {phase === "applying" ? labels.applying : labels.apply(included.length)}
          </Button>
        )}
      </div>
    </div>
  )
}

export { DiffTable }
