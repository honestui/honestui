"use client"

import * as React from "react"

import { AuditLog, type AuditLogEntry } from "@/registry/default/product/audit-log/audit-log"

// A fixed clock and zone keep the sample's "Today" and "Yesterday" stable.
const now = Date.UTC(2026, 10, 26, 15, 30)
const at = (daysAgo: number, hour: number, minute: number) =>
  Date.UTC(2026, 10, 26 - daysAgo, hour, minute)

const ana = { id: "u1", name: "Ana Ruiz" }
const dee = { id: "u2", name: "Dee Park" }
const li = { id: "u3", name: "Li Wei" }
const system = { id: "system", name: "Northwind", kind: "system" as const }

const firstPage: AuditLogEntry[] = [
  {
    id: "e1",
    actor: ana,
    action: "changed the plan of",
    target: { label: "Northwind Labs" },
    category: "Billing",
    timestamp: at(0, 15, 18),
    changes: [
      { label: "Plan", before: "Team", after: "Business" },
      { label: "Seats", before: 12, after: 20 },
    ],
    details: [
      { label: "IP address", value: "203.0.113.24", mono: true },
      { label: "Request", value: "req_8f2c41a9", mono: true },
    ],
  },
  {
    id: "e2",
    actor: dee,
    action: "updated access for",
    target: { label: "Design team" },
    category: "Members",
    timestamp: at(0, 13, 2),
    changes: [
      {
        kind: "list",
        label: "Members",
        added: ["Li Wei", "Sam Cole"],
        removed: ["Owen Wright"],
      },
    ],
  },
  {
    id: "e3",
    actor: system,
    action: "rotated the signing key for",
    target: { label: "Production webhooks" },
    category: "Security",
    timestamp: at(0, 9, 0),
  },
  {
    id: "e4",
    actor: li,
    action: "edited",
    target: { label: "Invoice INV-2041" },
    category: "Billing",
    timestamp: at(1, 17, 45),
    changes: [
      {
        label: "Billing email",
        before: "accounts@northwind.example",
        after: "billing@northwind.example",
      },
      { label: "PO number", before: "", after: "PO-7781" },
      { label: "Due date", before: "Dec 1", after: "Dec 15" },
      { label: "Memo", before: "Net 30", after: "Net 45" },
      { label: "Auto-charge", before: true, after: false },
    ],
  },
  {
    id: "e5",
    actor: ana,
    action: "turned on single sign-on for",
    target: { label: "Northwind Labs" },
    category: "Security",
    timestamp: at(1, 10, 12),
    changes: [{ label: "SAML SSO", before: false, after: true }],
  },
]

const olderPage: AuditLogEntry[] = [
  {
    id: "e6",
    actor: dee,
    action: "invited",
    target: { label: "hana@atlas-works.jp" },
    category: "Members",
    timestamp: at(4, 16, 20),
    changes: [{ label: "Role", before: null, after: "Editor" }],
  },
  {
    id: "e7",
    actor: li,
    action: "deleted the API key",
    target: { label: "Staging deploys" },
    category: "Security",
    tone: "danger",
    timestamp: at(4, 11, 5),
  },
]

export default function AuditLogDemo() {
  const [entries, setEntries] = React.useState(firstPage)
  const loaded = entries.length > firstPage.length

  return (
    <AuditLog
      entries={entries}
      now={now}
      timeZone="UTC"
      locale="en-US"
      filterable
      hasMore={!loaded}
      onLoadMore={() =>
        new Promise<void>((resolve) => {
          window.setTimeout(() => {
            setEntries((current) => [...current, ...olderPage])
            resolve()
          }, 700)
        })
      }
      className="max-w-2xl"
    />
  )
}
