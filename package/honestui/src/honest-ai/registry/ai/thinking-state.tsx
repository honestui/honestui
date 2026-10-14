"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  Globe as GlobeIcon,
  LoaderCircle as LoaderCircleIcon,
  Search as SearchIcon,
  Sparkles as SparklesIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { TextShimmer } from "../../components/animated/text-shimmer.js"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js"

export type ThinkingStatus = "running" | "done" | "error"

const labelText =
  "[font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const rowText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/** New rows fade in as the trace grows. Skipped when motion is reduced. */
const rowEnter =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-y-1 motion-safe:starting:opacity-0"

const statusTone: Record<ThinkingStatus, string> = {
  running: "text-[var(--hui-color-foreground-base-secondary)]",
  done: "text-[var(--hui-color-foreground-base-tertiary)]",
  error: "text-[var(--hui-color-foreground-danger-primary)]",
}

export type ThinkingStateProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What the agent is doing now. Drives the header treatment and the default open state. */
  status: ThinkingStatus
  /** The header text, such as "Thinking" or "Thought for 4 seconds". */
  label: string
  /** Replaces the header icon. */
  icon?: React.ReactNode
  /** Controls whether the trace is shown. */
  open?: boolean
  /** The initial open state. Without it, the trace is open while `status` is "running". */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The trace: `ThinkingStep`, `ThinkingText`, `ThinkingQuery`, and `ThinkingSource`. */
  children?: React.ReactNode
}

/**
 * A header that says what the agent is doing, with the trace behind it. The
 * trace follows `status` (open while running, closed once settled) until the
 * person opens or closes it, and their choice then stays.
 */
function ThinkingState({
  status,
  label,
  icon,
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  className,
  ...props
}: ThinkingStateProps) {
  const [chosenOpen, setChosenOpen] = React.useState(defaultOpen)
  const open = openProp ?? chosenOpen ?? status === "running"
  const hasTrace = React.Children.count(children) > 0

  // Announce the label only when it changes, so the first render is not read twice.
  const [announcement, setAnnouncement] = React.useState("")
  const previousLabel = React.useRef(label)
  React.useEffect(() => {
    if (previousLabel.current === label) return
    previousLabel.current = label
    setAnnouncement(label)
  }, [label])

  const header = (
    <>
      <span aria-hidden="true" className={cn("flex shrink-0 [&_svg]:size-4", statusTone[status])}>
        {status === "error" ? <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" /> : (icon ?? <SparklesIcon />)}
      </span>
      {status === "running" ? (
        <TextShimmer duration={1.6} className={labelText}>
          {label}
        </TextShimmer>
      ) : (
        <span
          className={cn(
            labelText,
            // The alert icon carries the danger color. The label keeps a text color that stays readable.
            status === "error"
              ? "text-[var(--hui-color-foreground-base-primary)]"
              : "text-[var(--hui-color-foreground-base-secondary)]"
          )}
        >
          {label}
        </span>
      )}
    </>
  )

  return (
    <div
      data-slot="thinking-state"
      data-status={status}
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    >
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {hasTrace ? (
        <Collapsible
          open={open}
          onOpenChange={(nextOpen) => {
            setChosenOpen(nextOpen)
            onOpenChange?.(nextOpen)
          }}
        >
          <CollapsibleTrigger
            data-slot="thinking-state-trigger"
            className="group/thinking -mx-[var(--hui-space-2)] flex w-fit max-w-full items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-2)] text-left outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"
          >
            {header}
            <ChevronDownIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/thinking:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <ul
              role="list"
              data-slot="thinking-state-trace"
              className="m-0 ms-[var(--hui-space-3)] mt-[var(--hui-space-2)] flex list-none flex-col gap-[var(--hui-space-2)] border-s border-[var(--hui-color-border-base-primary)] py-[var(--hui-space-2)] ps-[var(--hui-space-4)]"
            >
              {children}
            </ul>
          </CollapsiblePanel>
        </Collapsible>
      ) : (
        <div className="flex items-center gap-[var(--hui-space-3)] py-[var(--hui-space-2)]">{header}</div>
      )}
    </div>
  )
}

export type ThinkingStepProps = React.ComponentProps<"li"> & {
  /** Defaults to "done". */
  status?: ThinkingStatus
  /** Secondary text after the step, such as a count or a file name. */
  detail?: React.ReactNode
  /** Sets `detail` in the monospace face, for file names and commands. */
  detailIsCode?: boolean
  /** Replaces the words read for the step's status. */
  statusLabel?: string
}

const defaultStepStatusLabel: Record<ThinkingStatus, string> = {
  running: "In progress",
  done: "Done",
  error: "Failed",
}

/** One step of work, with an icon and words for whether it is running, done, or failed. */
function ThinkingStep({
  status = "done",
  detail,
  detailIsCode = false,
  statusLabel,
  className,
  children,
  ...props
}: ThinkingStepProps) {
  const Icon =
    status === "running" ? LoaderCircleIcon : status === "error" ? CircleAlertIcon : CheckIcon

  return (
    <li
      data-slot="thinking-step"
      data-status={status}
      className={cn(
        "flex min-w-0 items-start gap-[var(--hui-space-3)]",
        rowText,
        rowEnter,
        className
      )}
      {...props}
    >
      <Icon
        strokeWidth={1.5}
        strokeLinecap="round"
        aria-hidden="true"
        className={cn(
          "mt-px size-3.5 shrink-0",
          statusTone[status],
          status === "running" && "motion-safe:animate-spin"
        )}
      />
      <span className="min-w-0 break-words text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)]">
        {children}
        <span className="sr-only"> ({statusLabel ?? defaultStepStatusLabel[status]})</span>
      </span>
      {detail !== undefined && (
        <span
          className={cn(
            "min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]",
            detailIsCode && "font-mono [font-size:var(--hui-font-size-mono-mini)]"
          )}
        >
          {detail}
        </span>
      )}
    </li>
  )
}

/** A paragraph of reasoning. */
function ThinkingText({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="thinking-text"
      className={cn(
        "min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-regular)]",
        rowEnter,
        className
      )}
      {...props}
    />
  )
}

export type ThinkingQueryProps = React.ComponentProps<"li"> & {
  /** Read before the query, so the row is not just a bare phrase. */
  prefix?: string
}

/** The search the agent ran. */
function ThinkingQuery({ prefix = "Searched for", className, children, ...props }: ThinkingQueryProps) {
  return (
    <li
      data-slot="thinking-query"
      className={cn(
        "flex min-w-0 items-start gap-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]",
        rowText,
        rowEnter,
        className
      )}
      {...props}
    >
      <SearchIcon
        aria-hidden="true"
        className="mt-px size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
      />
      <span className="min-w-0 break-words">
        <span className="sr-only">{prefix} </span>
        {children}
      </span>
    </li>
  )
}

export type ThinkingSourceProps = Omit<React.ComponentProps<"a">, "title"> & {
  href: string
  /** The page or site name. */
  title: React.ReactNode
  /** The host, shown after the title. */
  domain?: string
}

/** A page the agent read, as a link. Other anchor props pass through. */
function ThinkingSource({ title, domain, className, ...props }: ThinkingSourceProps) {
  return (
    <li data-slot="thinking-source" className={cn("min-w-0", rowEnter)}>
      <a
        className={cn(
          "group/source -mx-[var(--hui-space-2)] flex min-w-0 items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] px-[var(--hui-space-2)] py-[var(--hui-space-1)] no-underline outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]",
          rowText,
          className
        )}
        {...props}
      >
        <GlobeIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]"
        />
        <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-primary)] underline decoration-[var(--hui-color-border-base-secondary)] underline-offset-2 [font-weight:var(--hui-font-weight-medium)] group-hover/source:decoration-current">
          {title}
        </span>
        {domain && (
          <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">{domain}</span>
        )}
      </a>
    </li>
  )
}

export { ThinkingState, ThinkingStep, ThinkingText, ThinkingQuery, ThinkingSource }
