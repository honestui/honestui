import { describe, expect, it, vi } from "vitest"

import {
  createAsyncActionStore,
  defaultActionStatusLabels,
  getActionStatusMessage,
  getAsyncActionCapabilities,
} from "../../registry/default/product/async-action/async-action-utils"
import type { AsyncActionOptions } from "../../registry/default/product/async-action/async-action-types"

/** A promise the test settles by hand, standing in for a request in flight. */
function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("run", () => {
  it("moves from pending to success and keeps the input and result", async () => {
    const request = deferred<string>()
    const store = createAsyncActionStore<number, string>({ action: () => request.promise })

    const outcome = store.run(7)
    expect(store.getState()).toEqual({ phase: "pending", input: 7 })

    request.resolve("archived")
    await expect(outcome).resolves.toEqual({ status: "success", result: "archived" })
    expect(store.getState()).toEqual({ phase: "success", input: 7, result: "archived" })
  })

  it("applies the optimistic update before the request settles", () => {
    const optimistic = vi.fn()
    const store = createAsyncActionStore<void, void>({ action: () => deferred().promise, optimistic })

    void store.run()

    expect(optimistic).toHaveBeenCalledTimes(1)
  })

  it("ignores a second run while the first is pending", async () => {
    const request = deferred()
    const action = vi.fn(() => request.promise)
    const optimistic = vi.fn()
    const store = createAsyncActionStore<void, void>({ action, optimistic })

    void store.run()
    await expect(store.run()).resolves.toEqual({ status: "ignored" })

    expect(action).toHaveBeenCalledTimes(1)
    expect(optimistic).toHaveBeenCalledTimes(1)
  })

  it("rolls the optimistic update back when the request fails", async () => {
    const request = deferred()
    const rollback = vi.fn()
    const onError = vi.fn()
    const failure = new Error("offline")
    const store = createAsyncActionStore<string, void>({
      action: () => request.promise,
      optimistic: () => rollback,
      onError,
    })

    const outcome = store.run("p1")
    request.reject(failure)

    await expect(outcome).resolves.toEqual({ status: "error", error: failure })
    expect(rollback).toHaveBeenCalledTimes(1)
    expect(store.getState()).toEqual({ phase: "error", input: "p1", error: failure })
    expect(onError).toHaveBeenCalledWith(failure, "p1")
  })

  it("reports a throwing optimistic update as a failure without calling the request", async () => {
    const action = vi.fn(async () => undefined)
    const store = createAsyncActionStore({
      action,
      optimistic: () => {
        throw new Error("bad state")
      },
    })

    await expect(store.run()).resolves.toMatchObject({ status: "error" })
    expect(action).not.toHaveBeenCalled()
  })

  it("notifies subscribers on each phase change and stops after unsubscribe", async () => {
    const store = createAsyncActionStore({ action: async () => undefined })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    await store.run()
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    store.reset()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("uses options replaced while the request is in flight", async () => {
    const request = deferred()
    const first = vi.fn()
    const latest = vi.fn()
    const options: AsyncActionOptions<void, void> = { action: () => request.promise, onSuccess: first }
    const store = createAsyncActionStore(options)

    const outcome = store.run()
    store.setOptions({ ...options, onSuccess: latest })
    request.resolve()
    await outcome

    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledTimes(1)
  })
})

describe("retry", () => {
  it("repeats a failed request with the same input", async () => {
    const action = vi
      .fn<(id: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("archived")
    const store = createAsyncActionStore({ action })

    await store.run("p1")
    store.retry()
    await vi.waitFor(() => expect(store.getState().phase).toBe("success"))

    expect(action).toHaveBeenCalledTimes(2)
    expect(action.mock.calls[1][0]).toBe("p1")
  })

  it("does nothing unless the last attempt failed", async () => {
    const action = vi.fn(async () => undefined)
    const store = createAsyncActionStore({ action })

    store.retry()
    await store.run()
    store.retry()

    expect(action).toHaveBeenCalledTimes(1)
  })
})

describe("cancel", () => {
  it("aborts the signal, rolls back, and reports the run as cancelled", async () => {
    const request = deferred()
    const rollback = vi.fn()
    let signal: AbortSignal | undefined
    const store = createAsyncActionStore({
      action: (_input: void, context) => {
        signal = context.signal
        return request.promise
      },
      optimistic: () => rollback,
      cancelable: true,
    })

    const outcome = store.run()
    store.cancel()

    expect(signal?.aborted).toBe(true)
    expect(rollback).toHaveBeenCalledTimes(1)
    expect(store.getState()).toEqual({ phase: "cancelled", input: undefined })

    request.resolve()
    await expect(outcome).resolves.toEqual({ status: "cancelled" })
  })

  it("drops a cancelled request that settles late, even after a newer run", async () => {
    const stale = deferred<string>()
    const fresh = deferred<string>()
    const onSuccess = vi.fn()
    const action = vi
      .fn<() => Promise<string>>()
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(fresh.promise)
    const store = createAsyncActionStore<void, string>({ action, cancelable: true, onSuccess })

    const first = store.run()
    store.cancel()
    const second = store.run()

    stale.resolve("stale")
    await first
    expect(store.getState().phase).toBe("pending")
    expect(onSuccess).not.toHaveBeenCalled()

    fresh.resolve("fresh")
    await second
    expect(store.getState()).toMatchObject({ phase: "success", result: "fresh" })
  })

  it("does nothing when the action was not declared cancelable", () => {
    const rollback = vi.fn()
    const store = createAsyncActionStore({ action: () => deferred().promise, optimistic: () => rollback })

    void store.run()
    store.cancel()

    expect(store.getState().phase).toBe("pending")
    expect(rollback).not.toHaveBeenCalled()
  })
})

describe("undo", () => {
  it("runs the reversal with the input and result, then rolls the interface back", async () => {
    const rollback = vi.fn()
    const undo = vi.fn(async () => undefined)
    const store = createAsyncActionStore<string, string>({
      action: async () => "receipt",
      optimistic: () => rollback,
      undo,
    })

    await store.run("p1")
    store.undo()
    expect(store.getState().phase).toBe("undoing")
    await vi.waitFor(() => expect(store.getState().phase).toBe("undone"))

    expect(undo).toHaveBeenCalledWith("p1", { result: "receipt" })
    expect(rollback).toHaveBeenCalledTimes(1)
  })

  it("keeps the result in place when the reversal fails, and retry repeats the undo", async () => {
    const rollback = vi.fn()
    const failure = new Error("offline")
    const undo = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(undefined)
    const action = vi.fn(async () => "receipt")
    const store = createAsyncActionStore({ action, optimistic: () => rollback, undo })

    await store.run()
    store.undo()
    await vi.waitFor(() => expect(store.getState().phase).toBe("undoError"))
    expect(store.getState()).toMatchObject({ result: "receipt", error: failure })
    expect(rollback).not.toHaveBeenCalled()

    store.retry()
    await vi.waitFor(() => expect(store.getState().phase).toBe("undone"))
    expect(action).toHaveBeenCalledTimes(1)
    expect(rollback).toHaveBeenCalledTimes(1)
  })

  it("does nothing without a reversal or before success", async () => {
    const store = createAsyncActionStore({ action: async () => undefined })

    store.undo()
    expect(store.getState().phase).toBe("idle")

    await store.run()
    store.undo()
    expect(store.getState().phase).toBe("success")
  })

  it("ignores new runs while the reversal is in flight", async () => {
    const reversal = deferred()
    const action = vi.fn(async () => undefined)
    const store = createAsyncActionStore({ action, undo: () => reversal.promise })

    await store.run()
    store.undo()

    await expect(store.run()).resolves.toEqual({ status: "ignored" })
    expect(action).toHaveBeenCalledTimes(1)
  })
})

describe("reset", () => {
  it("returns a settled action to idle", async () => {
    const store = createAsyncActionStore({ action: async () => undefined })

    await store.run()
    store.reset()

    expect(store.getState()).toEqual({ phase: "idle" })
  })

  it("does nothing while a request is in flight", () => {
    const store = createAsyncActionStore({ action: () => deferred().promise })

    void store.run()
    store.reset()

    expect(store.getState().phase).toBe("pending")
  })
})

describe("getAsyncActionCapabilities", () => {
  const none = { undo: false, cancel: false }
  const all = { undo: true, cancel: true }

  it("offers nothing while idle", () => {
    expect(getAsyncActionCapabilities({ phase: "idle" }, all)).toEqual({
      isBusy: false,
      canCancel: false,
      canRetry: false,
      canUndo: false,
      canDismiss: false,
    })
  })

  it("offers cancel and undo only when the developer supports them", () => {
    const pending = { phase: "pending", input: 1 } as const
    const success = { phase: "success", input: 1, result: 2 } as const

    expect(getAsyncActionCapabilities(pending, none).canCancel).toBe(false)
    expect(getAsyncActionCapabilities(pending, all).canCancel).toBe(true)
    expect(getAsyncActionCapabilities(success, none).canUndo).toBe(false)
    expect(getAsyncActionCapabilities(success, all).canUndo).toBe(true)
  })

  it("offers retry after either kind of failure, and dismiss once settled", () => {
    const error = { phase: "error", input: 1, error: null } as const
    const undoError = { phase: "undoError", input: 1, result: 2, error: null } as const
    const undoing = { phase: "undoing", input: 1, result: 2 } as const

    expect(getAsyncActionCapabilities(error, all)).toMatchObject({ canRetry: true, canDismiss: true })
    expect(getAsyncActionCapabilities(undoError, all)).toMatchObject({ canRetry: true, canUndo: false })
    expect(getAsyncActionCapabilities(undoing, all)).toMatchObject({ isBusy: true, canDismiss: false })
  })
})

describe("getActionStatusMessage", () => {
  it("says nothing while idle", () => {
    expect(getActionStatusMessage({ phase: "idle" }, defaultActionStatusLabels)).toBeNull()
  })

  it("uses the label for the phase", () => {
    expect(
      getActionStatusMessage({ phase: "cancelled", input: null }, defaultActionStatusLabels)
    ).toBe("Cancelled.")
  })

  it("passes the error to a failure label written as a function", () => {
    const labels = {
      ...defaultActionStatusLabels,
      error: (error: unknown) => `Not saved: ${(error as Error).message}`,
    }

    expect(
      getActionStatusMessage({ phase: "error", input: null, error: new Error("offline") }, labels)
    ).toBe("Not saved: offline")
  })
})
