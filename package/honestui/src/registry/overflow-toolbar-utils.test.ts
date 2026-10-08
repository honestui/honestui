import { describe, expect, it, vi } from "vitest"

import {
  createOverflowToolbarItemStore,
  getCollapseOrder,
  getOverflowMenuSections,
  initialOverflowFitState,
  stepOverflowFit,
} from "../../registry/default/product/overflow-toolbar/overflow-toolbar-utils"
import type {
  OverflowFitState,
  OverflowPriority,
  OverflowToolbarItemRecord,
} from "../../registry/default/product/overflow-toolbar/overflow-toolbar-types"

function action(
  id: string,
  priority: OverflowPriority = 0,
  fields: Partial<OverflowToolbarItemRecord> = {}
): OverflowToolbarItemRecord {
  return {
    id,
    priority,
    label: id,
    icon: null,
    disabled: false,
    groupId: null,
    groupLabel: null,
    select: noop,
    ...fields,
  }
}

function noop() {}

/**
 * A toolbar reduced to arithmetic: every action is `actionWidth` wide, and the
 * More button takes `moreWidth` once anything is collapsed. `fit` repeats the
 * step until the count settles, as the component does across renders.
 */
function createToolbar({ actionCount = 5, actionWidth = 100, moreWidth = 60 } = {}) {
  let state = initialOverflowFitState
  let rendersSinceResize = 0

  function contentWidth(collapsedCount: number) {
    return (actionCount - collapsedCount) * actionWidth + (collapsedCount > 0 ? moreWidth : 0)
  }

  function fit(width: number, { canRestore = true } = {}): OverflowFitState {
    rendersSinceResize = 0

    for (;;) {
      const next = stepOverflowFit(state, {
        width,
        overflows: contentWidth(state.collapsedCount) > width,
        collapsibleCount: actionCount,
        canRestore,
      })
      if (next.collapsedCount === state.collapsedCount) {
        state = next
        return state
      }
      state = next
      rendersSinceResize += 1
      if (rendersSinceResize > 50) throw new Error("the fit did not settle")
    }
  }

  return { fit, contentWidth, renders: () => rendersSinceResize }
}

describe("getCollapseOrder", () => {
  it("collapses the lowest priority first", () => {
    const items = [action("share", 3), action("print", 1), action("export", 2)]

    expect(getCollapseOrder(items)).toEqual(["print", "export", "share"])
  })

  it("collapses from the end of the toolbar when priorities are equal", () => {
    const items = [action("undo"), action("redo"), action("print")]

    expect(getCollapseOrder(items)).toEqual(["print", "redo", "undo"])
  })

  it("leaves out actions that always stay visible", () => {
    const items = [action("save", "always"), action("print", 1), action("share", "always")]

    expect(getCollapseOrder(items)).toEqual(["print"])
  })

  it("orders negative and fractional priorities numerically", () => {
    const items = [action("a", 0.5), action("b", -1), action("c", 0)]

    expect(getCollapseOrder(items)).toEqual(["b", "c", "a"])
  })
})

describe("stepOverflowFit", () => {
  it("collapses nothing when everything fits", () => {
    const toolbar = createToolbar()

    expect(toolbar.fit(500).collapsedCount).toBe(0)
    expect(toolbar.renders()).toBe(0)
  })

  it("settles on the fewest collapsed actions that fit, counting the More button", () => {
    const toolbar = createToolbar()

    // Four actions need 400, but More takes 60 as soon as one action collapses.
    expect(toolbar.fit(450).collapsedCount).toBe(2)
    expect(toolbar.contentWidth(2)).toBeLessThanOrEqual(450)
    expect(toolbar.contentWidth(1)).toBeGreaterThan(450)
  })

  it("restores actions when the toolbar widens", () => {
    const toolbar = createToolbar()
    toolbar.fit(200)

    expect(toolbar.fit(470).collapsedCount).toBe(1)
    expect(toolbar.fit(500).collapsedCount).toBe(0)
  })

  it("does not try a count again at a width where it already overflowed", () => {
    const toolbar = createToolbar()
    toolbar.fit(450)

    toolbar.fit(450)
    expect(toolbar.renders()).toBe(0)

    toolbar.fit(440)
    expect(toolbar.renders()).toBe(0)
  })

  it("tries the next action again once the toolbar is wider than the failed attempt", () => {
    const toolbar = createToolbar()
    toolbar.fit(450)

    expect(toolbar.fit(455).collapsedCount).toBe(2)
    // One render to try the action, one to take it back.
    expect(toolbar.renders()).toBe(2)
  })

  it("stops at the pinned actions when even they do not fit", () => {
    let state = initialOverflowFitState

    for (let step = 0; step < 5; step += 1) {
      state = stepOverflowFit(state, {
        width: 40,
        overflows: true,
        collapsibleCount: 2,
        canRestore: true,
      })
    }

    expect(state.collapsedCount).toBe(2)
  })

  it("collapses nothing when no action may collapse", () => {
    const state = stepOverflowFit(initialOverflowFitState, {
      width: 40,
      overflows: true,
      collapsibleCount: 0,
      canRestore: true,
    })

    expect(state.collapsedCount).toBe(0)
  })

  it("holds actions in the menu while restoring is paused, and still collapses", () => {
    const toolbar = createToolbar()
    toolbar.fit(300)

    expect(toolbar.fit(500, { canRestore: false }).collapsedCount).toBe(3)
    expect(toolbar.fit(200, { canRestore: false }).collapsedCount).toBe(4)
    expect(toolbar.fit(500).collapsedCount).toBe(0)
  })

  it("lowers the count when collapsible actions are removed", () => {
    const state = stepOverflowFit(
      { collapsedCount: 4, failedCount: null },
      { width: 300, overflows: false, collapsibleCount: 2, canRestore: false }
    )

    expect(state.collapsedCount).toBe(2)
  })
})

describe("getOverflowMenuSections", () => {
  const history = { groupId: "history", groupLabel: "History" }
  const sharing = { groupId: "sharing", groupLabel: "Sharing" }

  it("lists collapsed actions in document order under their group", () => {
    const items = [
      action("undo", 0, history),
      action("redo", 0, history),
      action("copy", 0, sharing),
      action("print", 0, sharing),
    ]

    const sections = getOverflowMenuSections(items, new Set(["print", "redo", "copy"]))

    expect(sections.map((section) => [section.label, section.items.map((item) => item.id)])).toEqual([
      ["History", ["redo"]],
      ["Sharing", ["copy", "print"]],
    ])
  })

  it("puts actions outside a group in a section without a label", () => {
    const items = [action("undo", 0, history), action("archive"), action("delete")]

    const sections = getOverflowMenuSections(items, new Set(["undo", "archive", "delete"]))

    expect(sections.map((section) => section.label)).toEqual(["History", null])
    expect(sections[1].items.map((item) => item.id)).toEqual(["archive", "delete"])
  })

  it("gives every section a distinct key", () => {
    const items = [action("find"), action("undo", 0, history), action("archive")]

    const sections = getOverflowMenuSections(items, new Set(["find", "undo", "archive"]))

    expect(new Set(sections.map((section) => section.key)).size).toBe(3)
  })

  it("returns no sections when nothing is collapsed", () => {
    expect(getOverflowMenuSections([action("undo")], new Set())).toEqual([])
  })
})

describe("createOverflowToolbarItemStore", () => {
  it("notifies when an action is added, changed, or removed", () => {
    const store = createOverflowToolbarItemStore()
    const listener = vi.fn()
    store.subscribe(listener)

    store.upsert(action("print"))
    store.upsert(action("print", 0, { disabled: true }))
    store.remove("print")

    expect(listener).toHaveBeenCalledTimes(3)
    expect(store.getItems()).toEqual([])
  })

  it("keeps the same list when an action reports unchanged fields", () => {
    const store = createOverflowToolbarItemStore()
    store.upsert(action("print"))
    const items = store.getItems()
    const listener = vi.fn()
    store.subscribe(listener)

    store.upsert(action("print"))
    store.remove("missing")

    expect(listener).not.toHaveBeenCalled()
    expect(store.getItems()).toBe(items)
  })

  it("sorts actions into document order, with unknown actions last", () => {
    const store = createOverflowToolbarItemStore()
    store.upsert(action("print"))
    store.upsert(action("late"))
    store.upsert(action("undo"))

    store.reorder(["undo", "print"])

    expect(store.getItems().map((item) => item.id)).toEqual(["undo", "print", "late"])
  })

  it("does not notify when the order is already right", () => {
    const store = createOverflowToolbarItemStore()
    store.upsert(action("undo"))
    store.upsert(action("print"))
    const listener = vi.fn()
    store.subscribe(listener)

    store.reorder(["undo", "print"])

    expect(listener).not.toHaveBeenCalled()
  })

  it("stops notifying a listener that unsubscribed", () => {
    const store = createOverflowToolbarItemStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.upsert(action("print"))

    expect(listener).not.toHaveBeenCalled()
  })
})
