/**
 * `waiting`: applied on screen, counting down, and Undo still possible.
 * `committing`: the countdown ended and the request is in flight.
 * `failed`: the request rejected and the change was taken back.
 */
export type UndoableEntryPhase = "waiting" | "committing" | "failed"

export type UndoableEntry = {
  id: string
  /** What happened, in the past tense: "Archived 3 conversations". */
  message: string
  phase: UndoableEntryPhase
  /** The full countdown, in milliseconds. */
  duration: number
  /** Milliseconds left when the countdown was last paused or started. */
  remaining: number
  /** When the countdown ends, in `Date.now()` time. `null` while paused or not waiting. */
  deadline: number | null
  error?: unknown
}

export type UndoableRunOptions<TResult = unknown> = {
  /** What happened, in the past tense. Shown beside Undo and announced. */
  message: string
  /**
   * Makes the change on screen at once and returns the function that takes it
   * back. The rollback runs on Undo and when the commit fails.
   */
  apply?: (() => (() => void) | void) | undefined
  /** The real request, sent only when the countdown ends without an Undo. */
  commit: (context: { signal: AbortSignal }) => Promise<TResult>
  /** Overrides the queue's countdown for this action, in milliseconds. */
  duration?: number | undefined
  onCommit?: ((result: TResult) => void) | undefined
  onUndo?: (() => void) | undefined
  onError?: ((error: unknown) => void) | undefined
}

export type UndoableEvent =
  | { type: "added"; entry: UndoableEntry }
  | { type: "undone"; entry: UndoableEntry }
  | { type: "committed"; entry: UndoableEntry }
  | { type: "failed"; entry: UndoableEntry }

export type UndoableQueueState = {
  entries: readonly UndoableEntry[]
  /** True while anything holds the countdowns: a pointer over the bar, focus in it, or a hidden tab. */
  paused: boolean
  /** The latest thing that happened, for the bar's announcement. `seq` changes with each event. */
  lastEvent: (UndoableEvent & { seq: number }) | null
}

export type UndoableQueueOptions = {
  /** Countdown length in milliseconds. */
  duration?: number | undefined
  /**
   * How many actions may wait at once. A new action beyond this commits the
   * oldest waiting one straight away.
   */
  max?: number | undefined
  /** The clock. Tests pass a fake one. */
  now?: (() => number) | undefined
}

export type UndoableQueueStore = {
  getState: () => UndoableQueueState
  subscribe: (listener: () => void) => () => void
  /** Applies the change and starts its countdown. Returns the entry's id. */
  run: <TResult>(options: UndoableRunOptions<TResult>) => string
  /** Takes a waiting action back before it commits. */
  undo: (id: string) => void
  /** Re-applies a failed action and commits it at once. */
  retry: (id: string) => void
  /** Removes a failed entry. A waiting one is committed now instead. */
  dismiss: (id: string) => void
  /** Holds or releases the countdowns for a reason, such as "hover" or "focus". */
  setPaused: (reason: string, paused: boolean) => void
  /** Commits every waiting action now, as when the page is about to go away. */
  flush: () => void
}

export type UndoableAction = UndoableQueueState &
  Pick<UndoableQueueStore, "run" | "undo" | "retry" | "dismiss" | "setPaused" | "flush">

export type UndoBarLabels = {
  /** The accessible name of the bar's region. */
  region: string
  undo: string
  undoAction: (message: string) => string
  retry: string
  dismiss: string
  committing: (message: string) => string
  failed: (message: string, error: unknown) => string
  /** Read out when an action is added. */
  added: (message: string, seconds: number) => string
  undone: (message: string) => string
  /** The countdown beside Undo. */
  secondsLeft: (seconds: number) => string
}
