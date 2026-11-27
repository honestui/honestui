"use client"

import * as React from "react"

import {
  PermissionMatrix,
  type PermissionGrants,
  type PermissionResource,
  type PermissionRole,
} from "@/registry/default/product/permission-matrix/permission-matrix"

const roles: PermissionRole[] = [
  { id: "owner", name: "Owner", readOnly: true, description: "Built in. Owners can do everything." },
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor", inheritsFrom: "viewer" },
  { id: "viewer", name: "Viewer" },
]

const resources: PermissionResource[] = [
  {
    id: "projects",
    name: "Projects",
    description: "Boards, docs, and files",
    children: [
      { id: "projects.create", name: "Create projects" },
      { id: "projects.delete", name: "Delete projects" },
    ],
  },
  {
    id: "members",
    name: "Members",
    children: [
      { id: "members.invite", name: "Invite people" },
      { id: "members.remove", name: "Remove people" },
    ],
  },
  {
    id: "billing",
    name: "Billing",
    description: "Plan, invoices, and payment",
    children: [{ id: "billing.invoices", name: "Download invoices" }],
  },
  { id: "api-keys", name: "API keys" },
]

const saved: PermissionGrants = {
  owner: { projects: "allow", members: "allow", billing: "allow", "api-keys": "allow" },
  admin: { projects: "allow", members: "allow", billing: "deny", "billing.invoices": "allow", "api-keys": "allow" },
  editor: { "projects.create": "allow" },
  viewer: { projects: "allow", "projects.create": "deny", "projects.delete": "deny" },
}

/**
 * Editors inherit from Viewers, and child resources inherit from their
 * parent. Outlined marks are inherited: hover one to see where it comes
 * from. Click a cell, or press Space, to cycle it; Save waits for the request.
 */
export default function PermissionMatrixDemo() {
  const [grants, setGrants] = React.useState<PermissionGrants>(saved)

  return (
    <div className="w-full max-w-3xl min-w-0">
      <PermissionMatrix
        label="Workspace permissions"
        roles={roles}
        resources={resources}
        value={grants}
        onValueChange={setGrants}
        onSave={() => new Promise((resolve) => setTimeout(resolve, 600))}
      />
    </div>
  )
}
