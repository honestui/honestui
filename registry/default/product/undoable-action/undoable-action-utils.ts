import type {
  UndoBarLabels,
  UndoableEntry,
  UndoableEvent,
  UndoableQueueOptions,
  UndoableQueueState,
  UndoableQueueStore,
  UndoableRunOptions,
} from "./undoable-action-types"

export const DEFAULT_UNDO_DURATION = 6000
export const DEFAULT_UNDO_MAX = 3

export const defaultUndoBarLabels: UndoBarLabels = {
  region: "Recent actions",
  undo: "Undo",
  undoAction: (message) => `Undo: ${message}`,
  retry: "Retry",
  dismiss: "Dismiss",
  committing: (message) => `${message}…`,
  failed: (message) => `${message} did not go through, so it was taken back.`,
  added: (message, seconds) => `${message}. Undo is available for ${seconds} seconds.`,
  undone: (message) => `Undone: ${message}.`,
  secondsLeft: (seconds) => `${seconds}s`,
}

/** Whole seconds left, rounded up, so the count reads 6, 5, … 1 and never 0 while waiting. */
export function getSecondsLeft(entry: Pick<UndoableEntry, "remaining" | "deadline">, now: number): number {
  const left = entry.deadline === null ? entry.remaining : entry.deadline - now
  return Math.max(0, Math.ceil(left / 1000))
}

/** How much of the countdown is left, from 1 down to 0. */
export function getCountdownFraction(
  entry: Pick<UndoableEntry, "remaining" | "deadline" | "duration">,
  now: number
): number {
  if (entry.duration <= 0) return 0
  const left = entry.deadline === null ? entry.remaining : entry.deadline - now
  return Math.min(1, Math.max(0, left / entry.duration))
}

type Internal = {
  options: UndoableRunOptions<unknown>
  rollback: (() => void) | null
  timer: ReturnType<typeof setTimeout> | null
  controller: AbortController | null
}

let nextId = 0

/**
 * Holds actions that already show on screen but have not been sent. Each one
 * counts down and commits when its time runs out, unless it is undone first.
 * Lives outside React, so an Undo pressed in the last frame is never lost to
 * a stale render.
 */
export function createUndoableQueue(queueOptions: UndoableQueueOptions = {}): UndoableQueueStore {
  const duration = queueOptions.duration ?? DEFAULT_UNDO_DURATION
  const max = Math.max(1, queueOptions.max ?? DEFAULT_UNDO_MAX)
  const now = queueOptions.now ?? (() => Date.now())

  let state: UndoableQueueState = { entries: [], paused: false, lastEvent: null }
  const internals = new Map<string, Internal>()
  const pauseReasons = new Set<string>()
  const listeners = new Set<() => void>()
  let seq = 0

  const emit = (next: Partial<UndoableQueueState>, event?: UndoableEvent) => {
    state = {
      ...state,
      ...next,
      ...(event ? { lastEvent: { ...event, seq: ++seq } } : {}),
    }
    listeners.forEach((listener) => listener())
  }

  const find = (id: string) => state.entries.find((entry) => entry.id === id)

  const replace = (id: string, patch: Partial<UndoableEntry>, event?: UndoableEvent["type"]) => {
    const entries = state.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    const updated = entries.find((entry) => entry.id === id)
    emit({ entries }, event && updated ? ({ type: event, entry: updated } as UndoableEvent) : undefined)
  }

  const remove = (id: string, event?: UndoableEvent["type"]) => {
    const entry = find(id)
    const internal = internals.get(id)
    if (internal?.timer) clearTimeout(internal.timer)
    internals.delete(id)
    emit(
      { entries: state.entries.filter((item) => item.id !== id) },
      event && entry ? ({ type: event, entry } as UndoableEvent) : undefined
    )
  }

  const schedule = (id: string) => {
    const internal = internals.get(id)
    const entry = find(id)
    if (!internal || !entry || entry.phase !== "waiting" || entry.deadline === null) return
    if (internal.timer) clearTimeout(internal.timer)
    internal.timer = setTimeout(() => commit(id), Math.max(0, entry.deadline - now()))
  }

  const commit = (id: string) => {
    const internal = internals.get(id)
    const entry = find(id)
    if (!internal || !entry || entry.phase === "committing") return
    if (internal.timer) clearTimeout(internal.timer)
    internal.timer = null
    const controller = new AbortController()
    internal.controller = controller
    replace(id, { phase: "committing", deadline: null, remaining: 0 })

    let request: Promise<unknown>
    try {
      request = Promise.resolve(internal.options.commit({ signal: controller.signal }))
    } catch (error) {
      request = Promise.reject(error)
    }

    request.then(
      (result) => {
        if (internals.get(id) !== internal || controller.signal.aborted) return
        internal.options.onCommit?.(result)
        remove(id, "committed")
      },
      (error: unknown) => {
        if (internals.get(id) !== internal || controller.signal.aborted) return
        internal.rollback?.()
        internal.rollback = null
        replace(id, { phase: "failed", error }, "failed")
        internal.options.onError?.(error)
      }
    )
  }

  const apply = (internal: Internal) => {
    const rollback = internal.options.apply?.()
    internal.rollback = typeof rollback === "function" ? rollback : null
  }

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    run(options) {
      const id = `undoable-${++nextId}`
      const entryDuration = options.duration ?? duration
      const internal: Internal = {
        options: options as UndoableRunOptions<unknown>,
        rollback: null,
        timer: null,
        controller: null,
      }
      internals.set(id, internal)
      apply(internal)

      const entry: UndoableEntry = {
        id,
        message: options.message,
        phase: "waiting",
        duration: entryDuration,
        remaining: entryDuration,
        deadline: pauseReasons.size > 0 ? null : now() + entryDuration,
      }
      emit({ entries: [...state.entries, entry] }, { type: "added", entry })
      schedule(id)

      // Too many waiting: the oldest goes through now rather than piling up.
      const waiting = state.entries.filter((item) => item.phase === "waiting")
      for (const extra of waiting.slice(0, Math.max(0, waiting.length - max))) commit(extra.id)

      return id
    },

    undo(id) {
      const internal = internals.get(id)
      const entry = find(id)
      if (!internal || !entry || entry.phase !== "waiting") return
      internal.rollback?.()
      internal.rollback = null
      internal.options.onUndo?.()
      remove(id, "undone")
    },

    retry(id) {
      const internal = internals.get(id)
      const entry = find(id)
      if (!internal || !entry || entry.phase !== "failed") return
      apply(internal)
      replace(id, { error: undefined })
      commit(id)
    },

    dismiss(id) {
      const entry = find(id)
      if (!entry) return
      if (entry.phase === "waiting") commit(id)
      else if (entry.phase === "failed") remove(id)
    },

    setPaused(reason, paused) {
      const wasPaused = pauseReasons.size > 0
      if (paused) pauseReasons.add(reason)
      else pauseReasons.delete(reason)
      const isPaused = pauseReasons.size > 0
      if (wasPaused === isPaused) return

      const at = now()
      const entries = state.entries.map((entry) => {
        if (entry.phase !== "waiting") return entry
        if (isPaused) {
          const internal = internals.get(entry.id)
          if (internal?.timer) clearTimeout(internal.timer)
          if (internal) internal.timer = null
          return { ...entry, remaining: Math.max(0, (entry.deadline ?? at) - at), deadline: null }
        }
        return { ...entry, deadline: at + entry.remaining }
      })
      emit({ entries, paused: isPaused })
      if (!isPaused) for (const entry of entries) schedule(entry.id)
    },

    flush() {
      for (const entry of state.entries) {
        if (entry.phase === "waiting") commit(entry.id)
      }
    },
  }
}
