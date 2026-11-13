"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  CircleSlash as CircleSlashIcon,
  LoaderCircle as LoaderCircleIcon,
  RotateCcw as RetryIcon,
  Undo2 as UndoIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

import type {
  ActionStatusLabels,
  AsyncAction,
  AsyncActionHandle,
  AsyncActionPhase,
} from "./async-action-types"
import { defaultActionStatusLabels, getActionStatusMessage } from "./async-action-utils"

export type {
  ActionStatusLabels,
  AsyncAction,
  AsyncActionCapabilities,
  AsyncActionHandle,
  AsyncActionOptions,
  AsyncActionOutcome,
  AsyncActionPhase,
  AsyncActionState,
} from "./async-action-types"
export { defaultActionStatusLabels } from "./async-action-utils"
export { useAsyncAction } from "./use-async-action"

const bodyText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"

/** 28px recovery buttons: a hairline edge on the bar, 12px medium label. */
const statusButton =
  "min-h-7 gap-[6px] px-[var(--hui-space-3)] shadow-none [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)] [font-weight:var(--hui-font-weight-medium)] [&_svg]:size-3.5 [&_svg]:text-[var(--hui-color-foreground-base-secondary)]"

/** Filled buttons lose their fill in forced colors, so they get an edge instead. */
const forcedColorsBorder = "forced-colors:border forced-colors:border-[ButtonText]"

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type ActionButtonInput<TInput> = undefined extends TInput
  ? { /** Passed to `run`. */ input?: TInput }
  : { /** Passed to `run`. */ input: TInput }

export type ActionButtonProps<TInput = void> = React.ComponentProps<typeof Button> &
  ActionButtonInput<TInput> & {
    action: Pick<AsyncAction<TInput, unknown>, "state" | "isBusy" | "run">
    /** Replaces the children while this button's own run is pending. */
    pendingLabel?: React.ReactNode
  }

/**
 * Starts the action. While any run is in flight it stays focusable but
 * inactive, so keyboard focus is not thrown back to the page.
 */
function ActionButton<TInput = void>(props: ActionButtonProps<TInput>) {
  const { action, input, pendingLabel, className, children, onClick, ...buttonProps } =
    props as React.ComponentProps<typeof Button> & {
      action: ActionButtonProps<TInput>["action"]
      input?: TInput
      pendingLabel?: React.ReactNode
    }
  const { state } = action
  // One hook can serve several buttons; only the one that started the run shows progress.
  const isPending = state.phase === "pending" && Object.is(state.input, input)

  return (
    <Button
      data-slot="action-button"
      data-pending={isPending ? "" : undefined}
      aria-disabled={action.isBusy || undefined}
      className={cn(
        forcedColorsBorder,
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:scale-100!",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || action.isBusy) return
        void action.run(input as TInput)
      }}
      {...buttonProps}
    >
      {isPending && (
        <LoaderCircleIcon aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
      )}
      {isPending && pendingLabel !== undefined ? pendingLabel : children}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

const phaseIcon: Partial<Record<AsyncActionPhase, typeof CircleCheckIcon>> = {
  pending: LoaderCircleIcon,
  undoing: LoaderCircleIcon,
  success: CircleCheckIcon,
  undone: CircleCheckIcon,
  error: CircleAlertIcon,
  undoError: CircleAlertIcon,
  cancelled: CircleSlashIcon,
}

const phaseTone: Partial<Record<AsyncActionPhase, string>> = {
  pending: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  undoing: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  success: "text-[var(--hui-color-foreground-success-primary)]",
  undone: "text-[var(--hui-color-foreground-success-primary)]",
  error: "text-[var(--hui-color-foreground-danger-primary)]",
  undoError: "text-[var(--hui-color-foreground-danger-primary)]",
  cancelled: "text-[var(--hui-color-foreground-base-tertiary)]",
}

export type ActionStatusProps = Omit<React.ComponentProps<"div">, "children" | "ref"> & {
  action: AsyncActionHandle
  /** Replacement wording. Write the outcome messages for your action. */
  labels?: Partial<ActionStatusLabels> | undefined
}

/**
 * States the phase in words and offers the recovery that applies to it:
 * Cancel while pending, Retry after a failure, Undo after success. Keep it
 * mounted; it is an empty live region while the action is idle, which is what
 * lets screen readers announce the first message.
 */
function ActionStatus({ action, labels: labelsProp, className, ...props }: ActionStatusProps) {
  const { state } = action
  const labels = React.useMemo(
    () => ({ ...defaultActionStatusLabels, ...labelsProp }),
    [labelsProp]
  )
  const message = getActionStatusMessage(state, labels)
  const Icon = phaseIcon[state.phase]

  const rootRef = React.useRef<HTMLDivElement>(null)
  const lastFocused = React.useRef<Element | null>(null)

  React.useEffect(() => {
    lastFocused.current = document.activeElement
    const remember = (event: FocusEvent) => {
      lastFocused.current = event.target instanceof Element ? event.target : null
    }
    document.addEventListener("focusin", remember)
    return () => document.removeEventListener("focusin", remember)
  }, [])

  // A phase change can remove the focused control: a used Retry button, or the
  // row an optimistic update took away. Hold focus on the status so it does
  // not fall back to the top of the page.
  React.useEffect(() => {
    const root = rootRef.current
    const previous = lastFocused.current
    if (!root || !previous || previous === document.body || previous.isConnected) return
    if (document.activeElement && document.activeElement !== document.body) return
    root.focus()
  }, [state.phase])

  return (
    <div
      ref={rootRef}
      data-slot="action-status"
      data-phase={state.phase}
      tabIndex={-1}
      className={cn(
        // A hairline status bar while there is something to say; nothing at all while idle.
        "flex min-h-11 w-full min-w-0 flex-wrap items-center gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] py-[6px] ps-[var(--hui-space-4)] pe-[6px] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)]",
        "data-[phase=idle]:min-h-0 data-[phase=idle]:border-0 data-[phase=idle]:p-0",
        bodyText,
        className
      )}
      {...props}
    >
      <p
        role="status"
        data-slot="action-status-message"
        className="m-0 flex min-w-0 flex-1 items-start gap-[var(--hui-space-3)]"
      >
        {Icon && (
          <Icon aria-hidden="true" className={cn("mt-[3px] size-3.5 shrink-0", phaseTone[state.phase])} />
        )}
        {message !== null && <span className="min-w-0 break-words">{message}</span>}
      </p>
      {/* Outside the status region, so the buttons are not read out as part of the message. */}
      {(action.canCancel || action.canRetry || action.canUndo || action.canDismiss) && (
        <div
          data-slot="action-status-actions"
          className="ms-auto flex items-center gap-[var(--hui-space-2)]"
        >
          {action.canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(statusButton, forcedColorsBorder)}
              onClick={action.cancel}
            >
              {labels.cancel}
            </Button>
          )}
          {action.canRetry && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(statusButton, forcedColorsBorder)}
              onClick={action.retry}
            >
              <RetryIcon aria-hidden="true" />
              {labels.retry}
            </Button>
          )}
          {action.canUndo && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(statusButton, forcedColorsBorder)}
              onClick={action.undo}
            >
              <UndoIcon aria-hidden="true" />
              {labels.undo}
            </Button>
          )}
          {action.canDismiss && (
            <Button
              variant="link"
              size="icon-sm"
              aria-label={labels.dismiss}
              className="size-7 rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-secondary)] not-disabled:hover:text-[var(--hui-color-foreground-base-primary)]"
              onClick={action.reset}
            >
              <CloseIcon aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { ActionButton, ActionStatus }
