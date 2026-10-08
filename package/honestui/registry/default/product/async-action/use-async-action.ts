"use client"

import * as React from "react"

import type { AsyncAction, AsyncActionOptions } from "./async-action-types"
import { createAsyncActionStore, getAsyncActionCapabilities } from "./async-action-utils"

/**
 * Runs one action at a time and keeps its outcome until it is dismissed or run
 * again. Call it above anything the optimistic update removes, so the state
 * outlives the row or card that started the action.
 */
export function useAsyncAction<TInput = void, TResult = unknown>(
  options: AsyncActionOptions<TInput, TResult>
): AsyncAction<TInput, TResult> {
  const [store] = React.useState(() => createAsyncActionStore(options))
  // Options are usually new closures on each render; the store reads the latest when it acts.
  React.useEffect(() => {
    store.setOptions(options)
  })
  const state = React.useSyncExternalStore(store.subscribe, store.getState, store.getState)

  const supportsUndo = options.undo !== undefined
  const supportsCancel = options.cancelable === true

  return React.useMemo(
    () => ({
      state,
      ...getAsyncActionCapabilities(state, { undo: supportsUndo, cancel: supportsCancel }),
      run: store.run,
      retry: store.retry,
      cancel: store.cancel,
      undo: store.undo,
      reset: store.reset,
    }),
    [state, store, supportsUndo, supportsCancel]
  )
}
