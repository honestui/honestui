"use client"

import * as React from "react"

import type { UndoableAction, UndoableQueueOptions } from "./undoable-action-types"
import { createUndoableQueue } from "./undoable-action-utils"

/**
 * A queue of actions that show at once and are sent only after a countdown,
 * unless someone presses Undo. Call it above anything the actions remove, and
 * render one `UndoBar` with the result.
 *
 * When the component unmounts, actions still waiting are committed: nobody
 * undid them, so they stand.
 */
export function useUndoableAction(options: UndoableQueueOptions = {}): UndoableAction {
  const [store] = React.useState(() => createUndoableQueue(options))
  const state = React.useSyncExternalStore(store.subscribe, store.getState, store.getState)

  // A hidden tab holds the countdown, so nothing commits while nobody can see it.
  React.useEffect(() => {
    const sync = () => store.setPaused("hidden", document.visibilityState === "hidden")
    sync()
    document.addEventListener("visibilitychange", sync)
    return () => document.removeEventListener("visibilitychange", sync)
  }, [store])

  React.useEffect(() => () => store.flush(), [store])

  return React.useMemo(
    () => ({
      ...state,
      run: store.run,
      undo: store.undo,
      retry: store.retry,
      dismiss: store.dismiss,
      setPaused: store.setPaused,
      flush: store.flush,
    }),
    [state, store]
  )
}
