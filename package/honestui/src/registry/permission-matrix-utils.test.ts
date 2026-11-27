import { describe, expect, it } from "vitest"

import {
  cycleCellValue,
  diffGrants,
  flattenResources,
  getCellValue,
  getParentIndex,
  resolvePermission,
  setCell,
  setCells,
} from "../../registry/default/product/permission-matrix/permission-matrix-utils"
import type {
  PermissionGrants,
  PermissionResource,
  PermissionRole,
} from "../../registry/default/product/permission-matrix/permission-matrix-types"

const resources: PermissionResource[] = [
  {
    id: "projects",
    name: "Projects",
    children: [
      { id: "projects.create", name: "Create" },
      { id: "projects.archive", name: "Archive", children: [{ id: "projects.archive.restore", name: "Restore" }] },
    ],
  },
  { id: "billing", name: "Billing" },
]

const roles: PermissionRole[] = [
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor", inheritsFrom: "viewer" },
  { id: "viewer", name: "Viewer" },
  { id: "loop-a", name: "Loop A", inheritsFrom: "loop-b" },
  { id: "loop-b", name: "Loop B", inheritsFrom: "loop-a" },
]

const parents = getParentIndex(resources)
const resolve = (grants: PermissionGrants, roleId: string, resourceId: string, defaultValue?: "allow" | "deny") =>
  resolvePermission(grants, roleId, resourceId, { roles, parents, defaultValue })

describe("flattenResources", () => {
  it("lists resources depth first with depth and parent", () => {
    expect(flattenResources(resources).map((entry) => [entry.resource.id, entry.depth, entry.parentId])).toEqual([
      ["projects", 0, null],
      ["projects.create", 1, "projects"],
      ["projects.archive", 1, "projects"],
      ["projects.archive.restore", 2, "projects.archive"],
      ["billing", 0, null],
    ])
  })
})

describe("resolvePermission", () => {
  it("returns a cell's own decision as explicit", () => {
    expect(resolve({ admin: { billing: "allow" } }, "admin", "billing")).toEqual({
      value: "allow",
      source: { kind: "explicit" },
    })
  })

  it("takes the nearest ancestor's decision for the same role", () => {
    const grants: PermissionGrants = { admin: { projects: "allow", "projects.archive": "deny" } }
    expect(resolve(grants, "admin", "projects.create")).toEqual({
      value: "allow",
      source: { kind: "resource", resourceId: "projects" },
    })
    expect(resolve(grants, "admin", "projects.archive.restore")).toEqual({
      value: "deny",
      source: { kind: "resource", resourceId: "projects.archive" },
    })
  })

  it("asks the base role only when the role sets nothing up the tree", () => {
    const grants: PermissionGrants = {
      editor: { projects: "allow" },
      viewer: { "projects.create": "deny", billing: "allow" },
    }
    // The editor's own parent decision wins over the viewer's decision on the child.
    expect(resolve(grants, "editor", "projects.create")).toEqual({
      value: "allow",
      source: { kind: "resource", resourceId: "projects" },
    })
    expect(resolve(grants, "editor", "billing")).toEqual({
      value: "allow",
      source: { kind: "role", roleId: "viewer", resourceId: "billing" },
    })
  })

  it("walks the base role's tree too", () => {
    const grants: PermissionGrants = { viewer: { projects: "allow" } }
    expect(resolve(grants, "editor", "projects.archive.restore")).toEqual({
      value: "allow",
      source: { kind: "role", roleId: "viewer", resourceId: "projects" },
    })
  })

  it("falls back to the default", () => {
    expect(resolve({}, "editor", "billing")).toEqual({ value: "deny", source: { kind: "default" } })
    expect(resolve({}, "admin", "billing", "allow")).toEqual({ value: "allow", source: { kind: "default" } })
  })

  it("stops at a cycle of base roles", () => {
    expect(resolve({}, "loop-a", "billing")).toEqual({ value: "deny", source: { kind: "default" } })
    expect(resolve({ "loop-b": { billing: "allow" } }, "loop-a", "billing")).toEqual({
      value: "allow",
      source: { kind: "role", roleId: "loop-b", resourceId: "billing" },
    })
  })

  it("ignores a base role that does not exist", () => {
    const orphan = [{ id: "orphan", name: "Orphan", inheritsFrom: "missing" }]
    expect(
      resolvePermission({}, "orphan", "billing", { roles: orphan, parents }).source
    ).toEqual({ kind: "default" })
  })
})

describe("editing", () => {
  it("sets and clears cells without changing the input", () => {
    const before: PermissionGrants = { admin: { billing: "allow" } }
    const allowed = setCell(before, "editor", "projects", "allow")
    expect(allowed).toEqual({ admin: { billing: "allow" }, editor: { projects: "allow" } })
    expect(before).toEqual({ admin: { billing: "allow" } })

    expect(setCell(allowed, "editor", "projects", "inherit")).toEqual({ admin: { billing: "allow" } })
    expect(setCell(allowed, "nobody", "projects", "inherit")).toEqual(allowed)
  })

  it("sets many cells at once", () => {
    const next = setCells(
      {},
      [
        { roleId: "admin", resourceId: "projects" },
        { roleId: "admin", resourceId: "billing" },
        { roleId: "viewer", resourceId: "billing" },
      ],
      "deny"
    )
    expect(next).toEqual({ admin: { projects: "deny", billing: "deny" }, viewer: { billing: "deny" } })
    expect(getCellValue(next, "editor", "billing")).toBe("inherit")
  })

  it("cycles inherit, allow, deny", () => {
    expect(cycleCellValue("inherit")).toBe("allow")
    expect(cycleCellValue("allow")).toBe("deny")
    expect(cycleCellValue("deny")).toBe("inherit")
  })

  it("lists every changed cell", () => {
    const before: PermissionGrants = { admin: { billing: "allow", projects: "allow" } }
    const after: PermissionGrants = { admin: { billing: "deny", projects: "allow" }, viewer: { billing: "allow" } }
    expect(diffGrants(before, after)).toEqual([
      { roleId: "admin", resourceId: "billing", from: "allow", to: "deny" },
      { roleId: "viewer", resourceId: "billing", from: "inherit", to: "allow" },
    ])
    expect(diffGrants(after, after)).toEqual([])
  })
})
