export type AsyncActionPhase =
  | "idle"
  | "pending"
  | "success"
  | "error"
  | "cancelled"
  | "undoing"
  | "undone"
  | "undoError"

/** Each phase carries only what is known in it, so a result cannot exist before success. */
export type AsyncActionState<TInput, TResult> =
  | { phase: "idle" }
  | { phase: "pending"; input: TInput }
  | { phase: "success"; input: TInput; result: TResult }
  | { phase: "error"; input: TInput; error: unknown }
  | { phase: "cancelled"; input: TInput }
  | { phase: "undoing"; input: TInput; result: TResult }
  | { phase: "undone"; input: TInput; result: TResult }
  | { phase: "undoError"; input: TInput; result: TResult; error: unknown }

export type AsyncActionOptions<TInput, TResult> = {
  /** The request. `signal` aborts when the run is cancelled. */
  action: (input: TInput, context: { signal: AbortSignal }) => Promise<TResult>
  /**
   * Shows the expected result at once and returns the function that takes it
   * back. The rollback runs when the request fails, is cancelled, or is undone.
   */
  optimistic?: ((input: TInput) => (() => void) | void) | undefined
  /** A real reversal of the action. Undo is offered only when this is passed. */
  undo?: ((input: TInput, context: { result: TResult }) => Promise<unknown>) | undefined
  /** Set only when aborting `signal` really stops the request. Offers Cancel while pending. */
  cancelable?: boolean | undefined
  onSuccess?: ((result: TResult, input: TInput) => void) | undefined
  onError?: ((error: unknown, input: TInput) => void) | undefined
}

/** How one call to `run` ended. `ignored` means another run was already in progress. */
export type AsyncActionOutcome<TResult> =
  | { status: "success"; result: TResult }
  | { status: "error"; error: unknown }
  | { status: "cancelled" }
  | { status: "ignored" }

export type AsyncActionCapabilities = {
  /** A request or an undo is in flight, so new runs are ignored. */
  isBusy: boolean
  canCancel: boolean
  canRetry: boolean
  canUndo: boolean
  canDismiss: boolean
}

export type AsyncActionStore<TInput, TResult> = {
  getState: () => AsyncActionState<TInput, TResult>
  subscribe: (listener: () => void) => () => void
  /** Replaces the request and callbacks used from the next step onward. */
  setOptions: (options: AsyncActionOptions<TInput, TResult>) => void
  run: (input: TInput) => Promise<AsyncActionOutcome<TResult>>
  /** Repeats the failed request, or the failed undo, with the same input. */
  retry: () => void
  cancel: () => void
  undo: () => void
  /** Returns to idle. Does nothing while a request or an undo is in flight. */
  reset: () => void
}

export type AsyncAction<TInput, TResult> = AsyncActionCapabilities &
  Pick<AsyncActionStore<TInput, TResult>, "run" | "retry" | "cancel" | "undo" | "reset"> & {
    state: AsyncActionState<TInput, TResult>
  }

/** What `ActionStatus` reads. Omits `run`, so an action with any input type fits. */
export type AsyncActionHandle = Omit<AsyncAction<unknown, unknown>, "run">

export type ActionStatusLabels = {
  pending: string
  success: string
  error: string | ((error: unknown) => string)
  cancelled: string
  undoing: string
  undone: string
  undoError: string | ((error: unknown) => string)
  retry: string
  cancel: string
  undo: string
  dismiss: string
}
