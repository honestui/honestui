import type {
  SavedView,
  SavedViewChangedPart,
  SavedViewFilter,
  SavedViewNameError,
  SavedViewState,
  SavedViewsLabels,
} from "./saved-views-types"

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object") return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Compares by content: dates by time, arrays in order, objects by key. */
export function isEqualValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isEqualValue(item, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a).filter((key) => a[key] !== undefined)
    const otherKeys = Object.keys(b).filter((key) => b[key] !== undefined)
    return (
      keys.length === otherKeys.length &&
      keys.every((key) => Object.hasOwn(b, key) && isEqualValue(a[key], b[key]))
    )
  }
  return false
}

function isEmptyFilterValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
}

/**
 * Filters compare as a set keyed by filter key: the order chips were added in
 * does not make a view dirty, and a filter with no value counts as absent.
 * Multi-select values compare without regard to order.
 */
export function areFiltersEqual(
  a: SavedViewFilter[] | undefined,
  b: SavedViewFilter[] | undefined
): boolean {
  const normalize = (filters: SavedViewFilter[] | undefined) =>
    new Map(
      (filters ?? [])
        .filter((filter) => !isEmptyFilterValue(filter.value))
        .map((filter) => [
          filter.key,
          {
            operator: filter.operator,
            value: Array.isArray(filter.value)
              ? [...filter.value].map(String).sort()
              : filter.value,
          },
        ])
    )
  const left = normalize(a)
  const right = normalize(b)
  if (left.size !== right.size) return false
  for (const [key, entry] of left) {
    const other = right.get(key)
    if (!other || !isEqualValue(entry, other)) return false
  }
  return true
}

/** A column missing from the record is visible, so `{}` and `{ name: true }` match. */
export function areColumnsEqual(
  a: Record<string, boolean> | undefined,
  b: Record<string, boolean> | undefined
): boolean {
  const hidden = (columns: Record<string, boolean> | undefined) =>
    Object.entries(columns ?? {})
      .filter(([, visible]) => visible === false)
      .map(([id]) => id)
      .sort()
  return isEqualValue(hidden(a), hidden(b))
}

const KNOWN_KEYS = new Set(["filters", "sorting", "columnVisibility", "search"])

/** Lists what the table shows now that the saved view does not, in a stable order. */
export function getChangedParts(
  saved: SavedViewState,
  current: SavedViewState
): SavedViewChangedPart[] {
  const parts: SavedViewChangedPart[] = []
  if (!areFiltersEqual(saved.filters, current.filters)) parts.push("filters")
  if (!isEqualValue(saved.sorting ?? [], current.sorting ?? [])) parts.push("sorting")
  if (!areColumnsEqual(saved.columnVisibility, current.columnVisibility)) parts.push("columns")
  if ((saved.search ?? "").trim() !== (current.search ?? "").trim()) parts.push("search")

  const extraKeys = new Set(
    [...Object.keys(saved), ...Object.keys(current)].filter((key) => !KNOWN_KEYS.has(key))
  )
  if ([...extraKeys].some((key) => !isEqualValue(saved[key], current[key]))) parts.push("other")
  return parts
}

export function isViewStateEqual(saved: SavedViewState, current: SavedViewState): boolean {
  return getChangedParts(saved, current).length === 0
}

/** Trims and collapses inner whitespace, so "  Open   deals " is stored as "Open deals". */
export function normalizeViewName(name: string): string {
  return name.trim().replace(/\s+/g, " ")
}

/** Names compare without case, so "Open deals" and "open deals" cannot both exist. */
export function validateViewName(
  name: string,
  views: SavedView[],
  exceptId?: string
): SavedViewNameError | null {
  const normalized = normalizeViewName(name)
  if (!normalized) return "empty"
  const lower = normalized.toLocaleLowerCase()
  const taken = views.some(
    (view) => view.id !== exceptId && normalizeViewName(view.name).toLocaleLowerCase() === lower
  )
  return taken ? "duplicate" : null
}

/** The first of "Name copy", "Name copy 2", "Name copy 3"… that no view uses yet. */
export function getUniqueViewName(
  base: string,
  views: SavedView[],
  copyName: (name: string) => string = defaultSavedViewsLabels.copyName
): string {
  const first = copyName(normalizeViewName(base))
  if (!validateViewName(first, views)) return first
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${first} ${index}`
    if (!validateViewName(candidate, views)) return candidate
  }
  return first
}

const partNames: Record<SavedViewChangedPart, string> = {
  filters: "Filters",
  sorting: "sort",
  columns: "columns",
  search: "search",
  other: "settings",
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

export const defaultSavedViewsLabels: SavedViewsLabels = {
  view: "View",
  views: "Views",
  unsaved: "Unsaved changes",
  unsavedSuffix: "unsaved changes",
  changedParts: (parts) => {
    if (parts.length === 0) return ""
    const words = parts.map((part) => partNames[part].toLowerCase())
    const sentence = joinList(words)
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} changed`
  },
  save: "Save",
  saveAsNew: "Save as new",
  saveAsNewEllipsis: "Save as new view…",
  discard: "Discard",
  rename: "Rename…",
  delete: "Delete view",
  setDefault: "Set as default",
  default: "Default",
  shared: "Shared with team",
  locked: "Built-in view",
  cancel: "Cancel",
  viewName: "View name",
  copyName: (name) => `${name} copy`,
  nameErrors: {
    empty: "Give the view a name.",
    duplicate: "A view with this name already exists.",
  },
  deleteConfirm: (name) => `Delete “${name}”?`,
  deleteDescription: "Anyone who uses it will lose it.",
  saving: "Saving…",
  saveFailed: "The view could not be saved. Try again.",
}
