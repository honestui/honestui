import { describe, expect, it } from "vitest"

import {
  areColumnsEqual,
  areFiltersEqual,
  defaultSavedViewsLabels,
  getChangedParts,
  getUniqueViewName,
  isViewStateEqual,
  normalizeViewName,
  validateViewName,
} from "../../registry/default/product/saved-views/saved-views-utils"
import type { SavedView } from "../../registry/default/product/saved-views/saved-views-types"

const views: SavedView[] = [
  { id: "all", name: "All people", state: {} },
  { id: "admins", name: "Active admins", state: {} },
  { id: "copy", name: "Active admins copy", state: {} },
]

describe("saved views comparison", () => {
  it("ignores filter order, empty filters, and multi-select order", () => {
    expect(
      areFiltersEqual(
        [
          { key: "status", value: ["Active", "Pending"] },
          { key: "role", value: ["Admin"] },
        ],
        [
          { key: "role", value: ["Admin"] },
          { key: "status", value: ["Pending", "Active"] },
          { key: "name", value: "" },
        ]
      )
    ).toBe(true)
    expect(areFiltersEqual([{ key: "status", value: ["Active"] }], [])).toBe(false)
    expect(
      areFiltersEqual(
        [{ key: "amount", operator: "greater-than", value: 10 }],
        [{ key: "amount", operator: "less-than", value: 10 }]
      )
    ).toBe(false)
  })

  it("treats a missing column as visible", () => {
    expect(areColumnsEqual({}, { name: true })).toBe(true)
    expect(areColumnsEqual({ revenue: false }, {})).toBe(false)
  })

  it("lists each changed part in a stable order", () => {
    expect(
      getChangedParts(
        { filters: [], sorting: [{ id: "name", desc: false }] },
        {
          filters: [{ key: "status", value: ["Active"] }],
          sorting: [{ id: "name", desc: true }],
          columnVisibility: { email: false },
          density: "compact",
        }
      )
    ).toEqual(["filters", "sorting", "columns", "other"])
    expect(isViewStateEqual({ search: "acme " }, { search: "acme", sorting: [] })).toBe(true)
  })

  it("describes the changes in a sentence", () => {
    expect(defaultSavedViewsLabels.changedParts(["filters", "sorting"])).toBe(
      "Filters and sort changed"
    )
    expect(defaultSavedViewsLabels.changedParts(["columns"])).toBe("Columns changed")
  })
})

describe("saved view names", () => {
  it("normalizes whitespace", () => {
    expect(normalizeViewName("  Open   deals ")).toBe("Open deals")
  })

  it("rejects empty and duplicate names, ignoring case and the view being renamed", () => {
    expect(validateViewName("   ", views)).toBe("empty")
    expect(validateViewName("active ADMINS", views)).toBe("duplicate")
    expect(validateViewName("Active admins", views, "admins")).toBeNull()
  })

  it("finds the next free copy name", () => {
    expect(getUniqueViewName("All people", views)).toBe("All people copy")
    expect(getUniqueViewName("Active admins", views)).toBe("Active admins copy 2")
  })
})
