import type * as React from "react"

/**
 * `"always"` keeps the action in the toolbar. A number ranks it against the
 * other actions: the lowest number moves into the menu first.
 */
export type OverflowPriority = "always" | number

/** What the toolbar knows about one action, wherever it is currently shown. */
export type OverflowToolbarItemRecord = {
  id: string
  priority: OverflowPriority
  label: string
  icon: React.ReactNode
  disabled: boolean
  /** The group the action sits in, or `null` when it is a direct child of the toolbar. */
  groupId: string | null
  groupLabel: string | null
  select: () => void
}

export type OverflowToolbarItemStore = {
  /** Every registered action, in the order the actions appear in the document. */
  getItems: () => readonly OverflowToolbarItemRecord[]
  subscribe: (listener: () => void) => () => void
  /** Adds the action, or replaces it when any of its fields changed. */
  upsert: (record: OverflowToolbarItemRecord) => void
  remove: (id: string) => void
  /** Sorts the actions to match `ids`. Actions missing from `ids` go last. */
  reorder: (ids: readonly string[]) => void
}

export type OverflowFitState = {
  /** How many actions, counted from the start of the collapse order, are in the menu. */
  collapsedCount: number
  /** A count that overflowed, and the toolbar width it overflowed at. */
  failedCount: { collapsedCount: number; width: number } | null
}

/** One reading of the rendered toolbar. */
export type OverflowMeasurement = {
  /** The toolbar's inner width in CSS pixels. */
  width: number
  /** The content is wider than the toolbar. */
  overflows: boolean
  /** How many actions are allowed to collapse. */
  collapsibleCount: number
  /** `false` holds actions in the menu, which keeps an open menu from changing under the pointer. */
  canRestore: boolean
}

/** A run of collapsed actions that share a group, as the menu lists them. */
export type OverflowMenuSection = {
  key: string
  /** The group's label, or `null` for actions outside any group. */
  label: string | null
  items: readonly OverflowToolbarItemRecord[]
}
