import { describe, expect, it } from "vitest"

import {
  applyAcceptedChanges,
  compareLists,
  countChanges,
  decideAllChanges,
  defaultChangeReviewLabels,
  getChangeStatus,
  getChanges,
  getValueAtPath,
  groupChanges,
  isDeepEqual,
  setValueAtPath,
} from "../../registry/default/product/change-review/change-review-utils"
import type { ChangeReviewFieldNode } from "../../registry/default/product/change-review/change-review-types"

const fields: ChangeReviewFieldNode[] = [
  { key: "name", label: "Workspace name" },
  {
    group: "Billing",
    fields: [
      { key: "billing.email", label: "Billing email" },
      { group: "Invoices", fields: [{ key: "billing.invoices.net", label: "Payment terms" }] },
    ],
  },
  { key: "notifications", label: "Notifications", type: "boolean" },
  { key: "members", label: "Team access", type: "list", itemKey: "id" },
]

const before = {
  name: "Acme",
  billing: { email: "ops@acme.test", invoices: { net: 30 } },
  notifications: true,
  members: [
    { id: "1", name: "Sam Cole", role: "admin" },
    { id: "2", name: "Dee Park", role: "member" },
  ],
}

const after = {
  name: "Acme",
  billing: { email: "billing@acme.test", invoices: { net: 30 } },
  notifications: false,
  members: [
    { id: "2", name: "Dee Park", role: "admin" },
    { id: "3", name: "Ana Ruiz", role: "member" },
    { id: "4", name: "Li Wei", role: "member" },
  ],
}

describe("getChanges", () => {
  const changes = getChanges(before, after, fields)

  it("returns one entry per field in field order", () => {
    expect(changes.map((change) => change.id)).toEqual([
      "name",
      "billing.email",
      "billing.invoices.net",
      "notifications",
      "members",
    ])
  })

  it("reads nested values and records the group path", () => {
    expect(changes[1]).toMatchObject({
      label: "Billing email",
      groups: ["Billing"],
      before: "ops@acme.test",
      after: "billing@acme.test",
    })
    expect(changes[2].groups).toEqual(["Billing", "Invoices"])
    expect(changes[0].groups).toBeUndefined()
  })

  it("separates changed fields from unchanged ones", () => {
    expect(changes.map(getChangeStatus)).toEqual([
      "unchanged",
      "changed",
      "unchanged",
      "changed",
      "changed",
    ])
  })

  it("reports list membership and items whose contents changed", () => {
    expect(changes[4]).toMatchObject({
      kind: "list",
      added: [after.members[1], after.members[2]],
      removed: [before.members[0]],
      changed: [after.members[0]],
    })
  })

  it("lets a field decide that two raw values are the same", () => {
    const [change] = getChanges({ name: "Acme " }, { name: "Acme" }, [
      {
        key: "name",
        label: "Name",
        isEqual: (a, b) => String(a).trim() === String(b).trim(),
      },
    ])

    expect(getChangeStatus(change)).toBe("unchanged")
  })
})

describe("getChangeStatus", () => {
  it.each([
    [undefined, "a", "added"],
    ["", "a", "added"],
    ["a", null, "removed"],
    ["a", "b", "changed"],
    [null, undefined, "unchanged"],
    [false, true, "changed"],
    [0, 0, "unchanged"],
  ] as const)("reads %j to %j as %s", (previous, next, status) => {
    expect(getChangeStatus({ id: "x", label: "X", before: previous, after: next })).toBe(status)
  })

  it("keeps a status that a stored record already carries", () => {
    expect(
      getChangeStatus({ id: "x", label: "X", before: "a", after: "a", status: "changed" })
    ).toBe("changed")
  })

  it("reads an empty list change as unchanged", () => {
    expect(getChangeStatus({ id: "x", label: "X", kind: "list", added: [], removed: [] })).toBe(
      "unchanged"
    )
  })
})

describe("compareLists", () => {
  it("compares plain values without an item key", () => {
    expect(compareLists(["read", "write"], ["write", "admin"])).toEqual({
      added: ["admin"],
      removed: ["read"],
      changed: [],
    })
  })

  it("treats a missing list as empty", () => {
    expect(compareLists(undefined, ["read"])).toEqual({ added: ["read"], removed: [], changed: [] })
  })

  it("accepts a function that identifies an item", () => {
    const result = compareLists([{ slug: "a" }], [{ slug: "a" }, { slug: "b" }], (item) =>
      (item as { slug: string }).slug
    )

    expect(result.added).toEqual([{ slug: "b" }])
  })
})

describe("isDeepEqual", () => {
  it("compares dates, arrays, and nested objects by content", () => {
    expect(isDeepEqual(new Date(5), new Date(5))).toBe(true)
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true)
    expect(isDeepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false)
    expect(isDeepEqual([1, 2], [2, 1])).toBe(false)
  })
})

describe("decisions", () => {
  const changes = getChanges(before, after, fields)

  it("counts only fields that changed", () => {
    expect(countChanges(changes, { "billing.email": "accepted", members: "rejected" })).toEqual({
      total: 5,
      changed: 3,
      accepted: 1,
      rejected: 1,
      undecided: 1,
    })
  })

  it("ignores a decision recorded for an unchanged field", () => {
    expect(countChanges(changes, { name: "accepted" }).accepted).toBe(0)
  })

  it("decides every changed field at once and skips unchanged ones", () => {
    expect(decideAllChanges(changes, "accepted")).toEqual({
      "billing.email": "accepted",
      notifications: "accepted",
      members: "accepted",
    })
  })

  it("applies accepted fields and keeps rejected and undecided ones", () => {
    const result = applyAcceptedChanges(before, after, {
      "billing.email": "accepted",
      notifications: "rejected",
    })

    expect(result.billing.email).toBe("billing@acme.test")
    expect(result.notifications).toBe(true)
    expect(result.members).toBe(before.members)
  })

  it("does not modify the original object", () => {
    applyAcceptedChanges(before, after, { "billing.email": "accepted" })

    expect(before.billing.email).toBe("ops@acme.test")
  })
})

describe("paths", () => {
  it("reads through missing steps as undefined", () => {
    expect(getValueAtPath({ a: null }, "a.b.c")).toBeUndefined()
    expect(getValueAtPath(undefined, "a")).toBeUndefined()
  })

  it("creates missing steps and shares untouched branches", () => {
    const source = { keep: { x: 1 } }
    const result = setValueAtPath(source, "made.deep", 2) as typeof source & {
      made: { deep: number }
    }

    expect(result.made.deep).toBe(2)
    expect(result.keep).toBe(source.keep)
  })
})

describe("groupChanges", () => {
  it("nests changes under their group labels in arrival order", () => {
    const tree = groupChanges(getChanges(before, after, fields))

    expect(tree.changes.map((change) => change.id)).toEqual(["name", "notifications", "members"])
    expect(tree.groups.map((group) => group.label)).toEqual(["Billing"])
    expect(tree.groups[0].changes.map((change) => change.id)).toEqual(["billing.email"])
    expect(tree.groups[0].groups[0]).toMatchObject({
      label: "Invoices",
      id: "root/Billing/Invoices",
    })
  })
})

describe("default labels", () => {
  it("writes summaries with the right plural", () => {
    const { summary, listSummary } = defaultChangeReviewLabels

    expect(summary({ changed: 1, total: 1 })).toBe("1 change")
    expect(summary({ changed: 3, total: 3 })).toBe("3 changes")
    expect(summary({ changed: 2, total: 5 })).toBe("2 changes in 5 fields")
    expect(listSummary({ added: 2, removed: 1, changed: 0 })).toBe("2 added, 1 removed")
  })
})
