"use client"

import * as React from "react"
import {
  ChevronDown as ChevronDownIcon,
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  CircleDashed as CircleDashedIcon,
  LoaderCircle as LoaderCircleIcon,
} from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button, buttonVariants } from "../../components/ui/button.js"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js"

export type TaskStatus = "queued" | "running" | "done" | "error"

export type TaskDetail = {
  label: string
  /** A count, a percentage, or a short state, shown at the end of the line. */
  value?: string
}

export type Task = {
  id: string
  label: string
  status: TaskStatus
  /** A short quantity shown after the label, such as "12 suppliers". */
  summary?: string
  /** What the task is made of. A task with details can be expanded. */
  details?: TaskDetail[]
}

export type TaskRowsLabels = Record<TaskStatus, string> & {
  retry: string
}

export const defaultTaskRowsLabels: TaskRowsLabels = {
  queued: "Queued",
  running: "Running",
  done: "Completed",
  error: "Failed",
  retry: "Try again",
}

const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

const statusIcon: Record<TaskStatus, { Icon: typeof CircleCheckIcon; className: string }> = {
  queued: { Icon: CircleDashedIcon, className: "text-[var(--hui-color-foreground-base-tertiary)]" },
  running: {
    Icon: LoaderCircleIcon,
    className: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  },
  done: { Icon: CircleCheckIcon, className: "text-[var(--hui-color-foreground-success-primary)]" },
  error: { Icon: CircleAlertIcon, className: "text-[var(--hui-color-foreground-danger-primary)]" },
}

export type TaskRowsProps = Omit<React.ComponentProps<"ul">, "children"> & {
  tasks: Task[]
  /** "cards" separates the tasks. "list" joins them in one bordered block. */
  variant?: "cards" | "list"
  /** Passing it shows Retry on every failed task. */
  onRetry?: (taskId: string) => void
  labels?: Partial<TaskRowsLabels>
}

/**
 * The tasks in an agent run and where each one stands. It shows the status
 * you pass for each task; update the array as your agent reports progress.
 */
function TaskRows({
  tasks,
  variant = "cards",
  onRetry,
  labels: labelsProp,
  className,
  ...props
}: TaskRowsProps) {
  const labels = React.useMemo(
    () => ({ ...defaultTaskRowsLabels, ...labelsProp }),
    [labelsProp]
  )
  const isList = variant === "list"

  return (
    <ul
      role="list"
      data-slot="task-rows"
      data-variant={variant}
      className={cn(
        "m-0 flex w-full min-w-0 list-none flex-col p-0 text-[var(--hui-color-foreground-base-primary)]",
        rowText,
        isList
          ? "overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)]"
          : "gap-[var(--hui-space-3)]",
        className
      )}
      {...props}
    >
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} isList={isList} labels={labels} onRetry={onRetry} />
      ))}
    </ul>
  )
}

function TaskRow({
  task,
  isList,
  labels,
  onRetry,
}: {
  task: Task
  isList: boolean
  labels: TaskRowsLabels
  onRetry?: (taskId: string) => void
}) {
  const { Icon, className: iconClassName } = statusIcon[task.status]
  const hasDetails = Boolean(task.details?.length)
  const canRetry = task.status === "error" && onRetry !== undefined

  const summary = (
    <>
      <Icon strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" className={cn("size-4 shrink-0", iconClassName)} />
      {/* The full name stays available when the row truncates it. */}
      <span title={task.label} className="min-w-0 flex-1 truncate [font-weight:var(--hui-font-weight-medium)]">
        {task.label}
      </span>
      {/* The summary gives way first, so a narrow row keeps the task's name. */}
      {task.summary && (
        <span
          className={cn(
            "hidden shrink-0 text-[var(--hui-color-foreground-base-secondary)] @min-[22rem]/task:inline",
            metaText
          )}
        >
          {task.summary}
        </span>
      )}
      {/* Holds Try again's place, so the button sits before the status and status words stay in one column. */}
      {canRetry && (
        <span aria-hidden="true" className={cn(buttonVariants({ variant: "secondary", size: "xs" }), "invisible")}>
          {labels.retry}
        </span>
      )}
      {/* The status is always in words, so the icon's color is never the only cue. */}
      <span
        data-slot="task-status"
        className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}
      >
        {labels[task.status]}
      </span>
    </>
  )

  const rowLayout =
    "flex min-h-[var(--hui-space-11)] w-full min-w-0 items-center gap-[var(--hui-space-3)] px-[var(--hui-space-4)] py-[var(--hui-space-3)] text-left"

  // Every row keeps the chevron's width, so the status words line up down the list.
  const disclosureSlot = "size-3.5 shrink-0"

  // Try again can't sit inside the row's button, so it overlays the place the row holds for it.
  const retry = canRetry && (
    <div className="pointer-events-none flex min-w-0 items-center justify-end gap-[var(--hui-space-3)] px-[var(--hui-space-4)]">
      <RetryButton task={task} labels={labels} onRetry={onRetry} />
      <span aria-hidden="true" className={cn("invisible shrink-0", metaText)}>
        {labels[task.status]}
      </span>
      <span aria-hidden="true" className={disclosureSlot} />
    </div>
  )

  return (
    <li
      data-slot="task-row"
      data-status={task.status}
      className={cn(
        "@container/task min-w-0",
        isList
          ? "border-b-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] last:border-b-0"
          : "overflow-hidden rounded-[var(--hui-radius-4)] border-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)]"
      )}
    >
      {hasDetails ? (
        <Collapsible>
          <div className="grid min-w-0 *:[grid-area:1/1]">
            <CollapsibleTrigger
              className={cn(
                "group/task cursor-pointer border-0 bg-transparent outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-[var(--hui-focus-ring-offset-inset)]",
                rowLayout
              )}
            >
              {summary}
              <ChevronDownIcon
                aria-hidden="true"
                className={cn(
                  disclosureSlot,
                  "text-[var(--hui-color-foreground-base-tertiary)] motion-safe:transition-transform motion-safe:duration-200 group-data-panel-open/task:rotate-180"
                )}
              />
            </CollapsibleTrigger>
            {retry}
          </div>
          <CollapsiblePanel>
            <ul
              role="list"
              // The rail starts under the status icon's center.
              className={cn(
                "m-0 ms-[calc(var(--hui-space-4)+var(--hui-space-3))] mb-[var(--hui-space-4)] flex list-none flex-col gap-[var(--hui-space-2)] border-s-[length:var(--hui-border-width-surface)] border-[var(--hui-color-border-base-secondary)] py-[var(--hui-space-1)] ps-[var(--hui-space-5)] pe-[var(--hui-space-4)]",
                metaText
              )}
            >
              {task.details?.map((detail) => (
                <li key={detail.label} className="flex min-w-0 items-baseline justify-between gap-[var(--hui-space-4)]">
                  <span className="min-w-0 break-words text-[var(--hui-color-foreground-base-secondary)]">
                    {detail.label}
                  </span>
                  {detail.value && (
                    <span className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]">
                      <TabularDigits text={detail.value} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CollapsiblePanel>
        </Collapsible>
      ) : (
        <div className="grid min-w-0 *:[grid-area:1/1]">
          <div className={rowLayout}>
            {summary}
            <span aria-hidden="true" className={disclosureSlot} />
          </div>
          {retry}
        </div>
      )}
    </li>
  )
}

/** Tabular figures on the digits only; LoveSans would space the letters too. */
function TabularDigits({ text }: { text: string }) {
  return text.split(/(\d+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="tabular-nums">
        {part}
      </span>
    ) : (
      part
    )
  )
}

function RetryButton({
  task,
  labels,
  onRetry,
}: {
  task: Task
  labels: TaskRowsLabels
  onRetry?: (taskId: string) => void
}) {
  return (
    <Button
      variant="secondary"
      size="xs"
      className="pointer-events-auto shrink-0"
      aria-label={`${labels.retry}: ${task.label}`}
      onClick={() => onRetry?.(task.id)}
    >
      {labels.retry}
    </Button>
  )
}

export { TaskRows }
