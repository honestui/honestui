"use client"

import {
  ConflictResolver,
  type ConflictFieldNode,
} from "@/registry/default/product/conflict-resolver/conflict-resolver"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

const base = {
  title: "Spring launch",
  budget: { amount: 1200000, owner: "Ana Ruiz" },
  schedule: { start: "Apr 6", end: "May 15", public: false },
}

const ours = {
  title: "Spring launch 2027",
  budget: { amount: 1450000, owner: "Ana Ruiz" },
  schedule: { start: "Apr 13", end: "May 15", public: true },
}

const theirs = {
  title: "Spring launch",
  budget: { amount: 1350000, owner: "Li Wei" },
  schedule: { start: "Apr 13", end: "May 22", public: false },
}

const fields: ConflictFieldNode[] = [
  { key: "title", label: "Title" },
  {
    group: "Budget",
    fields: [
      {
        key: "budget.amount",
        label: "Amount",
        render: (value) => money.format(Number(value) / 100),
        format: (value) => (Number(value) / 100).toFixed(2),
        parse: (text) => Math.round(Number(text.replace(/[^0-9.]/g, "")) * 100),
      },
      { key: "budget.owner", label: "Owner" },
    ],
  },
  {
    group: "Schedule",
    fields: [
      { key: "schedule.start", label: "Start" },
      { key: "schedule.end", label: "End" },
      { key: "schedule.public", label: "Public page" },
    ],
  },
]

/** Merged fields are shown too, so their automatic choice can be overridden. */
export default function ConflictResolverGroups() {
  return (
    <ConflictResolver
      aria-label="Resolve edits to the Spring launch campaign"
      base={base}
      ours={ours}
      theirs={theirs}
      fields={fields}
      defaultShowAll
      labels={{ theirs: "Li Wei" }}
      className="max-w-3xl"
    />
  )
}
