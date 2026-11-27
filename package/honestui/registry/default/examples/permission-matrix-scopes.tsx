"use client"

import * as React from "react"

import {
  PermissionMatrix,
  type PermissionChange,
  type PermissionGrants,
  type PermissionResource,
  type PermissionRole,
} from "@/registry/default/product/permission-matrix/permission-matrix"

const roles: PermissionRole[] = [
  { id: "ci", name: "CI token" },
  { id: "deploy", name: "Deploy key" },
  { id: "readonly", name: "Read-only key" },
]

const resources: PermissionResource[] = [
  { id: "repos", name: "Repositories" },
  { id: "deployments", name: "Deployments" },
  { id: "env", name: "Environment variables" },
  { id: "logs", name: "Logs" },
  { id: "webhooks", name: "Webhooks" },
]

const saved: PermissionGrants = {
  ci: { repos: "allow", logs: "allow" },
  deploy: { deployments: "allow", env: "allow", logs: "allow" },
  readonly: { repos: "allow", logs: "allow" },
}

const verb = { allow: "allow", deny: "deny", inherit: "unset" } as const

/**
 * Flat scopes with nothing to inherit, so an unset cell is denied. The list
 * under the matrix is what a save would send: one line per changed cell.
 */
export default function PermissionMatrixScopes() {
  const [grants, setGrants] = React.useState<PermissionGrants>(saved)
  const [changes, setChanges] = React.useState<PermissionChange[]>([])

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <PermissionMatrix
        label="Token scopes"
        roles={roles}
        resources={resources}
        value={grants}
        savedValue={saved}
        onValueChange={(next, nextChanges) => {
          setGrants(next)
          setChanges(nextChanges)
        }}
        labels={{ byDefault: "not granted" }}
      />
      <div className="flex min-h-16 flex-col gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
        <span>Request body</span>
        <code className="block min-w-0 font-mono break-words whitespace-pre-wrap text-[var(--hui-color-foreground-base-primary)]">
          {changes.length === 0
            ? "No changes"
            : changes
                .map((change) => `${change.roleId}.${change.resourceId}: ${verb[change.from]} → ${verb[change.to]}`)
                .join("\n")}
        </code>
      </div>
    </div>
  )
}
