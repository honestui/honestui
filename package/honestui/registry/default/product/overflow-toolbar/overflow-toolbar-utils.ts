import type {
  OverflowFitState,
  OverflowMeasurement,
  OverflowMenuSection,
  OverflowToolbarItemRecord,
  OverflowToolbarItemStore,
} from "./overflow-toolbar-types"

export const defaultOverflowPriority = 0

export const initialOverflowFitState: OverflowFitState = {
  collapsedCount: 0,
  failedCount: null,
}

const comparedFields = [
  "priority",
  "label",
  "icon",
  "disabled",
  "groupId",
  "groupLabel",
  "select",
] as const satisfies readonly (keyof OverflowToolbarItemRecord)[]

/**
 * Holds the actions outside React state, so an action can report its latest
 * props on every render without re-rendering the toolbar when nothing changed.
 */
export function createOverflowToolbarItemStore(): OverflowToolbarItemStore {
  let items: readonly OverflowToolbarItemRecord[] = []
  const listeners = new Set<() => void>()

  function replaceItems(next: readonly OverflowToolbarItemRecord[]) {
    items = next
    listeners.forEach((listener) => listener())
  }

  return {
    getItems: () => items,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    upsert(record) {
      const index = items.findIndex((item) => item.id === record.id)

      if (index === -1) {
        replaceItems([...items, record])
        return
      }

      const current = items[index]
      if (comparedFields.every((field) => Object.is(current[field], record[field]))) return

      replaceItems(items.map((item) => (item.id === record.id ? record : item)))
    },
    remove(id) {
      if (items.some((item) => item.id === id)) {
        replaceItems(items.filter((item) => item.id !== id))
      }
    },
    reorder(ids) {
      const position = new Map(ids.map((id, index) => [id, index]))
      const positionOf = (item: OverflowToolbarItemRecord) => position.get(item.id) ?? ids.length
      // Array sorting is stable, so actions missing from `ids` keep their relative order.
      const sorted = [...items].sort((a, b) => positionOf(a) - positionOf(b))

      if (sorted.some((item, index) => item !== items[index])) replaceItems(sorted)
    },
  }
}

/**
 * The ids of the actions that may collapse, first to collapse first: lowest
 * priority, and among equals the one nearest the end of the toolbar.
 */
export function getCollapseOrder(items: readonly OverflowToolbarItemRecord[]): string[] {
  return items
    .flatMap((item, position) =>
      item.priority === "always" ? [] : [{ id: item.id, priority: item.priority, position }]
    )
    .sort((a, b) => a.priority - b.priority || b.position - a.position)
    .map((item) => item.id)
}

/**
 * Decides the next count from one reading of the toolbar. The toolbar renders
 * the result and measures again, until a reading returns the same count.
 *
 * An overflow collapses one more action. A fit tries one fewer, because only
 * rendering shows whether the action has room; `failedCount` remembers the
 * attempt that overflowed, so the same width is not tried twice.
 */
export function stepOverflowFit(
  state: OverflowFitState,
  measurement: OverflowMeasurement
): OverflowFitState {
  const collapsedCount = Math.min(state.collapsedCount, measurement.collapsibleCount)

  if (measurement.overflows) {
    return {
      // Once only pinned actions are left there is nothing more to collapse.
      collapsedCount: Math.min(collapsedCount + 1, measurement.collapsibleCount),
      failedCount: { collapsedCount, width: measurement.width },
    }
  }

  const restoredCount = collapsedCount - 1
  const isKnownToOverflow =
    state.failedCount !== null &&
    state.failedCount.collapsedCount === restoredCount &&
    measurement.width <= state.failedCount.width

  if (collapsedCount === 0 || !measurement.canRestore || isKnownToOverflow) {
    return { collapsedCount, failedCount: state.failedCount }
  }

  return { collapsedCount: restoredCount, failedCount: state.failedCount }
}

/**
 * The collapsed actions in document order, split where the group changes, so
 * the menu can repeat the toolbar's grouping.
 */
export function getOverflowMenuSections(
  items: readonly OverflowToolbarItemRecord[],
  collapsedIds: ReadonlySet<string>
): OverflowMenuSection[] {
  const sections: { key: string; label: string | null; items: OverflowToolbarItemRecord[] }[] = []
  let lastGroupId: string | null | undefined

  for (const item of items) {
    if (!collapsedIds.has(item.id)) continue

    const last = sections.at(-1)
    if (last && item.groupId === lastGroupId) {
      last.items.push(item)
      continue
    }

    sections.push({ key: item.groupId ?? item.id, label: item.groupLabel, items: [item] })
    lastGroupId = item.groupId
  }

  return sections
}
