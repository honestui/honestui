"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  CircleX as CircleXIcon,
  Copy as CopyIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export type StackFrame = {
  /** The function, method, or `<anonymous>`. Missing when the engine gave none. */
  functionName?: string
  /** The file path or URL the frame points at. */
  file: string
  line?: number
  column?: number
  /** Code you did not write, such as `node_modules` or Node internals. Library frames collapse. */
  library?: boolean
  /** The frame's original line. */
  raw?: string
}

export type ParsedStackTrace = {
  /** The error's class, such as `TypeError`. */
  name: string
  message: string
  frames: StackFrame[]
}

export type StackTraceLabels = {
  copy: string
  copied: string
  copyFailed: string
  /** The list of frames. */
  frames: string
  libraryFrames: (count: number) => string
  hideLibraryFrames: (count: number) => string
  openFrame: (frame: StackFrame) => string
}

export const defaultStackTraceLabels: StackTraceLabels = {
  copy: "Copy stack trace",
  copied: "Copied",
  copyFailed: "Copy failed",
  frames: "Stack frames",
  libraryFrames: (count) => `${count} library ${count === 1 ? "frame" : "frames"}`,
  hideLibraryFrames: (count) => `Hide ${count} library ${count === 1 ? "frame" : "frames"}`,
  openFrame: (frame) => `Open ${formatLocation(frame)}`,
}

const LIBRARY_PATTERN =
  /(^|[\\/])node_modules[\\/]|^node:|^internal[\\/]|^native$|^<anonymous>$|\[native code\]|^webpack[\\/]|^(?:chrome|moz)-extension:/

/** Whether a file path belongs to code you did not write. */
export function isLibraryFile(file: string) {
  return LIBRARY_PATTERN.test(file)
}

// V8 (Chrome, Node, Edge): "    at fn (file:1:2)", "    at file:1:2", "    at async fn (file:1:2)".
const V8_FRAME = /^\s*at\s+(?:(.+?)\s+\((.+?)\)|(.+?))\s*$/
// SpiderMonkey and JavaScriptCore: "fn@file:1:2", "@file:1:2".
const GECKO_FRAME = /^\s*([^@\s]*)@(.+?)\s*$/
const LOCATION = /^(.*?)(?::(\d+))?(?::(\d+))?$/

function splitLocation(location: string) {
  const match = LOCATION.exec(location)
  const file = match?.[1] || location
  return {
    file,
    line: match?.[2] ? Number(match[2]) : undefined,
    column: match?.[3] ? Number(match[3]) : undefined,
  }
}

function parseFrame(text: string): StackFrame | null {
  const v8 = /^\s*at\s/.test(text) ? V8_FRAME.exec(text) : null
  if (v8) {
    const functionName = v8[1]?.replace(/^async\s+/, "").trim()
    const location = (v8[2] ?? v8[3] ?? "").replace(/^eval at .*?,\s*/, "")
    const { file, line, column } = splitLocation(location)
    return { functionName: functionName || undefined, file, line, column, library: isLibraryFile(file), raw: text.trim() }
  }
  const gecko = GECKO_FRAME.exec(text)
  if (gecko) {
    const { file, line, column } = splitLocation(gecko[2])
    // A Gecko frame always ends in a line number, which keeps a message with an "@" out.
    if (line === undefined) return null
    return { functionName: gecko[1] || undefined, file, line, column, library: isLibraryFile(file), raw: text.trim() }
  }
  return null
}

/**
 * Reads a JavaScript stack string, from V8, SpiderMonkey, or JavaScriptCore,
 * into the error's name, its message, and its frames. Lines it cannot read are
 * kept in the message when they come before the first frame, and dropped after.
 */
export function parseStackTrace(stack: string): ParsedStackTrace {
  const lines = stack.replace(/\r\n?/g, "\n").split("\n")
  const frames: StackFrame[] = []
  const head: string[] = []
  for (const line of lines) {
    const frame = parseFrame(line)
    if (frame) frames.push(frame)
    else if (frames.length === 0 && line.trim()) head.push(line)
  }
  const first = head.join("\n")
  const header = /^([A-Za-z_$][\w$.]*(?:Error|Exception|Warning)?):\s?([\s\S]*)$/.exec(first)
  if (header && /^[A-Z]/.test(header[1])) {
    return { name: header[1], message: header[2].trim(), frames }
  }
  return { name: "Error", message: first.trim(), frames }
}

function formatLocation(frame: StackFrame) {
  return [frame.file, frame.line, frame.column].filter((part) => part !== undefined).join(":")
}

function formatTrace(trace: ParsedStackTrace) {
  return [
    trace.message ? `${trace.name}: ${trace.message}` : trace.name,
    ...trace.frames.map((frame) =>
      frame.functionName ? `    at ${frame.functionName} (${formatLocation(frame)})` : `    at ${formatLocation(frame)}`
    ),
  ].join("\n")
}

/** Groups neighboring library frames, so each run of them folds into one row. */
function groupFrames(frames: StackFrame[]) {
  const groups: ({ kind: "app"; frame: StackFrame; index: number } | { kind: "library"; frames: { frame: StackFrame; index: number }[]; start: number })[] = []
  frames.forEach((frame, index) => {
    const last = groups.at(-1)
    if (frame.library) {
      if (last?.kind === "library") last.frames.push({ frame, index })
      else groups.push({ kind: "library", frames: [{ frame, index }], start: index })
    } else {
      groups.push({ kind: "app", frame, index })
    }
  })
  return groups
}

const COPIED_MILLISECONDS = 1500

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const monoText =
  "font-mono [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)]"
const rowFocus =
  "outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]"

export type StackTraceProps = Omit<React.ComponentProps<"div">, "children" | "onCopy"> & {
  /** A raw stack string, such as `error.stack`. Read with `parseStackTrace`. */
  stack?: string
  /** An already parsed trace. Takes the place of `stack`. */
  trace?: ParsedStackTrace
  /** Runs when a frame is chosen. Without it, frames are plain text. */
  onFrameClick?: (frame: StackFrame, index: number) => void
  /** Starts with every run of library frames open. */
  defaultShowLibraryFrames?: boolean
  /** Controls for the header, placed before Copy. */
  actions?: React.ReactNode
  onCopy?: (text: string) => void
  labels?: Partial<StackTraceLabels>
}

/**
 * An error's name and message over its frames. Your frames show in full;
 * neighboring library frames fold into one row that opens on request.
 */
function StackTrace({
  stack,
  trace: traceProp,
  onFrameClick,
  defaultShowLibraryFrames = false,
  actions,
  onCopy,
  labels: labelsProp,
  className,
  ...props
}: StackTraceProps) {
  const labels = React.useMemo(() => ({ ...defaultStackTraceLabels, ...labelsProp }), [labelsProp])
  const trace = React.useMemo(
    () => traceProp ?? parseStackTrace(stack ?? ""),
    [traceProp, stack]
  )
  const groups = React.useMemo(() => groupFrames(trace.frames), [trace.frames])
  const [openGroups, setOpenGroups] = React.useState<Set<number>>(() =>
    defaultShowLibraryFrames ? new Set(groups.filter((g) => g.kind === "library").map((g) => (g as { start: number }).start)) : new Set()
  )
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), [])
  const headingId = React.useId()

  const copy = async () => {
    const text = stack?.trim() ? stack : formatTrace(trace)
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

  const toggleGroup = (start: number) =>
    setOpenGroups((current) => {
      const next = new Set(current)
      if (next.has(start)) next.delete(start)
      else next.add(start)
      return next
    })

  const firstAppIndex = trace.frames.findIndex((frame) => !frame.library)

  const renderFrame = (frame: StackFrame, index: number) => {
    const content = (
      <>
        <span
          className={cn(
            "min-w-0 truncate",
            frame.library ? "text-[var(--hui-color-foreground-base-secondary)]" : "text-[var(--hui-color-foreground-base-primary)]",
            index === firstAppIndex && "font-medium"
          )}
        >
          {frame.functionName ?? "<anonymous>"}
        </span>
        <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]" title={formatLocation(frame)}>
          {formatLocation(frame)}
        </span>
      </>
    )
    const rowClass = cn(
      "grid w-full min-w-0 grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline gap-x-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] text-start",
      monoText,
      frame.library && "ps-[var(--hui-space-8)]"
    )
    return (
      <li key={index} data-slot="stack-trace-frame" data-library={frame.library ? "" : undefined} className="min-w-0">
        {onFrameClick ? (
          <button
            type="button"
            aria-label={labels.openFrame(frame)}
            className={cn(rowClass, rowFocus, "cursor-pointer hover:bg-[var(--hui-color-background-base-primary-hover)]")}
            onClick={() => onFrameClick(frame, index)}
          >
            {content}
          </button>
        ) : (
          <div className={rowClass}>{content}</div>
        )}
      </li>
    )
  }

  return (
    // A named group rather than a landmark or a heading, so it fits any page outline.
    <div
      role="group"
      data-slot="stack-trace"
      aria-labelledby={headingId}
      className={cn(
        "not-prose w-full min-w-0 overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      <header className="flex min-w-0 items-start gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-4)] ps-[var(--hui-space-5)] pe-[var(--hui-space-3)]">
        <CircleXIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--hui-color-foreground-danger-primary)]" />
        <div className="min-w-0 flex-1">
          <p
            id={headingId}
            data-slot="stack-trace-name"
            className="m-0 font-mono font-medium text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)]"
          >
            {trace.name}
          </p>
          {trace.message && (
            <p
              data-slot="stack-trace-message"
              className="m-0 mt-[var(--hui-space-1)] break-words whitespace-pre-wrap text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"
            >
              {trace.message}
            </p>
          )}
        </div>
        <div className="-mt-1 flex shrink-0 items-center gap-[var(--hui-space-2)]">
          {actions}
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
      </header>
      {trace.frames.length > 0 && (
        <ol aria-label={labels.frames} className="m-0 list-none p-0 py-[var(--hui-space-2)]">
          {groups.map((group) => {
            if (group.kind === "app") return renderFrame(group.frame, group.index)
            const open = openGroups.has(group.start)
            const count = group.frames.length
            const panelId = `${headingId}-library-${group.start}`
            return (
              <li key={`library-${group.start}`} data-slot="stack-trace-library" className="min-w-0">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={open ? panelId : undefined}
                  className={cn(
                    "flex w-full items-center gap-[var(--hui-space-2)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] text-start text-[var(--hui-color-foreground-base-secondary)] hover:bg-[var(--hui-color-background-base-primary-hover)] hover:text-[var(--hui-color-foreground-base-primary)]",
                    metaText,
                    rowFocus
                  )}
                  onClick={() => toggleGroup(group.start)}
                >
                  <ChevronRightIcon
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform",
                      open && "rotate-90 rtl:rotate-90",
                      !open && "rtl:rotate-180"
                    )}
                  />
                  {open ? labels.hideLibraryFrames(count) : labels.libraryFrames(count)}
                </button>
                {open && (
                  <ol id={panelId} className="m-0 list-none p-0">
                    {group.frames.map(({ frame, index }) => renderFrame(frame, index))}
                  </ol>
                )}
              </li>
            )
          })}
        </ol>
      )}
      {copyState === "failed" && (
        <p className={cn("m-0 border-t-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)] text-[var(--hui-color-foreground-danger-primary)]", metaText)}>
          {labels.copyFailed}
        </p>
      )}
    </div>
  )
}

export { StackTrace }
