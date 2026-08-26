"use client"

import {
  Copy as CopyIcon,
  Ellipsis as EllipsisIcon,
  UserX as UserXIcon,
} from "honestui/icons"

import {
  DataGridRowActions,
  type DataGridColumn,
} from "@/registry/default/product/data-grid/data-grid"
import {
  Avatar,
  AvatarFallback,
} from "@/registry/default/ui/avatar"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/registry/default/ui/menu"

export type GridUser = {
  id: string
  name: string
  email: string
  status: "Active" | "Pending" | "Inactive"
  role: "Admin" | "Editor" | "Viewer"
  createdAt: string
  revenue: number
  canEdit: boolean
}

export const gridUsers: GridUser[] = [
  { id: "usr_1", name: "Sarah Chen", email: "sarah.chen@northstar.co", status: "Active", role: "Admin", createdAt: "2026-05-12", revenue: 24500, canEdit: true },
  { id: "usr_2", name: "Alex Kim", email: "alex.kim@foundry.dev", status: "Active", role: "Editor", createdAt: "2026-05-11", revenue: 18750, canEdit: true },
  { id: "usr_3", name: "John Smith", email: "john.smith@lumenlabs.io", status: "Pending", role: "Viewer", createdAt: "2026-05-10", revenue: 9200, canEdit: false },
  { id: "usr_4", name: "Priya Raman", email: "priya@orbital.studio", status: "Active", role: "Editor", createdAt: "2026-05-08", revenue: 31800, canEdit: true },
  { id: "usr_5", name: "Mateo Silva", email: "mateo@fieldwork.app", status: "Inactive", role: "Viewer", createdAt: "2026-05-05", revenue: 4100, canEdit: true },
  { id: "usr_6", name: "Nora Ibrahim", email: "nora@relay.health", status: "Active", role: "Admin", createdAt: "2026-05-02", revenue: 27600, canEdit: true },
  { id: "usr_7", name: "Elliot Park", email: "elliot@kinetic.fm", status: "Pending", role: "Editor", createdAt: "2026-04-29", revenue: 12600, canEdit: true },
  { id: "usr_8", name: "Amara Okafor", email: "amara@cinder.agency", status: "Active", role: "Viewer", createdAt: "2026-04-24", revenue: 15800, canEdit: true },
  { id: "usr_9", name: "Jonas Berg", email: "jonas@pinecone.systems", status: "Inactive", role: "Editor", createdAt: "2026-04-19", revenue: 7300, canEdit: true },
  { id: "usr_10", name: "Leila Haddad", email: "leila@archway.design", status: "Active", role: "Admin", createdAt: "2026-04-15", revenue: 35200, canEdit: true },
  { id: "usr_11", name: "Owen Wright", email: "owen@cobalt.tools", status: "Pending", role: "Viewer", createdAt: "2026-04-08", revenue: 6800, canEdit: false },
  { id: "usr_12", name: "Hana Sato", email: "hana@atlas-works.jp", status: "Active", role: "Editor", createdAt: "2026-04-03", revenue: 22400, canEdit: true },
]

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const statusVariant = {
  Active: "success",
  Pending: "warning",
  Inactive: "neutral",
} as const

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function UserActions({
  user,
  onDuplicate,
  onDeactivate,
}: {
  user: GridUser
  onDuplicate?: (user: GridUser) => void
  onDeactivate?: (user: GridUser) => void
}) {
  if (!onDuplicate && !onDeactivate) return null

  return (
    <DataGridRowActions>
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="link"
              size="icon"
              aria-label={`Actions for ${user.name}`}
            />
          }
        >
          <EllipsisIcon aria-hidden />
        </MenuTrigger>
        <MenuPopup align="end">
          {onDuplicate && (
            <MenuItem onClick={() => onDuplicate(user)}>
              <CopyIcon aria-hidden />
              Duplicate
            </MenuItem>
          )}
          {onDuplicate && onDeactivate && <MenuSeparator />}
          {onDeactivate && (
            <MenuItem
              disabled={user.status === "Inactive"}
              onClick={() => onDeactivate(user)}
            >
              <UserXIcon aria-hidden />
              Mark inactive
            </MenuItem>
          )}
        </MenuPopup>
      </Menu>
    </DataGridRowActions>
  )
}

export function getGridUserColumns(actions?: {
  onDuplicate?: (user: GridUser) => void
  onDeactivate?: (user: GridUser) => void
}): DataGridColumn<GridUser, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      size: 220,
      minSize: 170,
      filter: { type: "text" },
      priority: "primary",
      cell: ({ row }) => (
        <div className="flex items-center gap-[var(--hui-space-3)]">
          <Avatar size="4">
            <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-[var(--hui-color-foreground-base-primary)]">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 250,
      minSize: 180,
      maxSize: 420,
      filter: { type: "text" },
      priority: "primary",
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 130,
      filter: {
        type: "enum",
        options: ["Active", "Pending", "Inactive"],
      },
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      size: 120,
      filter: {
        type: "enum",
        options: ["Admin", "Editor", "Viewer"],
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      type: "date",
      filter: { type: "date" },
      size: 145,
      hideBelow: "md",
      cell: ({ row }) => date.format(new Date(`${row.original.createdAt}T00:00:00Z`)),
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      type: "currency",
      align: "right",
      filter: { type: "currency" },
      size: 140,
      hideBelow: "lg",
      cell: ({ row }) => currency.format(row.original.revenue),
    },
    ...(actions?.onDuplicate || actions?.onDeactivate
      ? [
          {
            id: "actions",
            header: "Actions",
            size: 64,
            minSize: 64,
            maxSize: 64,
            align: "right" as const,
            sortable: false,
            filterable: false,
            hideable: false,
            resizable: false,
            reorderable: false,
            pinnable: true,
            cell: ({ row }: { row: { original: GridUser } }) => (
              <UserActions
                user={row.original}
                onDuplicate={actions.onDuplicate}
                onDeactivate={actions.onDeactivate}
              />
            ),
          } as DataGridColumn<GridUser, unknown>,
        ]
      : []),
  ]
}
