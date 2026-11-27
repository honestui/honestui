/** A decision a role has for a resource. */
export type PermissionState = "allow" | "deny"

/** What a cell holds: a decision of its own, or nothing, so it inherits. */
export type PermissionCellValue = PermissionState | "inherit"

export type PermissionRole = {
  id: string
  name: string
  description?: string | undefined
  /** A base role. Resources this role leaves unset take the base role's decision. */
  inheritsFrom?: string | undefined
  /** Shown but not editable, such as a built-in Owner role. */
  readOnly?: boolean | undefined
}

export type PermissionResource = {
  id: string
  name: string
  description?: string | undefined
  /** Nested resources. A child left unset takes its parent's decision for the same role. */
  children?: readonly PermissionResource[] | undefined
}

/**
 * The decisions that were set, by role id and then resource id. A missing
 * entry inherits; nothing here is derived.
 */
export type PermissionGrants = Readonly<Record<string, Readonly<Record<string, PermissionState>>>>

/** Where a cell's effective decision comes from. */
export type PermissionSource =
  /** The cell's own decision. */
  | { kind: "explicit" }
  /** The same role's decision on an ancestor resource. */
  | { kind: "resource"; resourceId: string }
  /** A base role's decision, on this resource or an ancestor of it. */
  | { kind: "role"; roleId: string; resourceId: string }
  /** Nothing is set anywhere up the chain, so the matrix default applies. */
  | { kind: "default" }

export type ResolvedPermission = {
  value: PermissionState
  source: PermissionSource
}

export type FlatPermissionResource = {
  resource: PermissionResource
  depth: number
  parentId: string | null
}

export type PermissionChange = {
  roleId: string
  resourceId: string
  from: PermissionCellValue
  to: PermissionCellValue
}

export type PermissionMatrixLabels = {
  resources: string
  allow: string
  deny: string
  inherit: string
  /** Read after an inherited decision. `source` is a role or resource name. */
  inheritedFrom: (source: string) => string
  inheritedFromRoleOn: (role: string, resource: string) => string
  byDefault: string
  inheritsFrom: (role: string) => string
  readOnly: string
  changed: string
  columnActions: (role: string) => string
  rowActions: (resource: string) => string
  allowAll: string
  denyAll: string
  inheritAll: string
  changes: (count: number) => string
  noChanges: string
  discard: string
  save: string
}
