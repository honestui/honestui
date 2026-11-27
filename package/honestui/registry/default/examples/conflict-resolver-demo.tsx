"use client"

import * as React from "react"

import {
  ConflictResolver,
  type ConflictFieldNode,
} from "@/registry/default/product/conflict-resolver/conflict-resolver"

type Customer = {
  name: string
  email: string
  phone: string
  plan: string
  seats: number
  renewal: string
}

// The record when you opened it.
const base: Customer = {
  name: "Northwind Labs",
  email: "accounts@northwind.example",
  phone: "+1 415 555 0134",
  plan: "Team",
  seats: 12,
  renewal: "Mar 1, 2027",
}

// Your edits.
const ours: Customer = {
  ...base,
  email: "billing@northwind.example",
  plan: "Business",
  seats: 15,
}

// What Dee Park saved while you were editing.
const theirs: Customer = {
  ...base,
  email: "finance@northwind.example",
  phone: "+1 415 555 0199",
  seats: 20,
}

const fields: ConflictFieldNode[] = [
  { key: "name", label: "Company" },
  { key: "email", label: "Billing email" },
  { key: "phone", label: "Phone" },
  { key: "plan", label: "Plan" },
  { key: "seats", label: "Seats" },
  { key: "renewal", label: "Renewal date" },
]

export default function ConflictResolverDemo() {
  const [merged, setMerged] = React.useState<Customer | null>(null)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-[var(--hui-space-4)]">
      <ConflictResolver
        aria-label="Resolve edits to Northwind Labs"
        base={base}
        ours={ours}
        theirs={theirs}
        fields={fields}
        labels={{ theirs: "Dee Park" }}
        onResolutionsChange={() => setMerged(null)}
        onApply={(value) => setMerged(value as Customer)}
      />
      {merged && (
        <p
          role="status"
          className="m-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
        >
          Saved: {merged.email} · {merged.phone} · {merged.plan} · {merged.seats} seats
        </p>
      )}
    </div>
  )
}
