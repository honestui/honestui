"use client"

import * as React from "react"
import { Check as CheckIcon, Copy as CopyIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"
import { SyntaxLine, useSyntax } from "../lib/prose-syntax-react.js"

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

// A half-strength tint marks the line, and a full-strength sign column carries
// the change, so the code stays the brightest thing on the line in both themes.
const lineTone: Record<NonNullable<CodeDiffLine["kind"]>, string> = {
  context: "",
  added: "bg-[color-mix(in_oklch,var(--hui-color-background-success-primary)_50%,transparent)]",
  removed: "bg-[color-mix(in_oklch,var(--hui-color-background-danger-primary)_50%,transparent)]",
}

const signTone: Record<NonNullable<CodeDiffLine["kind"]>, string> = {
  context: "",
  added: "bg-[var(--hui-color-background-success-primary)] text-[var(--hui-color-foreground-success-primary-hover)]",
  removed: "bg-[var(--hui-color-background-danger-primary)] text-[var(--hui-color-foreground-danger-primary)]",
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
  /**
   * The language to highlight with Honest Prose Syntax, such as `"ts"`.
   * Defaults to the file name's extension. Pass `"plaintext"` for no colors.
   */
  language?: string
  /** Colors one line with your own highlighter. `index` counts the listed lines from zero. It replaces the built-in highlighting. */
  renderLine?: (text: string, index: number) => React.ReactNode
  /** Controls for the header, placed before Copy. */
  actions?: React.ReactNode
  /** Runs after the text reaches the clipboard. */
  onCopy?: (text: string) => void
  /** Drops the frame and the header, for a surface that supplies its own, such as an Artifact Panel. */
  embedded?: boolean
  labels?: Partial<CodeViewLabels>
}

/** The extension after the last dot, or nothing for names such as "Terminal". */
function languageFromFilename(filename: string) {
  const dot = filename.lastIndexOf(".")
  return dot > 0 && dot < filename.length - 1 ? filename.slice(dot + 1).toLowerCase() : undefined
}

/**
 * A file's code, or a diff of it, with line numbers and a copy button. Lines
 * are highlighted with Honest Prose Syntax unless `renderLine` supplies colors.
 */
function CodeView({
  filename,
  code = "",
  diff,
  language: languageProp,
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
  const language = languageProp ?? languageFromFilename(filename)
  // A diff is highlighted as one listing, removed lines included, so each line keeps its colors.
  const syntax = useSyntax(
    diff ? diff.map((line) => line.text).join("\n") : code,
    language,
    !renderLine
  )
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

  const [preRef, overflowing] = useOverflowing<HTMLPreElement>()

  const listing = (
    // A thin scrollbar and a fade at the end edge show there is more to scroll.
    // The fade follows the block's scroll position and clears at the end;
    // where scroll-driven animation is unsupported, or nothing overflows, it
    // stays hidden.
    <div className="relative min-w-0 [timeline-scope:--code-view-scroll]">
      {/* A tab stop only while it overflows, so a keyboard user can scroll long lines. */}
      <pre
        ref={preRef}
        tabIndex={overflowing ? 0 : undefined}
        aria-label={filename}
        className="m-0 overflow-x-auto py-[var(--hui-space-4)] font-mono outline-none [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)] [scroll-timeline:--code-view-scroll_inline] supports-[selector(::-webkit-scrollbar)]:[scrollbar-color:auto]! supports-[selector(::-webkit-scrollbar)]:[scrollbar-width:auto]! [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:mx-[var(--hui-space-4)] [&::-webkit-scrollbar-track]:mb-[var(--hui-space-1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--hui-color-overlay-base-a5)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"
      >
        <code
          className={cn(
            "block w-max min-w-full",
            // The theme colors the tokens; the surface and line height stay the block's own.
            !renderLine && "honest-syntax overflow-visible [--prose-syntax-background:transparent] [--prose-syntax-leading:var(--hui-line-height-mono-regular)]"
          )}
        >
          {lines.map((line, index) => {
            const kind = line.kind ?? "context"
            const tokens = syntax?.lines[index]
            return (
              <span key={index} data-kind={kind} className={cn("flex", lineTone[kind])}>
                <span
                  aria-hidden="true"
                  className="w-11 shrink-0 select-none pe-[var(--hui-space-4)] text-end tabular-nums text-[var(--hui-color-foreground-base-secondary)]"
                >
                  {lineNumbers[index] ?? ""}
                </span>
                {diff && (
                  <span className={cn("me-[var(--hui-space-3)] w-[3ch] shrink-0 select-none text-center", signTone[kind])}>
                    {lineSign[kind]}
                  </span>
                )}
                <span className="pe-[var(--hui-space-6)] whitespace-pre">
                  {renderLine ? renderLine(line.text, index) : tokens ? <SyntaxLine tokens={tokens} /> : line.text}
                  {"\n"}
                </span>
              </span>
            )
          })}
        </code>
      </pre>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-0 w-[var(--hui-space-8)] bg-[linear-gradient(to_left,var(--hui-color-background-base-primary),transparent)] opacity-0 rtl:bg-[linear-gradient(to_right,var(--hui-color-background-base-primary),transparent)]"
        style={{ animation: "hui-scroll-cue linear both", animationTimeline: "--code-view-scroll" }}
      />
    </div>
  )

  if (embedded) {
    return (
      <figure
        data-slot="code-view"
        data-embedded=""
        // `not-prose` keeps a prose around this figure from restyling its code.
        className={cn("not-prose m-0 w-full min-w-0 text-[var(--hui-color-foreground-base-primary)]", className)}
        {...props}
      >
        {listing}
      </figure>
    )
  }

  return (
    <figure
      data-slot="code-view"
      className={cn(
        // A shell with the header, around a panel with the code, shared with Prose Code Block.
        "not-prose m-0 w-full min-w-0 rounded-[var(--hui-radius-code-block)] bg-[var(--hui-color-background-neutral-primary)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]",
        className
      )}
      {...props}
    >
      <figcaption className="flex min-h-[var(--hui-control-height-sm)] min-w-0 items-center gap-[var(--hui-space-3)] ps-[var(--hui-space-4)]">
        <span className="min-w-0 truncate font-mono text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-small)]">
          {filename}
        </span>
        {diff && (
          <span className="shrink-0 [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
            <span className="text-[var(--hui-color-foreground-success-primary-hover)]">
              <span aria-hidden="true">+<span className="tabular-nums">{addedCount}</span></span>
              <span className="sr-only">{labels.added(addedCount)}</span>
            </span>{" "}
            <span className="text-[var(--hui-color-foreground-danger-primary)]">
              <span aria-hidden="true">−<span className="tabular-nums">{removedCount}</span></span>
              <span className="sr-only">{labels.removed(removedCount)}</span>
            </span>
          </span>
        )}
        <div className="ms-auto flex shrink-0 items-center gap-[var(--hui-space-2)]">
          {actions}
          {/* Icon only: the header already says what is copied. The name stays
              the same while the check shows; the status below announces it. */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.copy}
            title={labels.copy}
            className="text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)] [&_svg]:size-3.5"
            onClick={() => void copy()}
          >
            {copyState === "copied" ? (
              <CheckIcon aria-hidden="true" className="text-[var(--hui-color-foreground-success-primary)]" />
            ) : (
              <CopyIcon aria-hidden="true" />
            )}
          </Button>
        </div>
        <span role="status" className="sr-only">
          {copyState === "copied" ? labels.copied : copyState === "failed" ? labels.copyFailed : ""}
        </span>
      </figcaption>
      <div className="mt-[var(--hui-space-2)] overflow-hidden rounded-[var(--hui-radius-code-block-inner)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)]">
        {listing}
      </div>
      {copyState === "failed" && (
        <p className="m-0 px-[var(--hui-space-4)] pt-[var(--hui-space-3)] pb-[var(--hui-space-2)] text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
          {labels.copyFailed}
        </p>
      )}
    </figure>
  )
}

/**
 * Whether an element overflows, so it is a keyboard tab stop only while it has
 * something to scroll. The observer reports once on `observe`, then on resize.
 */
function useOverflowing<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [overflowing, setOverflowing] = React.useState(false)
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof ResizeObserver === "undefined") return
    const update = () => setOverflowing(node.scrollWidth > node.clientWidth + 1)
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => observer.disconnect()
  }, [])
  return [ref, overflowing] as const
}

export { CodeView }
