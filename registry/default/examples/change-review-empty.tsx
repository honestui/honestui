"use client"

import {
  ChangeReview,
  type ChangeReviewFieldNode,
} from "@/registry/default/product/change-review/change-review"

// Sample notification settings that were opened and saved without edits.
const settings = { digest: "Weekly", mentions: true }

const fields: ChangeReviewFieldNode[] = [
  { key: "digest", label: "Email digest" },
  { key: "mentions", label: "Mentions", type: "boolean" },
]

export default function ChangeReviewEmpty() {
  return (
    <ChangeReview
      aria-label="Changes to notification settings"
      before={settings}
      after={settings}
      fields={fields}
      className="max-w-2xl"
    />
  )
}
