"use client"

import * as React from "react"
import { Check as CheckIcon, Code as CodeIcon, Copy as CopyIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type CodeDiffLine = {
  text: string
  /** Defaults to "context". */
  kind?: "context" | "added" | "removed"
}

export type CodeViewLabels = {
  copy: string
  copied: string
  copyFailed: string
  added: (count: number) => string
  removed: (count: number) => string
}

export const defaultCodeViewLabels: CodeViewLabels = {
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Copy failed",
  added: (count) => `${count} added`,
  removed: (count) => `${count} removed`,
}

const COPIED_MILLISECONDS = 1500

// Changed lines keep the primary text color on a tint, which stays readable at this size.
const lineTone: Record<NonNullable<CodeDiffLine["kind"]>, string> = {
  context: "",
  added: "bg-[var(--hui-color-background-success-primary)]",
  removed: "bg-[var(--hui-color-background-danger-primary)]",
}

const lineSign: Record<NonNullable<CodeDiffLine["kind"]>, string> = {
  context: " ",
  added: "+",
  removed: "−",
}

export type CodeViewProps = Omit<React.ComponentProps<"figure">, "children" | "onCopy"> & {
  /** The file name or a short title, shown in the header. */
  filename: string
  /** The source to list, with line numbers. Ignored when `diff` is passed. */
  code?: string
  /** A unified diff. Each changed line is marked with a sign and a tint. */
  diff?: CodeDiffLine[]
  /** Colors one line. `index` counts the listed lines from zero. Without it, lines are plain text. */
  renderLine?: (text: string, index: number) => React.ReactNode
  /** Controls for the header, placed before Copy. */
  actions?: React.ReactNode
  /** Runs after the text reaches the clipboard. */
  onCopy?: (text: string) => void
  /** Drops the frame and the header, for a surface that supplies its own, such as an Artifact Panel. */
  embedded?: boolean
  labels?: Partial<CodeViewLabels>
}

/**
 * A file's code, or a diff of it, with a copy button. It does not highlight
 * syntax itself; pass `renderLine` to use the highlighter you already have.
 */
function CodeView({
  filename,
  code = "",
  diff,
  renderLine,
  actions,
  onCopy,
  embedded = false,
  labels: labelsProp,
  className,
  ...props
}: CodeViewProps) {
  const labels = React.useMemo(
    () => ({ ...defaultCodeViewLabels, ...labelsProp }),
    [labelsProp]
  )
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const lines: CodeDiffLine[] = diff ?? code.split("\n").map((text) => ({ text }))
  // Copy what the file would contain: a diff's removed lines are left out.
  const copyText = diff
    ? diff
        .filter((line) => line.kind !== "removed")
        .map((line) => line.text)
        .join("\n")
    : code
  const addedCount = diff?.filter((line) => line.kind === "added").length ?? 0
  const removedCount = diff?.filter((line) => line.kind === "removed").length ?? 0

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopyState("copied")
      onCopy?.(copyText)
    } catch {
      setCopyState("failed")
    }
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), COPIED_MILLISECONDS)
  }

  // Removed lines are not in the new file, so they take no number.
  const lineNumbers: (number | null)[] = []
  for (const line of lines) {
    const previous = lineNumbers.findLast((value) => value !== null) ?? 0
    lineNumbers.push(line.kind === "removed" ? null : previous + 1)
  }

  return (
    <figure
      data-slot="code-view"
      data-embedded={embedded ? "" : undefined}
      className={cn(
        // `not-prose` keeps a prose around this figure from restyling its code.
        "not-prose m-0 w-full min-w-0 text-[var(--hui-color-foreground-base-primary)]",
        !embedded &&
          "overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      {!embedded && (
        <figcaption className="flex min-w-0 items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] ps-[var(--hui-space-4)] pe-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)]">
          <CodeIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
          />
          <span className="min-w-0 truncate font-mono [font-size:var(--hui-font-size-mono-small)]">
            {filename}
          </span>
          {diff && (
            <span className="shrink-0 font-mono tabular-nums [font-size:var(--hui-font-size-mono-mini)]">
              <span className="text-[var(--hui-color-foreground-success-primary-hover)]">
                <span aria-hidden="true">+{addedCount}</span>
                <span className="sr-only">{labels.added(addedCount)}</span>
              </span>{" "}
              <span className="text-[var(--hui-color-foreground-danger-primary-hover)]">
                <span aria-hidden="true">−{removedCount}</span>
                <span className="sr-only">{labels.removed(removedCount)}</span>
              </span>
            </span>
          )}
          <div className="ms-auto flex shrink-0 items-center gap-[var(--hui-space-2)]">
            {actions}
            <Button variant="link" size="sm" onClick={() => void copy()}>
              {copyState === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
              {labels.copy}
            </Button>
          </div>
          <span role="status" className="sr-only">
            {copyState === "copied" ? labels.copied : copyState === "failed" ? labels.copyFailed : ""}
          </span>
        </figcaption>
      )}
      {!embedded && copyState === "failed" && (
        <p className="m-0 border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-small)]">
          {labels.copyFailed}
        </p>
      )}
      {/* Focusable so a keyboard user can scroll long lines. */}
      <pre
        tabIndex={0}
        aria-label={filename}
        className="m-0 overflow-x-auto py-[var(--hui-space-3)] font-mono outline-none [font-size:var(--hui-font-size-mono-small)] [line-height:1.65] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
      >
        <code className="block w-max min-w-full">
          {lines.map((line, index) => {
            const kind = line.kind ?? "context"
            return (
              <span key={index} data-kind={kind} className={cn("flex", lineTone[kind])}>
                <span
                  aria-hidden="true"
                  className="w-10 shrink-0 select-none pe-[var(--hui-space-3)] text-end tabular-nums text-[var(--hui-color-foreground-base-secondary)]"
                >
                  {lineNumbers[index] ?? ""}
                </span>
                {diff && <span className="w-[2ch] shrink-0 select-none">{lineSign[kind]}</span>}
                <span className="pe-[var(--hui-space-4)] whitespace-pre">
                  {renderLine ? renderLine(line.text, index) : line.text}
                  {"\n"}
                </span>
              </span>
            )
          })}
        </code>
      </pre>
    </figure>
  )
}

export { CodeView }
