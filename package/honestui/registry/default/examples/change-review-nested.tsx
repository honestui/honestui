"use client"

import {
  ChangeReview,
  type ChangeReviewFieldNode,
} from "@/registry/default/product/change-review/change-review"
import { Badge } from "@/registry/default/ui/badge"

type LineItem = { sku: string; name: string; quantity: number }

// Sample order, before and after a support agent edited it.
const placed = {
  status: "processing",
  shipping: {
    method: "Standard",
    address: { line1: "14 Harbour Road", city: "Leeds", postcode: "LS1 4AP" },
  },
  payment: { total: 18450, currency: "GBP" },
  deliverBy: "2026-10-12",
  items: [
    { sku: "KB-201", name: "Mechanical keyboard", quantity: 1 },
    { sku: "MS-114", name: "Wireless mouse", quantity: 2 },
  ],
}

const edited = {
  status: "on-hold",
  shipping: {
    method: "Express",
    address: { line1: "14 Harbour Road", city: "Leeds", postcode: "LS1 4AP" },
  },
  payment: { total: 21940, currency: "GBP" },
  deliverBy: "2026-10-09",
  items: [
    { sku: "KB-201", name: "Mechanical keyboard", quantity: 1 },
    { sku: "MS-114", name: "Wireless mouse", quantity: 1 },
    { sku: "PD-330", name: "Desk pad", quantity: 1 },
  ],
}

const pounds = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" })
const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" })

const statusLabel: Record<string, string> = {
  processing: "Processing",
  "on-hold": "On hold",
}

const fields: ChangeReviewFieldNode[] = [
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <Badge variant={value === "on-hold" ? "warning" : "secondary"} size="sm">
        {statusLabel[String(value)] ?? String(value)}
      </Badge>
    ),
  },
  {
    key: "items",
    label: "Items",
    type: "list",
    itemKey: "sku",
    itemLabel: (item: LineItem) => `${item.quantity} × ${item.name}`,
  },
  {
    group: "Shipping",
    fields: [
      { key: "shipping.method", label: "Method" },
      {
        key: "deliverBy",
        label: "Deliver by",
        render: (value) => day.format(new Date(String(value))),
      },
      {
        group: "Address",
        fields: [
          { key: "shipping.address.line1", label: "Street" },
          { key: "shipping.address.city", label: "City" },
          { key: "shipping.address.postcode", label: "Postcode" },
        ],
      },
    ],
  },
  {
    group: "Payment",
    fields: [
      {
        key: "payment.total",
        label: "Order total",
        // Stored in pence; shown in pounds.
        render: (value) => pounds.format(Number(value) / 100),
      },
      { key: "payment.currency", label: "Currency" },
    ],
  },
]

export default function ChangeReviewNested() {
  return (
    <ChangeReview
      aria-label="Changes to order 4821"
      before={placed}
      after={edited}
      fields={fields}
      defaultChangedOnly={false}
      className="max-w-2xl"
    />
  )
}
