"use client"

import {
  ChangeReview,
  type ChangeReviewFieldNode,
} from "@/registry/default/product/change-review/change-review"

type Member = { id: string; name: string }

// Sample workspace settings. `saved` is what the server holds; `draft` is the edited form.
const saved = {
  name: "Northwind Labs",
  billingEmail: "accounts@northwind.example",
  notifications: true,
  members: [
    { id: "m1", name: "Sam Cole" },
    { id: "m2", name: "Dee Park" },
  ],
}

const draft = {
  name: "Northwind Labs",
  billingEmail: "billing@northwind.example",
  notifications: false,
  members: [
    { id: "m2", name: "Dee Park" },
    { id: "m3", name: "Ana Ruiz" },
    { id: "m4", name: "Li Wei" },
  ],
}

const fields: ChangeReviewFieldNode[] = [
  { key: "name", label: "Workspace name" },
  { key: "billingEmail", label: "Billing email" },
  {
    key: "members",
    label: "Team access",
    type: "list",
    itemKey: "id",
    itemLabel: (member: Member) => member.name,
  },
  { key: "notifications", label: "Notifications", type: "boolean" },
]

export default function ChangeReviewDemo() {
  return (
    <ChangeReview
      aria-label="Changes to workspace settings"
      before={saved}
      after={draft}
      fields={fields}
      className="max-w-2xl"
    />
  )
}
