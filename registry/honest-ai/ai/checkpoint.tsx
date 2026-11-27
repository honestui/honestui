"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  GitCommitHorizontal as CheckpointIcon,
  LoaderCircle as LoaderCircleIcon,
  Undo2 as RestoreIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export type CheckpointStatus = "available" | "restoring" | "restored"

export type CheckpointLabels = {
  restore: string
  confirmRestore: string
  cancel: string
  /** The question shown before restoring. */
  confirm: string
  restoring: string
  restored: string
  current: string
  listTitle: string
}

export const defaultCheckpointLabels: CheckpointLabels = {
  restore: "Restore",
  confirmRestore: "Restore",
  cancel: "Cancel",
  confirm: "Discard the changes made after this?",
  restoring: "Restoring",
  restored: "Restored",
  current: "Current",
  listTitle: "Checkpoints",
}

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

type RestoreHandler = () => void | Promise<unknown>

/**
 * Restore with a confirm step. A handler that returns a promise shows
 * Restoring until it settles; a status you pass wins over that.
 */
function useRestore(onRestore: RestoreHandler | undefined, statusProp: CheckpointStatus | undefined) {
  const [confirming, setConfirming] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const mounted = React.useRef(true)
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const status: CheckpointStatus = statusProp ?? (pending ? "restoring" : "available")

  const restore = React.useCallback(() => {
    setConfirming(false)
    const result = onRestore?.()
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setPending(true)
      ;(result as Promise<unknown>).finally(() => {
        if (mounted.current) setPending(false)
      })
    }
  }, [onRestore])

  return { status, confirming: confirming && status === "available", setConfirming, restore }
}

function RestoreControls({
  name,
  status,
  confirming,
  setConfirming,
  restore,
  labels,
  current,
}: {
  name: string
  status: CheckpointStatus
  confirming: boolean
  setConfirming: (value: boolean) => void
  restore: () => void
  labels: CheckpointLabels
  current?: boolean
}) {
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const wasConfirming = React.useRef(false)

  React.useEffect(() => {
    // Focus follows the step, so the keyboard never lands on a removed button.
    const focus = (slot: string) =>
      rootRef.current?.querySelector<HTMLElement>(`[data-slot="${slot}"]`)?.focus()
    if (confirming) focus("checkpoint-confirm-restore")
    else if (wasConfirming.current && status === "available") focus("checkpoint-restore")
    wasConfirming.current = confirming
  }, [confirming, status])

  return (
    <span ref={rootRef} className="contents">
      {renderControls()}
    </span>
  )

  function renderControls() {

  if (current) {
    return (
      // Padded like the xs button it stands in for, so the column lines up.
      <span className={cn("shrink-0 px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
        {labels.current}
      </span>
    )
  }

  if (status === "restored") {
    return (
      <span
        data-slot="checkpoint-restored"
        className={cn(
          "inline-flex shrink-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
          metaText
        )}
      >
        <CheckIcon aria-hidden="true" className="size-3.5" />
        {labels.restored}
      </span>
    )
  }

  if (status === "restoring") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
          metaText
        )}
      >
        <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
        {labels.restoring}
      </span>
    )
  }

  if (confirming) {
    return (
      <div
        role="group"
        aria-label={`${labels.restore}: ${name}`}
        data-slot="checkpoint-confirm"
        className="ms-auto flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-[var(--hui-space-2)]"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation()
            setConfirming(false)
          }
        }}
      >
        <span className={cn("me-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
          {labels.confirm}
        </span>
        <Button variant="ghost" size="xs" onClick={() => setConfirming(false)}>
          {labels.cancel}
        </Button>
        <Button variant="secondary" size="xs" onClick={restore} data-slot="checkpoint-confirm-restore">
          {labels.confirmRestore}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      aria-label={`${labels.restore}: ${name}`}
      data-slot="checkpoint-restore"
      className="shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
      onClick={() => setConfirming(true)}
    >
      <RestoreIcon aria-hidden="true" />
      {labels.restore}
    </Button>
  )
  }
}

export type CheckpointProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What the checkpoint marks, such as "Before the schema change". */
  label: string
  /** When it was made, already formatted, such as "2:14 PM". */
  time?: string
  /** Machine-readable time for the time element. */
  dateTime?: string
  /** Passing it shows Restore. Return a promise to show Restoring until it settles. */
  onRestore?: RestoreHandler
  /** Set it to show the state your app is in. */
  status?: CheckpointStatus
  labels?: Partial<CheckpointLabels>
}

/**
 * A marker in a conversation where the work can be put back. It sits between
 * messages as a hairline with a label, and asks before restoring.
 */
function Checkpoint({
  label,
  time,
  dateTime,
  onRestore,
  status: statusProp,
  labels: labelsProp,
  className,
  ...props
}: CheckpointProps) {
  const labels = React.useMemo(() => ({ ...defaultCheckpointLabels, ...labelsProp }), [labelsProp])
  const { status, confirming, setConfirming, restore } = useRestore(onRestore, statusProp)
  const showControls = onRestore !== undefined || statusProp !== undefined

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="checkpoint"
      data-status={status}
      className={cn(
        "flex min-h-[var(--hui-space-8)] w-full min-w-0 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
        metaText,
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 shrink items-center gap-[var(--hui-space-3)]">
        <CheckpointIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-tertiary)]" />
        <span className="min-w-0 truncate [font-weight:var(--hui-font-weight-medium)] text-[var(--hui-color-foreground-base-primary)]">
          {label}
        </span>
        {time && (
          <time dateTime={dateTime} className="shrink-0 tabular-nums">
            {time}
          </time>
        )}
      </span>
      <span aria-hidden="true" className="h-0 min-w-[var(--hui-space-6)] flex-1 border-t-[0.5px] border-[var(--hui-color-border-base-primary)]" />
      {showControls && (
        <RestoreControls
          name={label}
          status={status}
          confirming={confirming}
          setConfirming={setConfirming}
          restore={restore}
          labels={labels}
        />
      )}
    </div>
  )
}

export type CheckpointItem = {
  id: string
  label: string
  time?: string
  dateTime?: string
  /** A short note, such as "4 files changed". */
  description?: string
  status?: CheckpointStatus
}

export type CheckpointListProps = Omit<React.ComponentProps<"section">, "children" | "title"> & {
  checkpoints: CheckpointItem[]
  /** The checkpoint the work is at now. It shows Current instead of Restore. */
  currentId?: string
  onRestore?: (id: string) => void | Promise<unknown>
  title?: React.ReactNode
  labels?: Partial<CheckpointLabels>
}

/** Several checkpoints in one panel, newest first or in the order you pass. */
function CheckpointList({
  checkpoints,
  currentId,
  onRestore,
  title,
  labels: labelsProp,
  className,
  ...props
}: CheckpointListProps) {
  const labels = React.useMemo(() => ({ ...defaultCheckpointLabels, ...labelsProp }), [labelsProp])
  const titleId = React.useId()

  return (
    <section
      aria-labelledby={titleId}
      data-slot="checkpoint-list"
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        rowText,
        className
      )}
      {...props}
    >
      <p
        id={titleId}
        className="m-0 border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] [font-weight:var(--hui-font-weight-medium)]"
      >
        {title ?? labels.listTitle}
      </p>
      <ol role="list" className="m-0 flex list-none flex-col p-0 py-[var(--hui-space-2)]">
        {checkpoints.map((checkpoint, index) => (
          <CheckpointListRow
            key={checkpoint.id}
            checkpoint={checkpoint}
            current={checkpoint.id === currentId}
            last={index === checkpoints.length - 1}
            first={index === 0}
            onRestore={onRestore}
            labels={labels}
          />
        ))}
      </ol>
    </section>
  )
}

function CheckpointListRow({
  checkpoint,
  current,
  first,
  last,
  onRestore,
  labels,
}: {
  checkpoint: CheckpointItem
  current: boolean
  first: boolean
  last: boolean
  onRestore?: (id: string) => void | Promise<unknown>
  labels: CheckpointLabels
}) {
  const handler = React.useMemo(
    () => (onRestore ? () => onRestore(checkpoint.id) : undefined),
    [onRestore, checkpoint.id]
  )
  const { status, confirming, setConfirming, restore } = useRestore(handler, checkpoint.status)

  return (
    <li
      data-slot="checkpoint-item"
      data-status={status}
      data-current={current || undefined}
      className="relative flex min-w-0 items-start gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]"
    >
      {/* The rail joins the dots, so the list reads as one history. */}
      <span aria-hidden="true" className="relative flex w-3 shrink-0 justify-center self-stretch">
        <span
          className={cn(
            "absolute w-0 border-s-[0.5px] border-[var(--hui-color-border-base-primary)]",
            first ? "top-[11px]" : "-top-[var(--hui-space-3)]",
            last ? "h-[11px]" : "-bottom-[var(--hui-space-3)]",
            first && last && "hidden"
          )}
        />
        <span
          className={cn(
            "relative mt-[7px] size-2 rounded-full border-[0.5px]",
            current
              ? "border-[var(--hui-color-foreground-base-primary)] bg-[var(--hui-color-foreground-base-primary)]"
              : "border-[var(--hui-color-foreground-base-tertiary)] bg-[var(--hui-color-background-base-primary)]"
          )}
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="min-w-0 truncate [font-weight:var(--hui-font-weight-medium)]" title={checkpoint.label}>
          {checkpoint.label}
        </span>
        {(checkpoint.description || checkpoint.time) && (
          <span className={cn("min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)] tabular-nums", metaText)}>
            {checkpoint.time && <time dateTime={checkpoint.dateTime}>{checkpoint.time}</time>}
            {checkpoint.time && checkpoint.description && " · "}
            {checkpoint.description}
          </span>
        )}
      </div>
      {(onRestore || current || checkpoint.status) && (
        <div className="flex min-h-[var(--hui-space-8)] max-w-[60%] shrink-0 items-center">
          <RestoreControls
            name={checkpoint.label}
            status={status}
            confirming={confirming}
            setConfirming={setConfirming}
            restore={restore}
            labels={labels}
            current={current}
          />
        </div>
      )}
    </li>
  )
}

export { Checkpoint, CheckpointList }
