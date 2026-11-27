import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createUndoableQueue,
  getCountdownFraction,
  getSecondsLeft,
} from "../../registry/default/product/undoable-action/undoable-action-utils"

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

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
})

afterEach(() => {
  vi.useRealTimers()
})

function setup(options: { duration?: number; max?: number } = {}) {
  const queue = createUndoableQueue({ duration: 5000, ...options })
  const rows = { removed: false }
  const commit = vi.fn(() => Promise.resolve("ok"))
  const apply = vi.fn(() => {
    rows.removed = true
    return () => {
      rows.removed = false
    }
  })
  return { queue, rows, commit, apply }
}

describe("run", () => {
  it("applies at once and commits only when the countdown ends", async () => {
    const { queue, rows, commit, apply } = setup()
    queue.run({ message: "Archived 3", apply, commit })

    expect(rows.removed).toBe(true)
    expect(queue.getState().entries).toMatchObject([{ phase: "waiting", deadline: 5000, remaining: 5000 }])
    expect(queue.getState().lastEvent).toMatchObject({ type: "added" })

    vi.advanceTimersByTime(4999)
    expect(commit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(queue.getState().entries[0].phase).toBe("committing")

    await vi.runAllTimersAsync()
    expect(queue.getState().entries).toEqual([])
    expect(queue.getState().lastEvent).toMatchObject({ type: "committed" })
    expect(rows.removed).toBe(true)
  })

  it("uses a per-action duration", () => {
    const { queue, commit } = setup()
    queue.run({ message: "Quick", commit, duration: 1000 })
    vi.advanceTimersByTime(1000)
    expect(commit).toHaveBeenCalled()
  })

  it("passes the commit's result to onCommit", async () => {
    const { queue, commit } = setup()
    const onCommit = vi.fn()
    queue.run({ message: "Saved", commit, onCommit })
    await vi.runAllTimersAsync()
    expect(onCommit).toHaveBeenCalledWith("ok")
  })
})

describe("undo", () => {
  it("rolls back, never commits, and announces the undo", async () => {
    const { queue, rows, commit, apply } = setup()
    const onUndo = vi.fn()
    const id = queue.run({ message: "Archived 3", apply, commit, onUndo })

    vi.advanceTimersByTime(2000)
    queue.undo(id)

    expect(rows.removed).toBe(false)
    expect(onUndo).toHaveBeenCalled()
    expect(queue.getState().entries).toEqual([])
    expect(queue.getState().lastEvent).toMatchObject({ type: "undone", entry: { message: "Archived 3" } })

    await vi.runAllTimersAsync()
    expect(commit).not.toHaveBeenCalled()
  })

  it("does nothing once the action is committing", () => {
    const { queue, rows, apply } = setup()
    const request = deferred()
    const id = queue.run({ message: "Archived", apply, commit: () => request.promise })
    vi.advanceTimersByTime(5000)
    queue.undo(id)
    expect(rows.removed).toBe(true)
    expect(queue.getState().entries[0].phase).toBe("committing")
  })
})

describe("failure", () => {
  it("rolls back and keeps the entry with its error", async () => {
    const { queue, rows, apply } = setup()
    const onError = vi.fn()
    const error = new Error("offline")
    queue.run({ message: "Deleted", apply, commit: () => Promise.reject(error), onError })

    await vi.advanceTimersByTimeAsync(5000)

    expect(rows.removed).toBe(false)
    expect(queue.getState().entries).toMatchObject([{ phase: "failed", error }])
    expect(queue.getState().lastEvent).toMatchObject({ type: "failed" })
    expect(onError).toHaveBeenCalledWith(error)
  })

  it("counts a commit that throws synchronously as a failure", async () => {
    const { queue } = setup()
    queue.run({
      message: "Deleted",
      commit: () => {
        throw new Error("bad input")
      },
    })
    await vi.advanceTimersByTimeAsync(5000)
    expect(queue.getState().entries[0].phase).toBe("failed")
  })

  it("retry re-applies and commits at once", async () => {
    const { queue, rows, apply } = setup()
    let attempts = 0
    const commit = vi.fn(() => (++attempts === 1 ? Promise.reject(new Error("no")) : Promise.resolve()))
    const id = queue.run({ message: "Deleted", apply, commit })
    await vi.advanceTimersByTimeAsync(5000)
    expect(rows.removed).toBe(false)

    queue.retry(id)
    expect(rows.removed).toBe(true)
    expect(commit).toHaveBeenCalledTimes(2)
    await vi.runAllTimersAsync()
    expect(queue.getState().entries).toEqual([])
  })

  it("dismiss removes a failed entry", async () => {
    const { queue } = setup()
    const id = queue.run({ message: "Deleted", commit: () => Promise.reject(new Error("no")) })
    await vi.advanceTimersByTimeAsync(5000)
    queue.dismiss(id)
    expect(queue.getState().entries).toEqual([])
  })
})

describe("pausing", () => {
  it("holds every countdown while any reason holds it", async () => {
    const { queue, commit } = setup()
    queue.run({ message: "A", commit })
    vi.advanceTimersByTime(2000)

    queue.setPaused("hover", true)
    queue.setPaused("focus", true)
    expect(queue.getState().paused).toBe(true)
    expect(queue.getState().entries[0]).toMatchObject({ deadline: null, remaining: 3000 })

    vi.advanceTimersByTime(60_000)
    expect(commit).not.toHaveBeenCalled()

    queue.setPaused("hover", false)
    vi.advanceTimersByTime(60_000)
    expect(commit).not.toHaveBeenCalled()

    queue.setPaused("focus", false)
    expect(queue.getState().entries[0].deadline).toBe(122_000 + 3000)
    vi.advanceTimersByTime(2999)
    expect(commit).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(commit).toHaveBeenCalled()
  })

  it("starts a new action paused while the queue is held", () => {
    const { queue, commit } = setup()
    queue.setPaused("hover", true)
    queue.run({ message: "A", commit })
    expect(queue.getState().entries[0].deadline).toBeNull()
    vi.advanceTimersByTime(10_000)
    expect(commit).not.toHaveBeenCalled()
  })
})

describe("several actions", () => {
  it("commits the oldest waiting action once more than max are waiting", () => {
    const { queue } = setup({ max: 2 })
    const commits: string[] = []
    for (const name of ["one", "two", "three"]) {
      queue.run({
        message: name,
        commit: () => {
          commits.push(name)
          return new Promise(() => {})
        },
      })
    }
    expect(commits).toEqual(["one"])
    expect(queue.getState().entries.map((entry) => entry.phase)).toEqual(["committing", "waiting", "waiting"])
  })

  it("flush commits everything that is waiting", () => {
    const { queue, commit } = setup()
    queue.run({ message: "A", commit })
    queue.run({ message: "B", commit })
    queue.flush()
    expect(commit).toHaveBeenCalledTimes(2)
  })

  it("dismissing a waiting action commits it now", () => {
    const { queue, commit } = setup()
    const id = queue.run({ message: "A", commit })
    queue.dismiss(id)
    expect(commit).toHaveBeenCalled()
  })
})

describe("countdown helpers", () => {
  it("rounds seconds up and reports the fraction left", () => {
    const entry = { duration: 6000, remaining: 6000, deadline: 6000 }
    expect(getSecondsLeft(entry, 0)).toBe(6)
    expect(getSecondsLeft(entry, 100)).toBe(6)
    expect(getSecondsLeft(entry, 5001)).toBe(1)
    expect(getSecondsLeft(entry, 7000)).toBe(0)
    expect(getCountdownFraction(entry, 3000)).toBe(0.5)
    expect(getCountdownFraction({ ...entry, deadline: null, remaining: 1500 }, 99_999)).toBe(0.25)
  })
})
