"use client"

import * as React from "react"
import {
  ArrowDown as ArrowDownIcon,
  Check as CheckIcon,
  Copy as CopyIcon,
  LoaderCircle as LoaderCircleIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type TerminalLine = {
  text: string
  /** Defaults to "stdout". Error output is colored. */
  stream?: "stdout" | "stderr"
}

export type TerminalOutputLabels = {
  output: string
  copy: string
  copied: string
  copyFailed: string
  running: string
  jumpToLatest: string
  exitCode: (code: number) => string
  showEarlier: (count: number) => string
  showLess: string
  finished: (code: number) => string
  formatDuration: (milliseconds: number) => string
}

function formatDuration(milliseconds: number) {
  if (milliseconds < 1000) return `${Math.max(0, Math.round(milliseconds))}ms`
  const seconds = milliseconds / 1000
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.floor(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
}

/** Whole seconds, so the running clock does not flicker. */
function formatClock(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export const defaultTerminalOutputLabels: TerminalOutputLabels = {
  output: "Output",
  copy: "Copy output",
  copied: "Copied",
  copyFailed: "Copy failed",
  running: "Running",
  jumpToLatest: "Jump to latest",
  exitCode: (code) => `Exit ${code}`,
  showEarlier: (count) => `Show ${count} earlier ${count === 1 ? "line" : "lines"}`,
  showLess: "Show less",
  finished: (code) => (code === 0 ? "Command finished" : `Command failed with exit code ${code}`),
  formatDuration,
}

const COPIED_MILLISECONDS = 1500
/** How close to the end, in pixels, still counts as following the output. */
const FOLLOW_SLACK = 24

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const monoText =
  "font-mono [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)]"

export type TerminalOutputProps = Omit<React.ComponentProps<"figure">, "children" | "onCopy"> & {
  /** The command that ran, shown after a prompt sign. */
  command: string
  /** The working directory, shown before the command. */
  cwd?: string
  /** Output lines, in the order they arrived. Append to stream more. */
  lines: TerminalLine[]
  /** The exit code. While it is missing, the command counts as running. */
  exitCode?: number
  /** Overrides the running state, for a command whose exit code is unknown. */
  running?: boolean
  /** When the command started, in milliseconds since the epoch. The running clock counts from it. */
  startedAt?: number
  /** How long the command took, in milliseconds, shown once it finishes. */
  duration?: number
  /** After the command finishes, longer output shows only its last lines until expanded. */
  collapsedLines?: number
  /** Controls for the header, placed before Copy. */
  actions?: React.ReactNode
  onCopy?: (text: string) => void
  labels?: Partial<TerminalOutputLabels>
}

/**
 * A command and its output. While it runs, the output follows the newest
 * line, unless the reader scrolls up; then a button offers to jump back down.
 */
function TerminalOutput({
  command,
  cwd,
  lines,
  exitCode,
  running: runningProp,
  startedAt,
  duration,
  collapsedLines = 20,
  actions,
  onCopy,
  labels: labelsProp,
  className,
  ...props
}: TerminalOutputProps) {
  const labels = React.useMemo(() => ({ ...defaultTerminalOutputLabels, ...labelsProp }), [labelsProp])
  const running = runningProp ?? exitCode === undefined
  const failed = !running && exitCode !== undefined && exitCode !== 0

  // The clock counts from `startedAt`, or from when this output first showed.
  const [mountedAt] = React.useState(() => Date.now())
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [running])
  const elapsed = now - (startedAt ?? mountedAt)

  const [expanded, setExpanded] = React.useState(false)
  const hiddenCount = !running && !expanded ? Math.max(0, lines.length - collapsedLines) : 0
  const shown = hiddenCount > 0 ? lines.slice(hiddenCount) : lines

  // Follow the end while the reader is at it; stop when they scroll up.
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [following, setFollowing] = React.useState(true)
  const followingRef = React.useRef(true)
  const onScroll = () => {
    const node = scrollRef.current
    if (!node) return
    const atEnd = node.scrollHeight - node.scrollTop - node.clientHeight <= FOLLOW_SLACK
    followingRef.current = atEnd
    setFollowing(atEnd)
  }
  React.useLayoutEffect(() => {
    const node = scrollRef.current
    if (node && followingRef.current) node.scrollTop = node.scrollHeight
  }, [lines.length, hiddenCount])
  const jumpToLatest = () => {
    const node = scrollRef.current
    if (!node) return
    followingRef.current = true
    setFollowing(true)
    node.scrollTo({ top: node.scrollHeight })
  }

  const [scrollable, setScrollable] = React.useState(false)
  React.useEffect(() => {
    const node = scrollRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const update = () => setScrollable(node.scrollHeight > node.clientHeight + 1)
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => observer.disconnect()
  }, [])

  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), [])
  const copy = async () => {
    const text = lines.map((line) => line.text).join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopyState("copied")
      onCopy?.(text)
    } catch {
      setCopyState("failed")
    }
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), COPIED_MILLISECONDS)
  }

  const outputId = React.useId()

  return (
    <figure
      data-slot="terminal-output"
      data-state={running ? "running" : failed ? "failed" : "done"}
      className={cn(
        "not-prose m-0 w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <figcaption className="flex min-h-[var(--hui-space-10)] min-w-0 items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] ps-[var(--hui-space-5)] pe-[var(--hui-space-3)]">
        <span data-slot="terminal-output-command" className={cn("flex min-w-0 items-baseline gap-[var(--hui-space-3)]", monoText)}>
          {cwd && <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">{cwd}</span>}
          <span aria-hidden="true" className="shrink-0 select-none text-[var(--hui-color-foreground-base-secondary)]">
            $
          </span>
          <span className="min-w-0 truncate" title={command}>
            {command}
          </span>
        </span>
        <div className="ms-auto flex shrink-0 items-center gap-[var(--hui-space-3)]">
          <span
            data-slot="terminal-output-status"
            className={cn(
              "flex items-center gap-[var(--hui-space-2)] tabular-nums",
              metaText,
              failed ? "text-[var(--hui-color-foreground-danger-primary)]" : "text-[var(--hui-color-foreground-base-secondary)]"
            )}
          >
            {running ? (
              <>
                <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
                <span>
                  {labels.running} <span className="tabular-nums">{formatClock(elapsed)}</span>
                </span>
              </>
            ) : (
              <>
                {exitCode !== undefined && <span>{labels.exitCode(exitCode)}</span>}
                {exitCode !== undefined && duration !== undefined && <span aria-hidden="true">·</span>}
                {duration !== undefined && <span>{labels.formatDuration(duration)}</span>}
              </>
            )}
          </span>
          <div className="flex items-center gap-[var(--hui-space-2)]">
            {actions}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.copy}
              title={labels.copy}
              disabled={lines.length === 0}
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
        </div>
        <span role="status" className="sr-only">
          {copyState === "copied"
            ? labels.copied
            : copyState === "failed"
              ? labels.copyFailed
              : !running && exitCode !== undefined
                ? labels.finished(exitCode)
                : ""}
        </span>
      </figcaption>
      {lines.length > 0 && (
        <div className="relative min-w-0">
          {(hiddenCount > 0 || (expanded && lines.length > collapsedLines && !running)) && (
            <button
              type="button"
              aria-controls={outputId}
              aria-expanded={expanded}
              className={cn(
                "flex w-full items-center border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] text-start text-[var(--hui-color-foreground-base-secondary)] hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
                metaText
              )}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? labels.showLess : labels.showEarlier(hiddenCount)}
            </button>
          )}
          <div
            ref={scrollRef}
            id={outputId}
            // A group, not a region: several outputs on a page would repeat a landmark name.
            role="group"
            aria-label={labels.output}
            tabIndex={scrollable ? 0 : undefined}
            onScroll={onScroll}
            className="max-h-80 overflow-auto outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)] [&::-webkit-scrollbar]:size-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--hui-color-overlay-base-a5)]"
          >
            <pre data-slot="terminal-output-lines" className={cn("m-0 w-max min-w-full py-[var(--hui-space-4)]", monoText)}>
              {shown.map((line, index) => (
                <span
                  key={hiddenCount + index}
                  data-stream={line.stream ?? "stdout"}
                  className={cn(
                    "block px-[var(--hui-space-5)] whitespace-pre",
                    line.stream === "stderr"
                      ? "text-[var(--hui-color-foreground-danger-primary)]"
                      : "text-[var(--hui-color-foreground-base-primary)]"
                  )}
                >
                  {line.text || " "}
                  {"\n"}
                </span>
              ))}
            </pre>
          </div>
          {!following && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[var(--hui-space-3)] flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="pointer-events-auto rounded-full bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]"
                onClick={jumpToLatest}
              >
                <ArrowDownIcon aria-hidden="true" />
                {labels.jumpToLatest}
              </Button>
            </div>
          )}
        </div>
      )}
      {copyState === "failed" && (
        <p className={cn("m-0 border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-danger-primary)]", metaText)}>
          {labels.copyFailed}
        </p>
      )}
    </figure>
  )
}

export { TerminalOutput }
