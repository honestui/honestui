import { describe, expect, it } from "vitest"

import {
  countQuery,
  createQueryCondition,
  createQueryGroup,
  filtersToQuery,
  findQueryNode,
  formatQuery,
  fromQueryDate,
  insertQueryNode,
  isQueryConditionComplete,
  matchesQuery,
  pruneQuery,
  queryToFilters,
  removeQueryNode,
  toQueryDate,
  updateQueryNode,
} from "../../registry/default/product/query-builder/query-builder-utils"
import type { QueryField, QueryGroup } from "../../registry/default/product/query-builder/query-builder-types"

const fields: QueryField[] = [
  {
    key: "status",
    label: "Status",
    type: "multi-select",
    options: [
      { label: "Active", value: "active" },
      { label: "Pending", value: "pending" },
      { label: "Archived", value: "archived" },
    ],
  },
  { key: "customer", label: "Customer", type: "text" },
  { key: "amount", label: "Amount", type: "number", meta: { prefix: "$" } },
  { key: "createdAt", label: "Created", type: "date" },
  { key: "period", label: "Period", type: "date-range" },
  { key: "rush", label: "Rush", type: "boolean" },
]

const query: QueryGroup = {
  id: "root",
  kind: "group",
  combinator: "and",
  children: [
    { id: "a", kind: "condition", field: "status", operator: "is", value: ["active", "pending"] },
    {
      id: "g",
      kind: "group",
      combinator: "or",
      children: [
        { id: "b", kind: "condition", field: "amount", operator: "greater-than", value: 1000 },
        { id: "c", kind: "condition", field: "customer", operator: "contains", value: "labs" },
      ],
    },
  ],
}

const rows = [
  { status: "active", customer: "Cortado Labs", amount: 95, createdAt: "2026-03-01", rush: true },
  { status: "pending", customer: "Brightline", amount: 1200, createdAt: "2026-03-05", rush: false },
  { status: "active", customer: "Acme", amount: 480, createdAt: "2026-02-20", rush: false },
  { status: "archived", customer: "Initech Labs", amount: 5000, createdAt: "2026-01-10", rush: true },
]

describe("creating nodes", () => {
  it("starts a condition with the field's default operator and an empty value of the right shape", () => {
    expect(createQueryCondition(fields[0], "x")).toEqual({ id: "x", kind: "condition", field: "status", operator: "is", value: [] })
    expect(createQueryCondition(fields[2], "y").operator).toBe("equals")
    expect(createQueryCondition(fields[5], "z").value).toBe(true)
  })

  it("gives every new node a distinct id", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createQueryGroup().id))
    expect(ids.size).toBe(50)
  })
})

describe("editing the tree", () => {
  it("updates, inserts, and removes without touching the original", () => {
    const updated = updateQueryNode(query, "b", (node) => ({ ...node, value: 500 }) as typeof node)
    expect(findQueryNode(updated, "b")?.node).toMatchObject({ value: 500 })
    expect(findQueryNode(query, "b")?.node).toMatchObject({ value: 1000 })

    const inserted = insertQueryNode(query, "g", createQueryCondition(fields[1], "d"), 0)
    expect((findQueryNode(inserted, "g")?.node as QueryGroup).children.map((child) => child.id)).toEqual(["d", "b", "c"])

    const removed = removeQueryNode(query, "g")
    expect(removed.children.map((child) => child.id)).toEqual(["a"])
    expect(countQuery(query)).toEqual({ conditions: 3, groups: 1 })
  })

  it("finds nodes with their parent and depth", () => {
    const found = findQueryNode(query, "c")
    expect(found?.parent?.id).toBe("g")
    expect(found?.depth).toBe(2)
    expect(findQueryNode(query, "missing")).toBeNull()
  })
})

describe("completeness", () => {
  it("needs a value unless the operator carries the meaning", () => {
    expect(isQueryConditionComplete({ id: "1", kind: "condition", field: "customer", operator: "contains", value: " " }, fields)).toBe(false)
    expect(isQueryConditionComplete({ id: "1", kind: "condition", field: "customer", operator: "is-empty", value: "" }, fields)).toBe(true)
    expect(isQueryConditionComplete({ id: "1", kind: "condition", field: "rush", operator: "is", value: false }, fields)).toBe(true)
    expect(isQueryConditionComplete({ id: "1", kind: "condition", field: "nope", operator: "is", value: "x" }, fields)).toBe(false)
  })

  it("prunes incomplete conditions, empty groups, and unwraps single-child groups", () => {
    const messy: QueryGroup = {
      id: "r",
      kind: "group",
      combinator: "and",
      children: [
        { id: "1", kind: "condition", field: "customer", operator: "contains", value: "" },
        { id: "g1", kind: "group", combinator: "or", children: [] },
        {
          id: "g2",
          kind: "group",
          combinator: "or",
          children: [{ id: "2", kind: "condition", field: "amount", operator: "less-than", value: 10 }],
        },
      ],
    }
    expect(pruneQuery(messy, fields).children).toEqual([
      { id: "2", kind: "condition", field: "amount", operator: "less-than", value: 10 },
    ])
  })
})

describe("matchesQuery", () => {
  it("evaluates nested and/or groups", () => {
    expect(rows.map((row) => matchesQuery(row, query, fields))).toEqual([true, true, false, false])
    const anyOf = { ...query, combinator: "or" as const }
    expect(rows.map((row) => matchesQuery(row, anyOf, fields))).toEqual([true, true, true, true])
  })

  it("skips incomplete conditions instead of hiding every row", () => {
    const draft = createQueryGroup("and", [createQueryCondition(fields[1])])
    expect(rows.every((row) => matchesQuery(row, draft, fields))).toBe(true)
  })

  it("handles each field type's operators", () => {
    const check = (field: string, operator: string, value: unknown) =>
      rows.filter((row) => matchesQuery(row, createQueryGroup("and", [{ id: "x", kind: "condition", field, operator, value }]), fields)).length

    expect(check("customer", "starts-with", "acme")).toBe(1)
    expect(check("customer", "does-not-contain", "labs")).toBe(2)
    expect(check("amount", "between", { min: 100, max: 1500 })).toBe(2)
    expect(check("amount", "less-than-or-equal", 480)).toBe(2)
    expect(check("createdAt", "before", "2026-03-01")).toBe(2)
    expect(check("createdAt", "on", "2026-03-01")).toBe(1)
    expect(check("createdAt", "after", "2026-03-01")).toBe(1)
    expect(check("status", "is-not", ["active"])).toBe(2)
    expect(check("rush", "is", false)).toBe(2)
  })

  it("compares date ranges with Date or string record values", () => {
    const range = createQueryGroup("and", [
      { id: "x", kind: "condition", field: "period", operator: "between", value: { from: "2026-03-01", to: "2026-03-31" } },
    ])
    expect(matchesQuery({ period: new Date(2026, 2, 15) }, range, fields)).toBe(true)
    expect(matchesQuery({ period: "2026-04-01" }, range, fields)).toBe(false)
  })
})

describe("Filter Bar conversion", () => {
  it("turns filters into one and group, with dates as strings", () => {
    const tree = filtersToQuery(
      [
        { key: "status", operator: "is", value: ["active"] },
        { key: "createdAt", operator: "after", value: new Date(2026, 0, 5) },
        { key: "period", operator: "between", value: { from: new Date(2026, 1, 1) } },
        { key: "unknown", value: "x" },
      ],
      fields
    )
    expect(tree.combinator).toBe("and")
    expect(tree.children.map((child) => (child.kind === "condition" ? [child.field, child.value] : null))).toEqual([
      ["status", ["active"]],
      ["createdAt", "2026-01-05"],
      ["period", { from: "2026-02-01" }],
    ])
  })

  it("round-trips simple queries and refuses ones Filter Bar cannot show", () => {
    const filters = [{ key: "createdAt", operator: "on", value: new Date(2026, 2, 4) }]
    const back = queryToFilters(filtersToQuery(filters, fields), fields)
    expect(back?.[0].value).toEqual(new Date(2026, 2, 4))

    expect(queryToFilters(query, fields)).toBeNull()
    const twoOnOneField = createQueryGroup("and", [
      { id: "1", kind: "condition", field: "amount", operator: "greater-than", value: 1 },
      { id: "2", kind: "condition", field: "amount", operator: "less-than", value: 9 },
    ])
    expect(queryToFilters(twoOnOneField, fields)).toBeNull()
    // One complete condition under "or" still fits.
    const single = createQueryGroup("or", [{ id: "1", kind: "condition", field: "customer", operator: "is", value: "Acme" }])
    expect(queryToFilters(single, fields)).toEqual([{ key: "customer", operator: "is", value: "Acme" }])
  })

  it("converts local dates without shifting the day", () => {
    expect(toQueryDate(new Date(2026, 11, 31))).toBe("2026-12-31")
    expect(fromQueryDate("2026-12-31")?.getDate()).toBe(31)
    expect(fromQueryDate("soon")).toBeUndefined()
  })
})

describe("formatQuery", () => {
  it("reads the query as one line, with groups in parentheses", () => {
    expect(formatQuery(query, fields)).toBe(
      "Status is any of Active, Pending and (Amount greater than $1000 or Customer contains labs)"
    )
  })

  it("leaves out incomplete conditions", () => {
    expect(formatQuery(createQueryGroup("and", [createQueryCondition(fields[1])]), fields)).toBe("")
  })
})
