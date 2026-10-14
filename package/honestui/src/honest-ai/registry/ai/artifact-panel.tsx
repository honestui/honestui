"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  FileText as FileTextIcon,
  LoaderCircle as LoaderCircleIcon,
  PanelRight as PanelRightIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type ArtifactStatus = "streaming" | "complete" | "error"

export type ArtifactLabels = {
  open: string
  showing: string
  close: string
  streaming: string
  error: string
  retry: string
}

export const defaultArtifactLabels: ArtifactLabels = {
  open: "Open",
  showing: "Showing",
  close: "Close",
  streaming: "Writing…",
  error: "This stopped before it finished.",
  retry: "Try again",
}

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const miniText =
  "[font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]"

export type ArtifactPanelProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Names the artifact, such as a file name or a document title. */
  title: string
  /** A short note under the title, such as a file type or a version. */
  description?: string
  /** Defaults to "complete". Set "streaming" while the artifact is being written. */
  status?: ArtifactStatus
  /** Controls in the header, such as Copy or Download. */
  actions?: React.ReactNode
  /** Passing it shows Close. */
  onClose?: () => void
  /** Passing it shows Try again when `status` is "error". */
  onRetry?: () => void
  /** Removes the body's padding, for content that reaches the edges, such as an embedded Code View. */
  flush?: boolean
  /** Moves focus to the panel when it mounts. Set it when a person opened the panel, not when a reply did. */
  autoFocus?: boolean
  labels?: Partial<ArtifactLabels>
}

/**
 * A surface for something an agent made, such as a file or a document, that
 * sits beside the conversation. It frames the content you pass and reports the
 * status you give it. Where it sits, and when it shows, are your layout's.
 */
function ArtifactPanel({
  title,
  description,
  status = "complete",
  actions,
  onClose,
  onRetry,
  flush = false,
  autoFocus = false,
  labels: labelsProp,
  className,
  children,
  ...props
}: ArtifactPanelProps) {
  const labels = { ...defaultArtifactLabels, ...labelsProp }
  const rootRef = React.useRef<HTMLElement>(null)
  const titleId = React.useId()

  React.useEffect(() => {
    if (autoFocus) rootRef.current?.focus()
    // Focus moves once, when the panel appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section
      ref={rootRef}
      aria-labelledby={titleId}
      aria-busy={status === "streaming"}
      tabIndex={-1}
      data-slot="artifact-panel"
      data-status={status}
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-5)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)]",
        smallText,
        className
      )}
      {...props}
    >
      <div
        data-slot="artifact-panel-header"
        className="flex min-w-0 shrink-0 items-center gap-[var(--hui-space-3)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] ps-[var(--hui-space-4)] pe-[var(--hui-space-2)]"
      >
        <div className="min-w-0 flex-1">
          <p id={titleId} className="m-0 truncate [font-weight:var(--hui-font-weight-medium)]">
            {title}
          </p>
          {description && (
            <p className={cn("m-0 truncate text-[var(--hui-color-foreground-base-secondary)]", miniText)}>
              {description}
            </p>
          )}
        </div>
        {/* Always mounted, so the change to and from writing is announced. */}
        <span
          role="status"
          className="flex shrink-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]"
        >
          {status === "streaming" && (
            <>
              <LoaderCircleIcon aria-hidden="true" className="size-3.5 shrink-0 motion-safe:animate-spin" />
              {labels.streaming}
            </>
          )}
        </span>
        {(actions || onClose) && (
          <div className="flex shrink-0 items-center gap-[var(--hui-space-1)]">
            {actions}
            {onClose && (
              <Button variant="link" size="icon-sm" aria-label={labels.close} title={labels.close} onClick={onClose}>
                <CloseIcon aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-1)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] ps-[var(--hui-space-4)] pe-[var(--hui-space-2)]"
        >
          <span className="flex min-w-0 flex-1 items-start gap-[var(--hui-space-2)]">
            <CircleAlertIcon
              strokeWidth={1.5}
              strokeLinecap="round"
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
            />
            <span className="min-w-0 break-words">{labels.error}</span>
          </span>
          {onRetry && (
            <Button variant="link" size="sm" className="shrink-0" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </div>
      )}

      {/* Focusable so the content can be scrolled by keyboard. */}
      <div
        role="group"
        aria-labelledby={titleId}
        tabIndex={0}
        data-slot="artifact-panel-body"
        className={cn(
          "min-h-0 flex-1 overflow-auto outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
          !flush && "p-[var(--hui-space-4)]"
        )}
      >
        {children}
      </div>
    </section>
  )
}

export type ArtifactCardProps = Omit<React.ComponentProps<"button">, "children" | "title"> & {
  /** The same title as the panel it opens. */
  title: string
  /** A short note under the title. Replaced by the status while the artifact is unfinished. */
  description?: string
  status?: ArtifactStatus
  /** Whether this artifact's panel is showing. */
  isOpen?: boolean
  /** Replaces the document icon. */
  icon?: React.ReactNode
  labels?: Partial<ArtifactLabels>
}

/** The mention of an artifact inside a message. Pressing it is how its panel is opened again. */
function ArtifactCard({
  title,
  description,
  status = "complete",
  isOpen = false,
  icon,
  labels: labelsProp,
  className,
  ...props
}: ArtifactCardProps) {
  const labels = { ...defaultArtifactLabels, ...labelsProp }
  const note =
    status === "streaming" ? labels.streaming : status === "error" ? labels.error : description

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      data-slot="artifact-card"
      data-status={status}
      className={cn(
        "flex w-full max-w-sm min-w-0 cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-start text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] aria-expanded:border-[var(--hui-color-border-accent-emphasis)]",
        smallText,
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center text-[var(--hui-color-foreground-base-secondary)] [&_svg]:size-4"
      >
        {status === "streaming" ? (
          <LoaderCircleIcon className="motion-safe:animate-spin" />
        ) : status === "error" ? (
          <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" />
        ) : (
          (icon ?? <FileTextIcon />)
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate [font-weight:var(--hui-font-weight-medium)]">{title}</span>
        {note && (
          <span className={cn("truncate text-[var(--hui-color-foreground-base-secondary)]", miniText)}>
            {note}
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
          miniText
        )}
      >
        {isOpen ? labels.showing : labels.open}
        <PanelRightIcon aria-hidden="true" className="size-3.5 shrink-0" />
      </span>
    </button>
  )
}

export { ArtifactPanel, ArtifactCard }
