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
  copy: "Copy",
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
  const [preRef, overflowing] = useOverflowing<HTMLPreElement>()
  return (
    <figure
      data-slot="prose-code-block"
      // `not-prose` keeps a prose around this figure from restyling its code.
      // A shell with the header, around a panel with the code, shared with Code View.
      className={cn("not-prose m-0 w-full min-w-0 rounded-[var(--hui-radius-code-block)] bg-[var(--hui-color-background-neutral-primary)] p-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]", className)}
      {...props}
    >
      <figcaption className="flex min-h-[var(--hui-control-height-sm)] min-w-0 items-center gap-[var(--hui-space-3)] ps-[var(--hui-space-4)]">
        <span className="min-w-0 truncate font-mono text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-small)]">{label}</span>
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
      {/* A thin scrollbar and a fade at the end edge show there is more to scroll. The fade follows the
          panel's scroll position and clears at the end; where scroll-driven
          animation is unsupported, or nothing overflows, it stays hidden. */}
      <div className="relative mt-[var(--hui-space-2)] min-w-0 [timeline-scope:--prose-code-scroll]">
        {/* A tab stop only while it overflows, so a keyboard user can scroll long lines. The shell is the frame, so the panel keeps only its hairline. */}
        <pre
          tabIndex={overflowing ? 0 : undefined}
          aria-label={label}
          {...codeProps}
          ref={preRef}
          className={cn(
            "m-0 overflow-x-auto [scroll-timeline:--prose-code-scroll_inline] supports-[selector(::-webkit-scrollbar)]:[scrollbar-color:auto]! supports-[selector(::-webkit-scrollbar)]:[scrollbar-width:auto]! [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:mx-[var(--hui-space-4)] [&::-webkit-scrollbar-track]:mb-[var(--hui-space-1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--hui-color-overlay-base-a5)] rounded-[var(--hui-radius-code-block-inner)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] font-mono shadow-[inset_0_0_0_var(--hui-border-width-surface)_var(--hui-color-border-base-primary)] outline-none [font-variant-ligatures:none] [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-regular)] [--prose-syntax-leading:var(--hui-line-height-mono-regular)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
            codeClassName,
            // A syntax theme brings its own frame and size; the shell already frames the panel.
            "[&&]:border-0! [&&]:rounded-[var(--hui-radius-code-block-inner)]! [&&]:px-[var(--hui-space-5)]! [&&]:py-[var(--hui-space-4)]! [&&]:[font-size:var(--hui-font-size-mono-small)]!"
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[var(--hui-border-width-surface)] end-[var(--hui-border-width-surface)] w-[var(--hui-space-8)] rounded-e-[var(--hui-radius-code-block-inner)] bg-[linear-gradient(to_left,var(--hui-color-background-base-primary),transparent)] opacity-0 rtl:bg-[linear-gradient(to_right,var(--hui-color-background-base-primary),transparent)]"
          style={{ animation: "hui-scroll-cue linear both", animationTimeline: "--prose-code-scroll" }}
        />
      </div>
      {copyState === "failed" && (
        <p className="m-0 px-[var(--hui-space-4)] pt-[var(--hui-space-3)] pb-[var(--hui-space-2)] text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">{labels.copyFailed}</p>
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

export { ProseCodeBlock }
