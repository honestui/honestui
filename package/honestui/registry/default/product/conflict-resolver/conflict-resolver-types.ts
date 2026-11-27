import type * as React from "react"

/** The two edited versions: `ours` is the person resolving, `theirs` is the other edit. */
export type ConflictSide = "ours" | "theirs"

export type ConflictResolution = { source: ConflictSide } | { source: "custom"; value: unknown }

/** Choices keyed by field key. A conflict with no entry is unresolved. */
export type ConflictResolutions = Record<string, ConflictResolution>

/**
 * How a field compares across the three versions.
 * - `conflict`: both sides changed it, to different values.
 * - `ours` / `theirs`: only that side changed it, so it merges on its own.
 * - `both`: both sides made the same change.
 * - `unchanged`: nobody changed it.
 */
export type ConflictFieldStatus = "conflict" | ConflictSide | "both" | "unchanged"

export type ConflictField = {
  /** Dot path into each version, such as `billing.email`. Also the resolution key. */
  key: string
  label: string
  /** Display for one version's value. */
  render?: ((value: unknown) => React.ReactNode) | undefined
  /** Replaces comparison by content, for values such as trimmed text. */
  isEqual?: ((a: unknown, b: unknown) => boolean) | undefined
  /**
   * Offers a text box for a value of your own. Defaults to true for text and
   * number values. Use `parse` and `format` for anything else.
   */
  editable?: boolean | undefined
  /** Turns the typed text into the stored value. Defaults to the text, or a number for number fields. */
  parse?: ((text: string) => unknown) | undefined
  /** Turns a value into the text shown in the box. Defaults to `String(value)`. */
  format?: ((value: unknown) => string) | undefined
}

export type ConflictFieldGroup = {
  group: string
  fields: ConflictFieldNode[]
}

export type ConflictFieldNode = ConflictField | ConflictFieldGroup

export type ConflictEntry = {
  key: string
  label: string
  /** Group labels from the outermost inward. */
  groups: string[]
  status: ConflictFieldStatus
  base: unknown
  ours: unknown
  theirs: unknown
  field: ConflictField
}

export type ConflictCounts = {
  /** Fields both sides changed differently. */
  conflicts: number
  /** Conflicts with a choice. */
  resolved: number
  /** Fields only one side changed, or both changed the same way. */
  merged: number
  total: number
}

export type ConflictResolverLabels = {
  ours: string
  theirs: string
  base: string
  custom: string
  notSet: string
  enabled: string
  disabled: string
  summary: (counts: ConflictCounts) => string
  merged: (count: number) => string
  showAll: string
  keepAllOurs: string
  takeAllTheirs: string
  apply: string
  applyHint: string
  empty: string
  /** Names each field's choice for screen readers. */
  choiceFor: (label: string) => string
  customValueFor: (label: string) => string
  status: Record<Exclude<ConflictFieldStatus, "conflict">, string>
}
