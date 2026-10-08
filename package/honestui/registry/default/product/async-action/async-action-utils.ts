import type {
  ActionStatusLabels,
  AsyncActionCapabilities,
  AsyncActionOptions,
  AsyncActionOutcome,
  AsyncActionState,
  AsyncActionStore,
} from "./async-action-types"

export const defaultActionStatusLabels: ActionStatusLabels = {
  pending: "Working…",
  success: "Done.",
  error: "This did not finish. Try again.",
  cancelled: "Cancelled.",
  undoing: "Undoing…",
  undone: "Undone.",
  undoError: "This could not be undone. Try again.",
  retry: "Retry",
  cancel: "Cancel",
  undo: "Undo",
  dismiss: "Dismiss",
}

/** `supports` says what the developer supplied: a reversal, and a request that can be aborted. */
export function getAsyncActionCapabilities(
  state: AsyncActionState<unknown, unknown>,
  supports: { undo: boolean; cancel: boolean }
): AsyncActionCapabilities {
  const isBusy = state.phase === "pending" || state.phase === "undoing"

  return {
    isBusy,
    canCancel: state.phase === "pending" && supports.cancel,
    canRetry: state.phase === "error" || state.phase === "undoError",
    canUndo: state.phase === "success" && supports.undo,
    canDismiss: state.phase !== "idle" && !isBusy,
  }
}

/** The sentence for the current phase, or `null` when there is nothing to say. */
export function getActionStatusMessage(
  state: AsyncActionState<unknown, unknown>,
  labels: ActionStatusLabels
): string | null {
  if (state.phase === "idle") return null
  if (state.phase === "error" || state.phase === "undoError") {
    const label = labels[state.phase]
    return typeof label === "function" ? label(state.error) : label
  }
  return labels[state.phase]
}

/**
 * Coordinates one action outside React, so a second click in the same tick
 * already sees the pending state. Options are read at each step, so
 * `setOptions` can replace them with fresh closures at any time.
 */
export function createAsyncActionStore<TInput = void, TResult = unknown>(
  initialOptions: AsyncActionOptions<TInput, TResult>
): AsyncActionStore<TInput, TResult> {
  let options = initialOptions
  let state: AsyncActionState<TInput, TResult> = { phase: "idle" }
  // Cancelling moves this on, so the cancelled request's late settle is recognised and dropped.
  let currentRun = 0
  let abortController: AbortController | null = null
  let rollback: (() => void) | null = null
  const listeners = new Set<() => void>()

  function setState(next: AsyncActionState<TInput, TResult>) {
    state = next
    for (const listener of listeners) listener()
  }

  function rollBack() {
    const takeBack = rollback
    rollback = null
    takeBack?.()
  }

  function isBusy() {
    return state.phase === "pending" || state.phase === "undoing"
  }

  async function run(input: TInput): Promise<AsyncActionOutcome<TResult>> {
    if (isBusy()) return { status: "ignored" }

    currentRun += 1
    const runId = currentRun
    const controller = new AbortController()
    abortController = controller
    rollback = null
    setState({ phase: "pending", input })

    let settled: { ok: true; result: TResult } | { ok: false; error: unknown }
    try {
      rollback = options.optimistic?.(input) ?? null
      settled = { ok: true, result: await options.action(input, { signal: controller.signal }) }
    } catch (error) {
      settled = { ok: false, error }
    }

    if (runId !== currentRun) return { status: "cancelled" }
    abortController = null

    if (!settled.ok) {
      rollBack()
      setState({ phase: "error", input, error: settled.error })
      options.onError?.(settled.error, input)
      return { status: "error", error: settled.error }
    }

    // The rollback is kept: a later undo uses it to restore the interface.
    setState({ phase: "success", input, result: settled.result })
    options.onSuccess?.(settled.result, input)
    return { status: "success", result: settled.result }
  }

  async function undo() {
    if (state.phase !== "success" && state.phase !== "undoError") return
    const reverse = options.undo
    if (!reverse) return

    const { input, result } = state
    setState({ phase: "undoing", input, result })

    try {
      await reverse(input, { result })
    } catch (error) {
      // The action still stands, so the interface keeps showing its result.
      setState({ phase: "undoError", input, result, error })
      return
    }

    rollBack()
    setState({ phase: "undone", input, result })
  }

  return {
    getState: () => state,
    setOptions(next) {
      options = next
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    run,
    undo: () => void undo(),
    retry() {
      if (state.phase === "error") void run(state.input)
      else if (state.phase === "undoError") void undo()
    },
    cancel() {
      if (state.phase !== "pending" || options.cancelable !== true) return
      const { input } = state
      currentRun += 1
      abortController?.abort()
      abortController = null
      rollBack()
      setState({ phase: "cancelled", input })
    },
    reset() {
      if (state.phase === "idle" || isBusy()) return
      rollback = null
      setState({ phase: "idle" })
    },
  }
}
