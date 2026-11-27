import type {
  FlatPermissionResource,
  PermissionCellValue,
  PermissionChange,
  PermissionGrants,
  PermissionMatrixLabels,
  PermissionResource,
  PermissionRole,
  PermissionState,
  ResolvedPermission,
} from "./permission-matrix-types"

export const defaultPermissionMatrixLabels: PermissionMatrixLabels = {
  resources: "Resource",
  allow: "Allowed",
  deny: "Denied",
  inherit: "Inherited",
  inheritedFrom: (source) => `inherited from ${source}`,
  inheritedFromRoleOn: (role, resource) => `inherited from ${role} on ${resource}`,
  byDefault: "not set, so denied",
  inheritsFrom: (role) => `Inherits ${role}`,
  readOnly: "Read-only",
  changed: "changed",
  columnActions: (role) => `Set all for ${role}`,
  rowActions: (resource) => `Set all for ${resource}`,
  allowAll: "Allow all",
  denyAll: "Deny all",
  inheritAll: "Reset to inherited",
  changes: (count) => (count === 1 ? "1 unsaved change" : `${count} unsaved changes`),
  noChanges: "No unsaved changes",
  discard: "Discard",
  save: "Save changes",
}

/** The resources in display order, with their depth and parent. */
export function flattenResources(
  resources: readonly PermissionResource[],
  depth = 0,
  parentId: string | null = null
): FlatPermissionResource[] {
  return resources.flatMap((resource) => [
    { resource, depth, parentId },
    ...flattenResources(resource.children ?? [], depth + 1, resource.id),
  ])
}

/** Each resource's parent id, for walking up the tree. */
export function getParentIndex(resources: readonly PermissionResource[]): Map<string, string | null> {
  return new Map(flattenResources(resources).map((entry) => [entry.resource.id, entry.parentId]))
}

/** The value a cell holds by itself. */
export function getCellValue(
  grants: PermissionGrants,
  roleId: string,
  resourceId: string
): PermissionCellValue {
  return grants[roleId]?.[resourceId] ?? "inherit"
}

type Origin = { value: PermissionState; roleId: string; resourceId: string }

function findOrigin(
  grants: PermissionGrants,
  rolesById: Map<string, PermissionRole>,
  parents: Map<string, string | null>,
  roleId: string,
  resourceId: string,
  seen: Set<string>
): Origin | null {
  // The role's own decisions come first, from the resource up to its root.
  for (let current: string | null | undefined = resourceId; current; current = parents.get(current)) {
    const value = grants[roleId]?.[current]
    if (value) return { value, roleId, resourceId: current }
  }

  const base = rolesById.get(roleId)?.inheritsFrom
  if (!base || seen.has(base) || !rolesById.has(base)) return null
  seen.add(base)
  return findOrigin(grants, rolesById, parents, base, resourceId, seen)
}

export type ResolveOptions = {
  roles: readonly PermissionRole[]
  /** From `getParentIndex`. */
  parents: Map<string, string | null>
  /** The decision when nothing is set anywhere up the chain. Defaults to `deny`. */
  defaultValue?: PermissionState | undefined
}

/**
 * The decision a role really has for a resource, and where it comes from. An
 * unset cell takes the role's decision on the nearest ancestor resource; if
 * the role sets nothing up the tree, its base role is asked the same way; if
 * no role in the chain decides, `defaultValue` applies.
 */
export function resolvePermission(
  grants: PermissionGrants,
  roleId: string,
  resourceId: string,
  { roles, parents, defaultValue = "deny" }: ResolveOptions
): ResolvedPermission {
  const rolesById = new Map(roles.map((role) => [role.id, role]))
  const origin = findOrigin(grants, rolesById, parents, roleId, resourceId, new Set([roleId]))

  if (!origin) return { value: defaultValue, source: { kind: "default" } }
  if (origin.roleId === roleId && origin.resourceId === resourceId) {
    return { value: origin.value, source: { kind: "explicit" } }
  }
  if (origin.roleId === roleId) {
    return { value: origin.value, source: { kind: "resource", resourceId: origin.resourceId } }
  }
  return {
    value: origin.value,
    source: { kind: "role", roleId: origin.roleId, resourceId: origin.resourceId },
  }
}

/** Returns new grants with one cell changed. `inherit` removes the cell's own decision. */
export function setCell(
  grants: PermissionGrants,
  roleId: string,
  resourceId: string,
  value: PermissionCellValue
): PermissionGrants {
  return setCells(grants, [{ roleId, resourceId }], value)
}

/** Returns new grants with every listed cell set to the same value. */
export function setCells(
  grants: PermissionGrants,
  cells: readonly { roleId: string; resourceId: string }[],
  value: PermissionCellValue
): PermissionGrants {
  const next: Record<string, Record<string, PermissionState>> = {}
  for (const [roleId, row] of Object.entries(grants)) next[roleId] = { ...row }

  for (const { roleId, resourceId } of cells) {
    if (value === "inherit") {
      if (next[roleId]) delete next[roleId][resourceId]
    } else {
      next[roleId] = { ...next[roleId], [resourceId]: value }
    }
  }

  for (const roleId of Object.keys(next)) {
    if (Object.keys(next[roleId]).length === 0) delete next[roleId]
  }
  return next
}

/** Space moves a cell through inherit, allow, and deny, in that order. */
export function cycleCellValue(value: PermissionCellValue): PermissionCellValue {
  if (value === "inherit") return "allow"
  if (value === "allow") return "deny"
  return "inherit"
}

/** The cells whose own value differs between two sets of grants. */
export function diffGrants(before: PermissionGrants, after: PermissionGrants): PermissionChange[] {
  const roleIds = new Set([...Object.keys(before), ...Object.keys(after)])
  const changes: PermissionChange[] = []
  for (const roleId of roleIds) {
    const resourceIds = new Set([
      ...Object.keys(before[roleId] ?? {}),
      ...Object.keys(after[roleId] ?? {}),
    ])
    for (const resourceId of resourceIds) {
      const from = getCellValue(before, roleId, resourceId)
      const to = getCellValue(after, roleId, resourceId)
      if (from !== to) changes.push({ roleId, resourceId, from, to })
    }
  }
  return changes
}
