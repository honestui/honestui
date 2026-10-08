"use client"

import * as React from "react"
import {
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  LoaderCircle as LoaderCircleIcon,
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
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

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
}

const phaseTone: Partial<Record<AsyncActionPhase, string>> = {
  pending: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  undoing: "text-[var(--hui-color-foreground-base-secondary)] motion-safe:animate-spin",
  success: "text-[var(--hui-color-foreground-success-primary)]",
  undone: "text-[var(--hui-color-foreground-success-primary)]",
  error: "text-[var(--hui-color-foreground-danger-primary)]",
  undoError: "text-[var(--hui-color-foreground-danger-primary)]",
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
        "flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-2)] rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)]",
        bodyText,
        className
      )}
      {...props}
    >
      <p
        role="status"
        data-slot="action-status-message"
        className="m-0 flex min-w-0 items-start gap-[var(--hui-space-2)]"
      >
        {Icon && (
          <Icon aria-hidden="true" className={cn("mt-0.5 size-3.5 shrink-0", phaseTone[state.phase])} />
        )}
        {message !== null && <span className="min-w-0 break-words">{message}</span>}
      </p>
      {/* Outside the status region, so the buttons are not read out as part of the message. */}
      {(action.canCancel || action.canRetry || action.canUndo || action.canDismiss) && (
        <div
          data-slot="action-status-actions"
          className="flex items-center gap-[var(--hui-space-2)]"
        >
          {action.canCancel && (
            <Button
              variant="secondary"
              size="sm"
              className={forcedColorsBorder}
              onClick={action.cancel}
            >
              {labels.cancel}
            </Button>
          )}
          {action.canRetry && (
            <Button
              variant="secondary"
              size="sm"
              className={forcedColorsBorder}
              onClick={action.retry}
            >
              {labels.retry}
            </Button>
          )}
          {action.canUndo && (
            <Button
              variant="secondary"
              size="sm"
              className={forcedColorsBorder}
              onClick={action.undo}
            >
              {labels.undo}
            </Button>
          )}
          {action.canDismiss && (
            <Button
              variant="link"
              size="icon-sm"
              aria-label={labels.dismiss}
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
