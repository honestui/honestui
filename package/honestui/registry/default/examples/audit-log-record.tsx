"use client"

import { AuditLog, type AuditLogEntry } from "@/registry/default/product/audit-log/audit-log"

const now = Date.UTC(2026, 10, 26, 15, 30)

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

const entries: AuditLogEntry[] = [
  {
    id: "r1",
    actor: { name: "Billing API", kind: "api" },
    action: "marked the invoice paid",
    timestamp: Date.UTC(2026, 10, 26, 14, 52),
    changes: [{ label: "Status", before: "Open", after: "Paid" }],
    details: [
      { label: "Payment", value: "pi_3QxL0aK2", mono: true },
      { label: "Source", value: "Card ending 4242" },
    ],
  },
  {
    id: "r2",
    actor: { name: "Ana Ruiz" },
    action: "applied a discount",
    timestamp: Date.UTC(2026, 10, 24, 9, 30),
    changes: [
      {
        label: "Total",
        before: 482000,
        after: 433800,
        render: (value) => money.format(Number(value) / 100),
      },
      { label: "Discount", before: null, after: "Loyalty 10%" },
    ],
  },
  {
    id: "r3",
    actor: { name: "Dee Park" },
    action: "created the invoice",
    timestamp: Date.UTC(2026, 10, 20, 16, 4),
  },
]

/** The history of one record, beside its form. The header is replaced to name the record. */
export default function AuditLogRecord() {
  return (
    <AuditLog
      entries={entries}
      now={now}
      timeZone="UTC"
      locale="en-US"
      labels={{ title: "Invoice INV-2041 history" }}
      className="max-w-lg"
    />
  )
}
