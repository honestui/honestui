"use client"

import * as React from "react"
import {
  ArrowUpRight as ArrowUpRightIcon,
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  LoaderCircle as LoaderCircleIcon,
  Search as SearchIcon,
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
  "[font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const rowText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/** A step uses the same row role as Tool Chips and Task Rows: a 14px label with a 12px detail. */
const stepText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

/** New rows fade in as the trace grows. Skipped when motion is reduced. */
const rowEnter =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-y-1 motion-safe:starting:opacity-0"

const statusTone: Record<ThinkingStatus, string> = {
  running: "text-[var(--hui-color-foreground-base-secondary)]",
  done: "text-[var(--hui-color-foreground-base-tertiary)]",
  error: "text-[var(--hui-color-foreground-danger-primary)]",
}

/** A finished step uses the same check, in the same color, as a finished task in Task Rows. */
const stepTone: Record<ThinkingStatus, string> = {
  ...statusTone,
  done: "text-[var(--hui-color-foreground-success-primary)]",
}

export type ThinkingStateProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What the agent is doing now. Drives the header treatment and the default open state. */
  status: ThinkingStatus
  /** The header text, such as "Thinking" or "Thought for 4 seconds". */
  label: string
  /** An icon before the label. The header shows none by default, and an alert icon on error. */
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

  const headerIcon = status === "error" ? <CircleAlertIcon strokeWidth={1.5} strokeLinecap="round" /> : icon

  const header = (
    <>
      {headerIcon && (
        <span aria-hidden="true" className={cn("flex shrink-0 [&_svg]:size-4", statusTone[status])}>
          {headerIcon}
        </span>
      )}
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
            className="group/thinking -mx-[var(--hui-space-2)] flex min-h-[var(--hui-control-height-sm,28px)] w-fit max-w-full cursor-pointer items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-0 bg-transparent px-[var(--hui-space-2)] py-[var(--hui-space-1)] text-left outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"
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
              className="m-0 ms-[var(--hui-space-2)] mt-[var(--hui-space-1)] flex list-none flex-col gap-[var(--hui-space-3)] border-s-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-secondary)] py-[var(--hui-space-2)] ps-[var(--hui-space-4)]"
            >
              {children}
            </ul>
          </CollapsiblePanel>
        </Collapsible>
      ) : (
        <div className="flex min-h-[var(--hui-control-height-sm,28px)] items-center gap-[var(--hui-space-3)] py-[var(--hui-space-1)]">{header}</div>
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
    status === "running" ? LoaderCircleIcon : status === "error" ? CircleAlertIcon : CircleCheckIcon

  return (
    <li
      data-slot="thinking-step"
      data-status={status}
      className={cn(
        "flex min-w-0 items-start gap-[var(--hui-space-3)]",
        stepText,
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
          "mt-[3px] size-3.5 shrink-0",
          stepTone[status],
          status === "running" && "motion-safe:animate-spin"
        )}
      />
      {/* Regular weight, so the trace stays under its medium header. */}
      <span className="min-w-0 break-words text-[var(--hui-color-foreground-base-primary)]">
        {children}
        <span className="sr-only"> ({statusLabel ?? defaultStepStatusLabel[status]})</span>
      </span>
      {detail !== undefined && (
        <span
          className={cn(
            // 2px down so the 16px detail sits on the first 20px label line.
            "mt-[2px] min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)]",
            !detailIsCode && rowText,
            detailIsCode &&
              "font-mono [font-size:var(--hui-font-size-mono-small)] [letter-spacing:var(--hui-letter-spacing-mono-small)] [line-height:var(--hui-line-height-mono-small)]"
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
        {/* The shared source anatomy: title, then host, then an external-link mark. */}
        <span
          title={typeof title === "string" ? title : undefined}
          className="min-w-0 truncate text-[var(--hui-color-foreground-base-primary)]"
        >
          {title}
        </span>
        {domain && (
          <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]">
            {domain}
          </span>
        )}
        <ArrowUpRightIcon
          aria-hidden="true"
          className="size-3 shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
        />
      </a>
    </li>
  )
}

export { ThinkingState, ThinkingStep, ThinkingText, ThinkingQuery, ThinkingSource }
