import type {
  ConflictCounts,
  ConflictEntry,
  ConflictField,
  ConflictFieldNode,
  ConflictFieldStatus,
  ConflictResolution,
  ConflictResolutions,
  ConflictResolverLabels,
  ConflictSide,
} from "./conflict-resolver-types"

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object") return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Reads a dot path such as `billing.email`; missing steps read as undefined. */
export function getValueAtPath(source: unknown, path: string): unknown {
  let current = source
  for (const segment of path.split(".")) {
    if (current === null || current === undefined) return undefined
    current = (current as PlainObject)[segment]
  }
  return current
}

/** Returns a copy of `source` with `path` set, sharing every untouched branch. */
export function setValueAtPath<T>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".")
  const base: PlainObject = isPlainObject(source) ? { ...source } : {}
  base[head] = rest.length === 0 ? value : setValueAtPath(base[head], rest.join("."), value)
  return base as T
}

export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && isDeepEqual(a[key], b[key]))
    )
  }
  return false
}

export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === ""
}

/**
 * Three-way comparison. Without a base version, any difference between the
 * two sides is a conflict, because there is no way to tell who changed what.
 */
export function getFieldStatus(
  base: unknown,
  ours: unknown,
  theirs: unknown,
  options: { hasBase: boolean; isEqual?: ((a: unknown, b: unknown) => boolean) | undefined }
): ConflictFieldStatus {
  const equal = (a: unknown, b: unknown) =>
    options.isEqual ? options.isEqual(a, b) : isDeepEqual(a, b)
  if (equal(ours, theirs)) {
    return options.hasBase && !equal(base, ours) ? "both" : "unchanged"
  }
  if (!options.hasBase) return "conflict"
  const oursChanged = !equal(base, ours)
  const theirsChanged = !equal(base, theirs)
  if (oursChanged && theirsChanged) return "conflict"
  return oursChanged ? "ours" : "theirs"
}

/** One entry per field, in field order, with each version's value and how they compare. */
export function getConflictEntries(
  versions: { base?: unknown; ours: unknown; theirs: unknown },
  fields: ConflictFieldNode[],
  groups: string[] = []
): ConflictEntry[] {
  const hasBase = versions.base !== undefined
  return fields.flatMap((node): ConflictEntry[] => {
    if ("group" in node) {
      return getConflictEntries(versions, node.fields, [...groups, node.group])
    }
    const base = hasBase ? getValueAtPath(versions.base, node.key) : undefined
    const ours = getValueAtPath(versions.ours, node.key)
    const theirs = getValueAtPath(versions.theirs, node.key)
    return [
      {
        key: node.key,
        label: node.label,
        groups,
        status: getFieldStatus(base, ours, theirs, { hasBase, isEqual: node.isEqual }),
        base,
        ours,
        theirs,
        field: node,
      },
    ]
  })
}

/** The side a field takes when nobody chooses: the side that changed it. */
export function getAutomaticSide(status: ConflictFieldStatus): ConflictSide | null {
  if (status === "theirs") return "theirs"
  if (status === "conflict") return null
  return "ours"
}

/** The choice in effect for an entry: an explicit one first, then the automatic one. */
export function getEffectiveResolution(
  entry: ConflictEntry,
  resolutions: ConflictResolutions
): ConflictResolution | null {
  const chosen = resolutions[entry.key]
  if (chosen) return chosen
  const side = getAutomaticSide(entry.status)
  return side ? { source: side } : null
}

export function getResolvedValue(entry: ConflictEntry, resolution: ConflictResolution): unknown {
  if (resolution.source === "custom") return resolution.value
  return resolution.source === "ours" ? entry.ours : entry.theirs
}

export function countConflicts(
  entries: ConflictEntry[],
  resolutions: ConflictResolutions
): ConflictCounts {
  const counts: ConflictCounts = { conflicts: 0, resolved: 0, merged: 0, total: entries.length }
  for (const entry of entries) {
    if (entry.status === "conflict") {
      counts.conflicts += 1
      if (resolutions[entry.key]) counts.resolved += 1
    } else if (entry.status !== "unchanged") {
      counts.merged += 1
    }
  }
  return counts
}

/** Chooses one side for every conflict, keeping the choices already made on other fields. */
export function chooseSideForAll(
  entries: ConflictEntry[],
  resolutions: ConflictResolutions,
  side: ConflictSide
): ConflictResolutions {
  const next = { ...resolutions }
  for (const entry of entries) {
    if (entry.status === "conflict") next[entry.key] = { source: side }
  }
  return next
}

/**
 * Builds the merged record. It starts from `ours`, so keys outside `fields`
 * keep the resolver's own values, then sets each field to its effective choice.
 * `unresolved` lists the conflicts still waiting for a choice; their fields keep `ours`.
 */
export function mergeVersions<T>(
  ours: T,
  entries: ConflictEntry[],
  resolutions: ConflictResolutions
): { value: T; unresolved: string[] } {
  let value = ours
  const unresolved: string[] = []
  for (const entry of entries) {
    const resolution = getEffectiveResolution(entry, resolutions)
    if (!resolution) {
      unresolved.push(entry.key)
      continue
    }
    const next = getResolvedValue(entry, resolution)
    if (!isDeepEqual(getValueAtPath(value, entry.key), next)) {
      value = setValueAtPath(value, entry.key, next)
    }
  }
  return { value, unresolved }
}

/** Text and number values get a text box unless the field says otherwise. */
export function isFieldEditable(entry: ConflictEntry): boolean {
  if (entry.field.editable !== undefined) return entry.field.editable
  const sample = [entry.ours, entry.theirs].find((value) => !isEmptyValue(value))
  return typeof sample === "string" || typeof sample === "number"
}

export function parseFieldText(entry: ConflictEntry, field: ConflictField, text: string): unknown {
  if (field.parse) return field.parse(text)
  const sample = [entry.ours, entry.theirs].find((value) => !isEmptyValue(value))
  if (typeof sample === "number") {
    const number = Number(text.trim())
    return text.trim() === "" || Number.isNaN(number) ? text : number
  }
  return text
}

export function formatFieldText(field: ConflictField, value: unknown): string {
  if (field.format) return field.format(value)
  return isEmptyValue(value) ? "" : String(value)
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export const defaultConflictResolverLabels: ConflictResolverLabels = {
  ours: "Yours",
  theirs: "Theirs",
  base: "Was",
  custom: "Write a different value",
  notSet: "Not set",
  enabled: "Enabled",
  disabled: "Disabled",
  summary: ({ conflicts, resolved }) =>
    conflicts === 0
      ? "No conflicts"
      : `${resolved} of ${plural(conflicts, "conflict", "conflicts")} resolved`,
  merged: (count) => `${plural(count, "change", "changes")} merged automatically`,
  showAll: "Show merged fields",
  keepAllOurs: "Keep all yours",
  takeAllTheirs: "Take all theirs",
  apply: "Apply merge",
  applyHint: "Choose a version for every conflict to apply the merge.",
  empty: "Nothing conflicts. Every change merged on its own.",
  choiceFor: (label) => `Version of ${label} to keep`,
  customValueFor: (label) => `Your value for ${label}`,
  status: {
    ours: "Only you changed this",
    theirs: "Only they changed this",
    both: "You both made this change",
    unchanged: "Nobody changed this",
  },
}
