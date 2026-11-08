"use client"

import * as React from "react"
import {
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  LoaderCircle as LoaderCircleIcon,
  CircleCheck as CircleCheckIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js"
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover.js"

export type ToolLine = {
  text: string
  /** Defaults to "context". */
  kind?: "context" | "added" | "removed"
}

export type ToolCall = {
  id: string
  /** What the tool did, such as "Read image" or "Write 204 lines". */
  label: string
  /** The object of the call: a file name, a command, or a short note. */
  detail?: string
  /** Sets `detail` in the monospace face. */
  detailIsCode?: boolean
  /** Defaults to "done". */
  status?: "running" | "done" | "error"
  icon?: React.ReactNode
  /** What the call returned. A call with output can be expanded. */
  output?: ToolLine[]
  /** Sets `output` in the monospace face. */
  outputIsCode?: boolean
}

export type FileChange = {
  path: string
  added: number
  removed: number
  /** The diff. A change with lines shows them on hover, focus, or press. */
  lines?: ToolLine[]
}

export type ToolChipsLabels = {
  running: string
  failed: string
  changes: string
  showMoreChanges: (hiddenCount: number) => string
  diffFor: (path: string) => string
  added: (count: number) => string
  removed: (count: number) => string
}

export const defaultToolChipsLabels: ToolChipsLabels = {
  running: "Running",
  failed: "Failed",
  changes: "Files changed",
  showMoreChanges: (hiddenCount) => `Show ${hiddenCount} more`,
  diffFor: (path) => `Changes to ${path}`,
  added: (count) => `${count} added`,
  removed: (count) => `${count} removed`,
}

const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const codeText =
  "font-mono [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)]"

const interactiveRow =
  "border-0 bg-transparent outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"

const rowEnter =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-y-1 motion-safe:starting:opacity-0"

// Changed lines keep the primary text color on a half-strength tint, so the
// text stays the brightest thing on the line in both themes. The sign takes
// the change's color, so the tint is never the only cue.
const lineTone: Record<NonNullable<ToolLine["kind"]>, string> = {
  context: "text-[var(--hui-color-foreground-base-secondary)]",
  added: "bg-[color-mix(in_oklch,var(--hui-color-background-success-primary)_50%,transparent)] text-[var(--hui-color-foreground-base-primary)]",
  removed: "bg-[color-mix(in_oklch,var(--hui-color-background-danger-primary)_50%,transparent)] text-[var(--hui-color-foreground-base-primary)]",
}

const signTone: Record<NonNullable<ToolLine["kind"]>, string> = {
  context: "",
  added: "text-[var(--hui-color-foreground-success-primary-hover)]",
  removed: "text-[var(--hui-color-foreground-danger-primary)]",
}

// Step 11 of each scale: the readable text color on a page or a light tint, in both themes.
const addedCountTone = "text-[var(--hui-color-foreground-success-primary-hover)]"
const removedCountTone = "text-[var(--hui-color-foreground-danger-primary)]"

// The path is an identifier, so it is mono; the counts are figures, so they are not.
const countText =
  "[font-family:var(--hui-font-body)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)]"

const lineSign: Record<NonNullable<ToolLine["kind"]>, string> = {
  context: " ",
  added: "+",
  removed: "−",
}

export type ToolChipsProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The header text, such as "4 tool calls". */
  summary: string
  calls: ToolCall[]
  /** Files the run edited, shown as chips under the calls. */
  changes?: FileChange[]
  /** How many file chips to show before the rest move behind a button. */
  maxVisibleChanges?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  labels?: Partial<ToolChipsLabels>
}

/**
 * An agent run as a list of tool calls, followed by the files it changed.
 * The list shows whatever `calls` holds, so append to the array as calls
 * arrive and update each call's `status` as it settles.
 */
function ToolChips({
  summary,
  calls,
  changes = [],
  maxVisibleChanges = 3,
  open,
  defaultOpen = true,
  onOpenChange,
  labels: labelsProp,
  className,
  ...props
}: ToolChipsProps) {
  const labels = React.useMemo(
    () => ({ ...defaultToolChipsLabels, ...labelsProp }),
    [labelsProp]
  )
  const [showAllChanges, setShowAllChanges] = React.useState(false)
  const visibleChanges = showAllChanges ? changes : changes.slice(0, maxVisibleChanges)
  const hiddenCount = changes.length - visibleChanges.length

  return (
    <div
      data-slot="tool-chips"
      className={cn(
        "flex w-full min-w-0 flex-col text-[var(--hui-color-foreground-base-primary)]",
        rowText,
        className
      )}
      {...props}
    >
      <Collapsible open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          data-slot="tool-chips-trigger"
          className={cn(
            "group/summary -mx-[var(--hui-space-2)] flex w-fit max-w-full items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-2)] py-[var(--hui-space-2)] text-left text-[var(--hui-color-foreground-base-secondary)]",
            interactiveRow
          )}
        >
          <span className="min-w-0 truncate" title={summary}>{summary}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/summary:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <ul
            role="list"
            data-slot="tool-chips-calls"
            className="m-0 flex list-none flex-col gap-[var(--hui-space-1)] p-0 pt-[var(--hui-space-2)]"
          >
            {calls.map((call) => (
              <ToolCallRow key={call.id} call={call} labels={labels} />
            ))}
          </ul>
          {changes.length > 0 && (
            <div
              role="group"
              aria-label={labels.changes}
              data-slot="tool-chips-changes"
              className="mt-[var(--hui-space-3)] flex min-w-0 flex-wrap items-center gap-[var(--hui-space-3)] border-t-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] pt-[var(--hui-space-4)]"
            >
              {visibleChanges.map((change) => (
                <FileChangeChip key={change.path} change={change} labels={labels} />
              ))}
              {hiddenCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllChanges(true)}
                  className="text-[var(--hui-color-foreground-base-secondary)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)]"
                >
                  {labels.showMoreChanges(hiddenCount)}
                </Button>
              )}
            </div>
          )}
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}

function ToolCallRow({ call, labels }: { call: ToolCall; labels: ToolChipsLabels }) {
  const status = call.status ?? "done"
  const hasOutput = Boolean(call.output?.length)

  const summary = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center [&_svg]:size-3.5",
          status === "error"
            ? "text-[var(--hui-color-foreground-danger-primary)]"
            : status === "done" && !call.icon
              ? "text-[var(--hui-color-foreground-success-primary)]"
              : "text-[var(--hui-color-foreground-base-tertiary)]"
        )}
      >
        {status === "running" ? (
          <LoaderCircleIcon className="motion-safe:animate-spin" />
        ) : status === "error" ? (
          <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" />
        ) : (
          // Without the tool's own icon, the shared done check; a wrench would read as "configure".
          (call.icon ?? <CircleCheckIcon strokeWidth={1.5} strokeLinecap="round" />)
        )}
      </span>
      <span className="shrink-0 [font-weight:var(--hui-font-weight-medium)]">
        {call.label}
        {status !== "done" && (
          <span className="sr-only"> ({status === "running" ? labels.running : labels.failed})</span>
        )}
      </span>
      {call.detail && (
        // Plain secondary text, so the call's name leads and the detail follows it.
        <span
          className={cn(
            "min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]",
            call.detailIsCode && codeText
          )}
          title={call.detail}
        >
          {call.detail}
        </span>
      )}
    </>
  )

  const rowLayout =
    "flex w-full min-w-0 items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-2)] py-[var(--hui-space-2)] text-left"

  if (!hasOutput) {
    return (
      <li data-slot="tool-call" data-status={status} className={cn(rowLayout, rowEnter)}>
        {summary}
      </li>
    )
  }

  return (
    <li data-slot="tool-call" data-status={status} className={cn("min-w-0", rowEnter)}>
      <Collapsible>
        <CollapsibleTrigger className={cn("group/call", rowLayout, interactiveRow)}>
          {summary}
          <ChevronDownIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/call:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <ToolLines
            lines={call.output ?? []}
            isCode={call.outputIsCode}
            className="ms-[var(--hui-space-4)] mt-[var(--hui-space-1)] mb-[var(--hui-space-2)] border-s-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-secondary)] ps-[var(--hui-space-3)]"
          />
        </CollapsiblePanel>
      </Collapsible>
    </li>
  )
}

function ToolLines({
  lines,
  isCode = false,
  className,
}: {
  lines: ToolLine[]
  isCode?: boolean
  className?: string
}) {
  const hasChanges = lines.some((line) => line.kind === "added" || line.kind === "removed")

  return (
    <div className={cn("flex min-w-0 flex-col overflow-x-auto", isCode && codeText, className)}>
      {lines.map((line, index) => {
        const kind = line.kind ?? "context"
        return (
          <div
            key={index}
            className={cn(
              "flex gap-[var(--hui-space-3)] px-[var(--hui-space-3)]",
              isCode ? "whitespace-pre [line-height:var(--hui-line-height-mono-regular)]" : "break-words [line-height:var(--hui-line-height-regular)]",
              lineTone[kind]
            )}
          >
            {/* The sign carries the meaning, so the tint is never the only cue. */}
            {hasChanges && <span className={cn("w-[1ch] shrink-0 select-none", signTone[kind])}>{lineSign[kind]}</span>}
            <span className="min-w-0">{line.text}</span>
          </div>
        )
      })}
    </div>
  )
}

function FileChangeChip({ change, labels }: { change: FileChange; labels: ToolChipsLabels }) {
  const chipLayout = cn(
    "inline-flex max-w-full items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-secondary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)] [line-height:var(--hui-line-height-mono-small)]",
    codeText
  )
  const counts = (
    <>
      <span className="min-w-0 truncate">{change.path}</span>
      {/* Each count shows only when it is not zero. */}
      {change.added > 0 && (
        <span className={cn("shrink-0", countText, addedCountTone)}>
          <span aria-hidden="true">+<span className="tabular-nums">{change.added}</span></span>
          <span className="sr-only">{labels.added(change.added)}</span>
        </span>
      )}
      {change.removed > 0 && (
        <span className={cn("shrink-0", countText, removedCountTone)}>
          <span aria-hidden="true">−<span className="tabular-nums">{change.removed}</span></span>
          <span className="sr-only">{labels.removed(change.removed)}</span>
        </span>
      )}
    </>
  )

  if (!change.lines?.length) {
    return (
      // The chip truncates a long path; the title keeps the whole of it.
      <span data-slot="tool-chips-change" className={chipLayout} title={change.path}>
        {counts}
      </span>
    )
  }

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        data-slot="tool-chips-change"
        className={cn(
          chipLayout,
          "cursor-pointer outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] data-popup-open:bg-[var(--hui-color-background-base-primary-hover)]"
        )}
      >
        {counts}
      </PopoverTrigger>
      <PopoverPopup
        align="start"
        aria-label={labels.diffFor(change.path)}
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
      >
        {/* The same header as Code View: the file and its counts above the lines. */}
        <div
          aria-hidden="true"
          className={cn(
            "flex min-w-0 items-center gap-[var(--hui-space-3)] border-b-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-overlay)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [line-height:var(--hui-line-height-mono-small)]",
            codeText
          )}
        >
          {/* The full path wraps here, so similar names can be told apart. */}
          <span className="min-w-0 break-all">{change.path}</span>
          <span className={cn("ms-auto flex shrink-0 gap-[var(--hui-space-2)]", countText)}>
            {change.added > 0 && (
              <span className={addedCountTone}>+<span className="tabular-nums">{change.added}</span></span>
            )}
            {change.removed > 0 && (
              <span className={removedCountTone}>−<span className="tabular-nums">{change.removed}</span></span>
            )}
          </span>
        </div>
        <ToolLines lines={change.lines} isCode className="py-[var(--hui-space-3)]" />
      </PopoverPopup>
    </Popover>
  )
}

export { ToolChips }
