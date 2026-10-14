"use client"

import * as React from "react"
import { Check as CheckIcon, Copy as CopyIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type ProseCodeBlockLabels = {
  copy: string
  copied: string
  copyFailed: string
}

export const defaultProseCodeBlockLabels: ProseCodeBlockLabels = {
  copy: "Copy code",
  copied: "Copied",
  copyFailed: "Copy failed",
}

const COPIED_MILLISECONDS = 1500

export type ProseCodeBlockProps = Omit<React.ComponentProps<"figure">, "children" | "onCopy"> & {
  /** The language or file name, shown in the frame and used to name the code for assistive technology. */
  label: string
  code: string
  /** Colors one line. Without it, lines are plain text. */
  renderLine?: (text: string, index: number) => React.ReactNode
  /** Classes for the code surface, such as `honest-syntax`. */
  codeClassName?: string
  /** Attributes for the code surface, such as `data-syntax-palette`. */
  codeProps?: Omit<React.ComponentProps<"pre">, "children" | "className"> & { [attribute: `data-${string}`]: string | undefined }
  /** Controls placed before Copy. */
  actions?: React.ReactNode
  /** Runs after the text reaches the clipboard. */
  onCopy?: (text: string) => void
  labels?: Partial<ProseCodeBlockLabels>
}

/**
 * Code in a document, framed like the docs' code blocks: a shell with the
 * language and Copy, around a panel with the code. It does not highlight
 * syntax itself; pass `renderLine` and `codeClassName`.
 */
function ProseCodeBlock({
  label,
  code,
  renderLine,
  codeClassName,
  codeProps,
  actions,
  onCopy,
  labels: labelsProp,
  className,
  ...props
}: ProseCodeBlockProps) {
  const labels = { ...defaultProseCodeBlockLabels, ...labelsProp }
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle")
  const resetTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState("copied")
      onCopy?.(code)
    } catch {
      setCopyState("failed")
    }
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), COPIED_MILLISECONDS)
  }

  const lines = code.split("\n")
  return (
    <figure
      data-slot="prose-code-block"
      // `not-prose` keeps a prose around this figure from restyling its code.
      className={cn("not-prose m-0 w-full min-w-0 rounded-[8px] bg-[var(--hui-color-background-neutral-primary)] p-1 text-[var(--hui-color-foreground-base-primary)]", className)}
      {...props}
    >
      <figcaption className="flex min-w-0 items-center gap-[var(--hui-space-2)] py-0.5 ps-2.5 pe-0.5">
        <span className="min-w-0 truncate font-mono text-xs text-[var(--hui-color-foreground-base-secondary)]">{label}</span>
        <div className="ms-auto flex shrink-0 items-center gap-[var(--hui-space-2)]">
          {actions}
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded" aria-label={labels.copy} onClick={() => void copy()}>
            {copyState === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          </Button>
        </div>
        <span role="status" className="sr-only">
          {copyState === "copied" ? labels.copied : copyState === "failed" ? labels.copyFailed : ""}
        </span>
      </figcaption>
      {/* Focusable so a keyboard user can scroll long lines. The shell is the frame, so the panel keeps only its hairline. */}
      <pre
        tabIndex={0}
        aria-label={label}
        {...codeProps}
        className={cn(
          "m-0 mt-1 overflow-x-auto rounded-[5px] bg-[var(--hui-color-background-base-primary)] px-4 py-3.5 font-mono text-[0.8125rem] leading-[1.65] shadow-[inset_0_0_0_0.5px_var(--hui-color-border-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
          codeClassName,
          "[&&]:border-0! [&&]:rounded-[5px]!"
        )}
      >
        <code className="block w-max min-w-full">
          {lines.map((line, index) => (
            <React.Fragment key={index}>
              {renderLine ? renderLine(line, index) : line}
              {index < lines.length - 1 ? "\n" : null}
            </React.Fragment>
          ))}
        </code>
      </pre>
      {copyState === "failed" && (
        <p className="m-0 px-2.5 pt-1.5 pb-0.5 text-xs">{labels.copyFailed}</p>
      )}
    </figure>
  )
}

export { ProseCodeBlock }
