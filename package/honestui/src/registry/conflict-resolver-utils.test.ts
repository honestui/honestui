import { describe, expect, it } from "vitest"

import {
  chooseSideForAll,
  countConflicts,
  getConflictEntries,
  getEffectiveResolution,
  getFieldStatus,
  isFieldEditable,
  mergeVersions,
  parseFieldText,
} from "../../registry/default/product/conflict-resolver/conflict-resolver-utils"
import type { ConflictFieldNode } from "../../registry/default/product/conflict-resolver/conflict-resolver-types"

const base = { name: "Acme", email: "a@acme.test", seats: 10, plan: "Team", meta: { region: "eu" } }
const ours = { ...base, email: "b@acme.test", seats: 12, meta: { region: "us" } }
const theirs = { ...base, email: "c@acme.test", plan: "Business", meta: { region: "us" } }

const fields: ConflictFieldNode[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "seats", label: "Seats" },
  { key: "plan", label: "Plan" },
  { group: "Meta", fields: [{ key: "meta.region", label: "Region" }] },
]

describe("getFieldStatus", () => {
  it("classifies three-way changes", () => {
    const options = { hasBase: true }
    expect(getFieldStatus(1, 1, 1, options)).toBe("unchanged")
    expect(getFieldStatus(1, 2, 2, options)).toBe("both")
    expect(getFieldStatus(1, 2, 1, options)).toBe("ours")
    expect(getFieldStatus(1, 1, 2, options)).toBe("theirs")
    expect(getFieldStatus(1, 2, 3, options)).toBe("conflict")
  })

  it("calls every difference a conflict without a base", () => {
    expect(getFieldStatus(undefined, 1, 2, { hasBase: false })).toBe("conflict")
    expect(getFieldStatus(undefined, 1, 1, { hasBase: false })).toBe("unchanged")
  })

  it("uses a custom comparison", () => {
    const isEqual = (a: unknown, b: unknown) => String(a).trim() === String(b).trim()
    expect(getFieldStatus("x", "x ", "x", { hasBase: true, isEqual })).toBe("unchanged")
  })
})

describe("conflict entries", () => {
  const entries = getConflictEntries({ base, ours, theirs }, fields)

  it("reads nested paths and keeps group labels", () => {
    expect(entries.map((entry) => [entry.key, entry.status])).toEqual([
      ["name", "unchanged"],
      ["email", "conflict"],
      ["seats", "ours"],
      ["plan", "theirs"],
      ["meta.region", "both"],
    ])
    expect(entries[4].groups).toEqual(["Meta"])
  })

  it("counts conflicts and automatic merges", () => {
    expect(countConflicts(entries, {})).toEqual({ conflicts: 1, resolved: 0, merged: 3, total: 5 })
    expect(countConflicts(entries, { email: { source: "theirs" } }).resolved).toBe(1)
  })

  it("takes the changed side automatically and waits on conflicts", () => {
    expect(getEffectiveResolution(entries[2], {})).toEqual({ source: "ours" })
    expect(getEffectiveResolution(entries[3], {})).toEqual({ source: "theirs" })
    expect(getEffectiveResolution(entries[1], {})).toBeNull()
  })

  it("merges choices onto our version", () => {
    const pending = mergeVersions(ours, entries, {})
    expect(pending.unresolved).toEqual(["email"])

    const { value, unresolved } = mergeVersions(ours, entries, {
      email: { source: "custom", value: "d@acme.test" },
    })
    expect(unresolved).toEqual([])
    expect(value).toEqual({ ...ours, email: "d@acme.test", plan: "Business" })
    // Untouched branches are shared, not copied.
    expect(value.meta).toBe(ours.meta)
  })

  it("chooses one side for every conflict", () => {
    expect(chooseSideForAll(entries, { seats: { source: "theirs" } }, "ours")).toEqual({
      seats: { source: "theirs" },
      email: { source: "ours" },
    })
  })

  it("offers a text box for text and numbers, and parses numbers", () => {
    expect(isFieldEditable(entries[1])).toBe(true)
    expect(parseFieldText(entries[2], entries[2].field, "14")).toBe(14)
    expect(parseFieldText(entries[2], entries[2].field, "")).toBe("")
    const flag = getConflictEntries(
      { base: { on: false }, ours: { on: true }, theirs: { on: true } },
      [{ key: "on", label: "On" }]
    )[0]
    expect(isFieldEditable(flag)).toBe(false)
  })
})
