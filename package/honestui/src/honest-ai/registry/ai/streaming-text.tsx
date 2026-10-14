"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  Copy as CopyIcon,
  CornerDownRight as CornerDownRightIcon,
  Globe as GlobeIcon,
  RotateCcw as RotateCcwIcon,
  ThumbsDown as ThumbsDownIcon,
  ThumbsUp as ThumbsUpIcon,
} from "honestui/icons"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "../../lib/ease.js"
import { cn } from "../../lib/utils.js"
import { buttonVariants } from "../../components/ui/button.js"

export type StreamingTextStatus = "streaming" | "complete" | "error"

export type StreamingTextFeedback = "up" | "down" | null

export type StreamingSource = {
  href: string
  title: string
  domain?: string
}

export type StreamingTextLabels = {
  copy: string
  copied: string
  copyFailed: string
  retry: string
  helpful: string
  notHelpful: string
  sources: (count: number) => string
  error: string
}

export const defaultStreamingTextLabels: StreamingTextLabels = {
  copy: "Copy reply",
  copied: "Copied",
  copyFailed: "Copy failed",
  retry: "Try again",
  helpful: "Helpful",
  notHelpful: "Not helpful",
  sources: (count) => (count === 1 ? "1 source" : `${count} sources`),
  error: "This reply stopped before it finished.",
}

const COPIED_MILLISECONDS = 1600

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const interactive =
  "outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"

// `prose`, from prose.css, styles the output of a Markdown renderer, so a
// reply needs no wrapper of its own. A Markdown component draws the caret
// itself, at the end of its last line.
const contentStyles = "honest-prose [&:has([data-slot=markdown])>[data-slot=streaming-text-caret]]:hidden"

const DEFAULT_CHARACTERS_PER_SECOND = 110

/**
 * Paces text that arrives in uneven chunks, so it appears at a steady rate.
 * It only ever shows text you have already received, and it catches up when
 * the stream ends. With reduced motion it returns the text as it is.
 *
 * `isSettled` turns true once everything received has been shown, which is
 * the moment to mark a reply complete.
 */
function useSmoothStream(
  text: string,
  { charactersPerSecond = DEFAULT_CHARACTERS_PER_SECOND }: { charactersPerSecond?: number } = {}
) {
  const shouldReduceMotion = useReducedMotion() ?? false
  const [shownLength, setShownLength] = React.useState(0)
  // Text that got shorter is a new reply, so the reveal starts over from its length.
  if (shownLength > text.length) setShownLength(text.length)
  const visibleLength = Math.min(shownLength, text.length)
  const isBehind = visibleLength < text.length

  React.useEffect(() => {
    if (shouldReduceMotion || !isBehind) return

    let frame = 0
    let previousTime: number | undefined
    let position = visibleLength

    const step = (time: number) => {
      const elapsed = previousTime === undefined ? 0 : time - previousTime
      previousTime = time
      position = Math.min(position + (elapsed / 1000) * charactersPerSecond, text.length)
      setShownLength(Math.floor(position))
      if (position < text.length) frame = window.requestAnimationFrame(step)
    }

    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
    // `visibleLength` is read once per run as the starting point; listing it would restart the loop every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, charactersPerSecond, shouldReduceMotion, isBehind])

  if (shouldReduceMotion) return { text, isSettled: true }

  return { text: text.slice(0, visibleLength), isSettled: !isBehind }
}

/** An icon button in the action row, with a spring on press. */
function ActionButton({
  label,
  isPressed,
  className,
  children,
  onClick,
}: {
  label: string
  /** Set on toggle buttons only. */
  isPressed?: boolean
  className?: string
  children: React.ReactNode
  onClick: () => void
}) {
  const shouldReduceMotion = useReducedMotion() ?? false

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isPressed}
      onClick={onClick}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
      transition={SPRING_PRESS}
      className={cn(
        buttonVariants({ variant: "link", size: "icon-sm" }),
        // The spring handles the press, so the CSS press scale is turned off.
        "active:scale-100! aria-pressed:bg-[var(--hui-color-background-neutral-secondary)]",
        className
      )}
    >
      {children}
    </motion.button>
  )
}

export type StreamingTextProps = Omit<React.ComponentProps<"div">, "onCopy"> & {
  /** The reply so far: plain text, or the output of a Markdown renderer. */
  children: React.ReactNode
  /** Defaults to "complete". Set "streaming" while text is still arriving. */
  status?: StreamingTextStatus
  /** The plain text the Copy action puts on the clipboard. Passing it shows Copy. */
  copyText?: string
  /** Replaces the clipboard write. Throw, or reject, to report a failed copy. */
  onCopy?: () => void | Promise<void>
  /** Passing it shows Try again once the reply has settled. */
  onRetry?: () => void
  /** Shown as a disclosure under the reply once it has settled. */
  sources?: StreamingSource[]
  sourcesOpen?: boolean
  defaultSourcesOpen?: boolean
  onSourcesOpenChange?: (open: boolean) => void
  feedback?: StreamingTextFeedback
  defaultFeedback?: StreamingTextFeedback
  /** Passing it shows the two feedback buttons on a complete reply. */
  onFeedbackChange?: (feedback: StreamingTextFeedback) => void
  /** Set false when a surrounding log, such as Chat Thread, already announces the text. */
  announce?: boolean
  /** Hides the actions and the sources without changing `status`. */
  showActions?: boolean
  contentClassName?: string
  labels?: Partial<StreamingTextLabels>
}

/**
 * A reply as it arrives, then the actions that apply to it: copy, try again,
 * feedback, and its sources. It renders the text it is given and reveals
 * nothing on its own schedule. Each action appears only when you handle it.
 */
function StreamingText({
  children,
  status = "complete",
  copyText,
  onCopy,
  onRetry,
  sources = [],
  sourcesOpen,
  defaultSourcesOpen = false,
  onSourcesOpenChange,
  feedback: feedbackProp,
  defaultFeedback = null,
  onFeedbackChange,
  announce = true,
  showActions = true,
  contentClassName,
  labels: labelsProp,
  className,
  ...props
}: StreamingTextProps) {
  const labels = React.useMemo(
    () => ({ ...defaultStreamingTextLabels, ...labelsProp }),
    [labelsProp]
  )
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle")
  const [uncontrolledFeedback, setUncontrolledFeedback] = React.useState(defaultFeedback)
  const [uncontrolledSourcesOpen, setUncontrolledSourcesOpen] = React.useState(defaultSourcesOpen)
  const shouldReduceMotion = useReducedMotion() ?? false
  const sourcesId = React.useId()
  const copyTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const isStreaming = status === "streaming"
  const feedback = feedbackProp !== undefined ? feedbackProp : uncontrolledFeedback
  const canCopy = copyText !== undefined || onCopy !== undefined
  // Feedback is for a reply that finished, and only when something records it.
  const canRate = status === "complete" && (onFeedbackChange !== undefined || feedbackProp !== undefined)
  const hasSources = sources.length > 0
  const isSourcesOpen = sourcesOpen ?? uncontrolledSourcesOpen
  const hasActions =
    showActions && !isStreaming && (canCopy || onRetry !== undefined || canRate || hasSources)

  const copy = async () => {
    try {
      if (onCopy) await onCopy()
      else await navigator.clipboard.writeText(copyText ?? "")
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), COPIED_MILLISECONDS)
  }

  const toggleSources = () => {
    if (sourcesOpen === undefined) setUncontrolledSourcesOpen(!isSourcesOpen)
    onSourcesOpenChange?.(!isSourcesOpen)
  }

  const rate = (value: "up" | "down") => {
    // Pressing the chosen rating again clears it.
    const next = feedback === value ? null : value
    if (feedbackProp === undefined) setUncontrolledFeedback(next)
    onFeedbackChange?.(next)
  }

  return (
    <div
      data-slot="streaming-text"
      data-status={status}
      aria-busy={isStreaming}
      className={cn("flex w-full min-w-0 flex-col gap-[var(--hui-space-3)]", className)}
      {...props}
    >
      <div
        data-slot="streaming-text-content"
        aria-live={announce ? "polite" : "off"}
        className={cn(contentStyles, contentClassName)}
      >
        {children}
        {isStreaming && (
          <span
            aria-hidden="true"
            data-slot="streaming-text-caret"
            className="ms-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] rounded-full bg-[var(--hui-color-foreground-base-primary)] "
          />
        )}
      </div>

      {status === "error" && (
        <p role="alert" className={cn("m-0 flex items-start gap-[var(--hui-space-2)]", smallText)}>
          <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round"
            aria-hidden="true"
            className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
          />
          <span className="min-w-0 break-words">{labels.error}</span>
        </p>
      )}

      <AnimatePresence initial={false}>
        {hasActions && (
          <motion.div
            key="actions"
            data-slot="streaming-text-actions"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.12 : 0.22, ease: EASE_OUT }}
            className={smallText}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-1)]">
              {canCopy && (
                <ActionButton label={labels.copy} onClick={() => void copy()}>
                  {/* The two icons trade places, so the change reads as a result of the press. */}
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={copyState === "copied" ? "copied" : "copy"}
                      aria-hidden="true"
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      transition={shouldReduceMotion ? { duration: 0.1 } : SPRING_SWAP}
                      className="flex [&_svg]:size-4"
                    >
                      {copyState === "copied" ? <CheckIcon /> : <CopyIcon />}
                    </motion.span>
                  </AnimatePresence>
                </ActionButton>
              )}
              {onRetry && (
                <ActionButton label={labels.retry} onClick={onRetry}>
                  <RotateCcwIcon aria-hidden="true" />
                </ActionButton>
              )}
              {canRate && (
                <>
                  <ActionButton
                    label={labels.helpful}
                    isPressed={feedback === "up"}
                    onClick={() => rate("up")}
                  >
                    <ThumbsUpIcon aria-hidden="true" />
                  </ActionButton>
                  <ActionButton
                    label={labels.notHelpful}
                    isPressed={feedback === "down"}
                    onClick={() => rate("down")}
                  >
                    <ThumbsDownIcon aria-hidden="true" />
                  </ActionButton>
                </>
              )}
              {hasSources && (
                <button
                  type="button"
                  data-slot="streaming-text-sources-trigger"
                  aria-expanded={isSourcesOpen}
                  aria-controls={sourcesId}
                  onClick={toggleSources}
                  className={cn(
                    "ms-[var(--hui-space-1)] inline-flex cursor-pointer items-center gap-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
                    interactive
                  )}
                >
                  <GlobeIcon aria-hidden="true" className="size-3.5 shrink-0" />
                  {labels.sources(sources.length)}
                  <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{ rotate: isSourcesOpen ? 180 : 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : SPRING_SWAP}
                    className="flex"
                  >
                    <ChevronDownIcon className="size-3.5 shrink-0" />
                  </motion.span>
                </button>
              )}
              {/* Mounted with the actions, so a copy is announced when it happens. */}
              <span role="status" className={copyState === "failed" ? "ms-[var(--hui-space-2)]" : "sr-only"}>
                {copyState === "copied" ? labels.copied : copyState === "failed" ? labels.copyFailed : ""}
              </span>
            </div>

            {hasSources && (
              // The wrapper is always mounted, so the button's `aria-controls` always points at something.
              <div id={sourcesId}>
                <AnimatePresence initial={false}>
                  {isSourcesOpen && (
                    <motion.div
                      key="sources"
                      initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -4 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -4 }}
                      transition={{ duration: shouldReduceMotion ? 0.12 : 0.22, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <ul
                        role="list"
                        data-slot="streaming-text-sources"
                        className="m-0 mt-[var(--hui-space-2)] flex list-none flex-col rounded-[var(--hui-radius-3)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-2)]"
                      >
                        {sources.map((source, index) => (
                          <motion.li
                            key={source.href}
                            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: EASE_OUT, delay: 0.04 * index }}
                            className="min-w-0"
                          >
                            <a
                              href={source.href}
                              className={cn(
                                "flex min-w-0 items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-3)] py-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] no-underline!",
                                interactive
                              )}
                            >
                              <span className="min-w-0 truncate underline decoration-[var(--hui-color-border-base-secondary)] underline-offset-2">
                                {source.title}
                              </span>
                              {source.domain && (
                                <span className="ms-auto shrink-0 font-mono text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mono-mini)]">
                                  {source.domain}
                                </span>
                              )}
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export type StreamingCitationProps = React.ComponentProps<"a"> & {
  href: string
}

/** An inline source link, placed in the text where the claim is made. */
function StreamingCitation({ className, children, ...props }: StreamingCitationProps) {
  return (
    <a
      data-slot="streaming-citation"
      className={cn(
        "mx-0.5 inline-flex items-center gap-[var(--hui-space-1)] rounded-[var(--hui-radius-1)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-2)] align-baseline font-mono text-[var(--hui-color-foreground-base-secondary)] no-underline! [font-size:var(--hui-font-size-mono-mini)] [line-height:var(--hui-line-height-small)] hover:text-[var(--hui-color-foreground-base-primary)]",
        interactive,
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export type StreamingFollowUpsProps = Omit<React.ComponentProps<"div">, "children" | "onSelect"> & {
  /** Suggested next prompts. */
  prompts: string[]
  onSelect: (prompt: string) => void
  /** The heading above the prompts. */
  label?: string
}

/** Prompts the person can send next. Render it once the reply has finished. */
function StreamingFollowUps({
  prompts,
  onSelect,
  label = "Follow-ups",
  className,
  ...props
}: StreamingFollowUpsProps) {
  const headingId = React.useId()
  if (prompts.length === 0) return null

  return (
    <div data-slot="streaming-follow-ups" className={cn("min-w-0", smallText, className)} {...props}>
      <p
        id={headingId}
        className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-medium)]"
      >
        {label}
      </p>
      <ul
        role="list"
        aria-labelledby={headingId}
        className="m-0 mt-[var(--hui-space-2)] flex list-none flex-col gap-[var(--hui-space-1)] p-0"
      >
        {prompts.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onSelect(prompt)}
              className={cn(
                "-mx-[var(--hui-space-2)] flex w-[calc(100%+var(--hui-space-2)*2)] cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-2)] text-left text-[var(--hui-color-foreground-base-primary)]",
                interactive
              )}
            >
              <CornerDownRightIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
              />
              <span className="min-w-0 break-words">{prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { StreamingText, StreamingCitation, StreamingFollowUps, useSmoothStream }
