"use client"

import * as React from "react"

import type {
  FilterDefinition,
  FilterValue,
} from "./filter-bar-types"

export type FilterBarMode = "instant" | "apply"

export interface FilterBarLabels {
  /** Accessible name of the trigger button. */
  trigger: string
  /** Announced after the trigger name along with the active count. */
  triggerActiveSuffix: (count: number) => string
  /** Heading inside the filter panel. */
  title: string
  /** Removes every committed filter from the bar. */
  clearAll: string
  /** Removes every draft filter from the open panel header. */
  clearPanel: string
  cancel: string
  apply: string
  moreCount: (count: number) => string
  removeFilter: (label: string) => string
  loadingOptions: string
  retryOptions: string
  optionsError: string
  noMatches: (query: string) => string
}

export const DEFAULT_FILTER_BAR_LABELS: FilterBarLabels = {
  trigger: "Filter",
  triggerActiveSuffix: (count) =>
    `${count} active filter${count === 1 ? "" : "s"}`,
  title: "Filters",
  clearAll: "Clear all",
  clearPanel: "Clear all filters",
  cancel: "Cancel",
  apply: "Apply filters",
  moreCount: (count) => `+${count}`,
  removeFilter: (label) => `Remove ${label} filter`,
  loadingOptions: "Loading...",
  retryOptions: "Try again",
  optionsError: "Could not load these options.",
  noMatches: (query) => `No results match "${query}".`,
}

/**
 * Keeps Date objects intact across draft copies so committed ranges and
 * drafts stay comparable without serialization surprises.
 */
export function cloneFilterEntryValue(value: unknown): unknown {
  if (value instanceof Date) return new Date(value.getTime())
  if (Array.isArray(value)) return value.map(cloneFilterEntryValue)

  if (typeof value === "object" && value != null) {
    const copy: Record<string, unknown> = {}

    for (const [part, partValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      copy[part] = cloneFilterEntryValue(partValue)
    }

    return copy
  }

  return value
}

export function cloneFilterValues(values: FilterValue[]): FilterValue[] {
  return values.map((entry) => ({
    ...entry,
    value: cloneFilterEntryValue(entry.value),
  }))
}

/* ------------------------------------------------------------------ */
/* Controller shared by every part                                     */
/* ------------------------------------------------------------------ */

interface FilterBarControllerValue {
  mode: FilterBarMode
  orderedDefinitions: FilterDefinition[]
  definitionOf: (key: string) => FilterDefinition | undefined
  /** Filters owned by the application right now. */
  committed: FilterValue[]
  /** The surface fields read and write while a panel is open. */
  editing: FilterValue[]
  hasDraft: boolean
  open: boolean
  activeCount: number
  activeEntries: FilterValue[]
  labels: FilterBarLabels
  searchThreshold: number
  showOptionCounts: boolean
  valuesDisplay: "collapse" | "wrap"
  disabled: boolean
  openPanel: (options?: { focusKey?: string }) => void
  closePanel: () => void
  applyDraft: () => void
  cancelDraft: () => void
  setEntry: (key: string, value: unknown, operator?: string) => void
  setEntryOperator: (key: string, operator: string) => void
  removeEditing: (key: string) => void
  clearEditing: () => void
  removeCommitted: (key: string) => void
  clearCommitted: () => void
  registerFocusGroup: (key: string, element: HTMLElement | null) => void
}

export const FilterBarControllerContext =
  React.createContext<FilterBarControllerValue | null>(null)

export function useController(componentName: string): FilterBarControllerValue {
  const controller = React.useContext(FilterBarControllerContext)

  if (!controller) {
    throw new Error(`${componentName} must be used within FilterBar`)
  }

  return controller
}

/** Field controls read the same controller through the friendlier name. */
export const useFilterBarContext = useController

export type { FilterBarControllerValue }
