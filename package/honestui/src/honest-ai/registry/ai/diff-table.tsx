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

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

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

  const changedRows = rows.filter((row) => row.change !== "unchanged")
  const included = changedRows.filter((row) => !excluded.has(row.id))
  const additions = included.filter((row) => row.change === "added").length
  const removals = included.length - additions
  const isLocked = phase === "applying" || phase === "applied"

  const apply = async () => {
    setPhase("applying")
    try {
      await onApply(included.map((row) => row.id))
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
        "w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        smallText,
        className
      )}
      {...props}
    >
      <p
        id={titleId}
        className="m-0 border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] [font-weight:var(--hui-font-weight-medium)]"
      >
        {title}
      </p>
      <Table aria-labelledby={titleId}>
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
                className={cn(
                  isIncluded && row.change === "added" && "bg-[var(--hui-color-background-success-primary)]",
                  isIncluded && row.change === "removed" && "bg-[var(--hui-color-background-danger-primary)]"
                )}
              >
                <TableCell>
                  {isChange ? (
                    <label className="flex cursor-pointer items-center gap-[var(--hui-space-3)]">
                      <Checkbox
                        size="small"
                        disabled={isLocked}
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
                      <span aria-hidden="true" className="[font-weight:var(--hui-font-weight-medium)]">
                        {row.change === "added" ? `+ ${labels.added}` : `− ${labels.removed}`}
                      </span>
                    </label>
                  ) : (
                    <span className="text-[var(--hui-color-foreground-base-secondary)]">
                      {labels.unchanged}
                    </span>
                  )}
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(isIncluded && row.change === "removed" && "line-through")}
                  >
                    {row.cells[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-end gap-[var(--hui-space-3)] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
        <p
          role={phase === "error" ? "alert" : "status"}
          className="m-0 me-auto flex min-w-0 items-start gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]"
        >
          {phase === "applied" ? (
            <>
              <CircleCheckIcon
                aria-hidden="true"
                className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-success-primary)]"
              />
              <span className="text-[var(--hui-color-foreground-base-primary)]">
                {labels.applied(included.length)}
              </span>
            </>
          ) : phase === "error" ? (
            <>
              <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
                aria-hidden="true"
                className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
              />
              <span className="min-w-0 text-[var(--hui-color-foreground-base-primary)]">{labels.error}</span>
            </>
          ) : (
            labels.summary(additions, removals)
          )}
        </p>
        {(
          <Button size="sm" disabled={included.length === 0 || isLocked} onClick={() => void apply()}>
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
