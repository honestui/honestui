/**
 * One filter in a view. The shape matches Filter Bar's `FilterValue`, so a
 * Filter Bar's value can be stored in a view and restored without mapping.
 */
export type SavedViewFilter = {
  key: string
  operator?: string | undefined
  value: unknown
}

/** One sort rule. The shape matches TanStack Table's `SortingState` entries. */
export type SavedViewSort = {
  id: string
  desc: boolean
}

/**
 * What a view remembers about a table. Every part is optional, so a view can
 * hold only the parts your screen has. Extra keys are compared as well.
 */
export type SavedViewState = {
  filters?: SavedViewFilter[] | undefined
  sorting?: SavedViewSort[] | undefined
  /** Column id to visibility, like TanStack Table's `VisibilityState`. A missing column is visible. */
  columnVisibility?: Record<string, boolean> | undefined
  search?: string | undefined
  [key: string]: unknown
}

export type SavedView = {
  id: string
  name: string
  state: SavedViewState
  /** Seen by the whole team. Shows a marker in the list. */
  shared?: boolean | undefined
  /** A built-in view that cannot be renamed, deleted, or overwritten. It can still be saved as a new view. */
  locked?: boolean | undefined
}

/** The parts of a view's state that differ from what the table shows now. */
export type SavedViewChangedPart = "filters" | "sorting" | "columns" | "search" | "other"

export type SavedViewNameError = "empty" | "duplicate"

export type SavedViewsLabels = {
  /** Names the trigger, followed by the view name. */
  view: string
  views: string
  unsaved: string
  /** Read after the view name on the trigger when the view has unsaved changes. */
  unsavedSuffix: string
  changedParts: (parts: SavedViewChangedPart[]) => string
  save: string
  saveAsNew: string
  saveAsNewEllipsis: string
  discard: string
  rename: string
  delete: string
  setDefault: string
  default: string
  shared: string
  locked: string
  cancel: string
  viewName: string
  /** Suggested name for a new view made from the current one. */
  copyName: (name: string) => string
  nameErrors: Record<SavedViewNameError, string>
  deleteConfirm: (name: string) => string
  deleteDescription: string
  saving: string
  saveFailed: string
}
