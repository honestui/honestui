"use client"

import * as React from "react"

import {
  applyAcceptedChanges,
  ChangeReview,
  type ChangeReviewDecisions,
  type ChangeReviewFieldNode,
} from "@/registry/default/product/change-review/change-review"

// Sample profile update that a teammate submitted for approval.
const current = {
  displayName: "Dee Park",
  title: "Support lead",
  phone: "",
  timezone: "Europe/London",
}

const requested = {
  displayName: "Dee Park-Osei",
  title: "Head of support",
  phone: "+44 20 7946 0958",
  timezone: "Europe/London",
}

const fields: ChangeReviewFieldNode[] = [
  { key: "displayName", label: "Display name" },
  { key: "title", label: "Job title" },
  { key: "phone", label: "Phone" },
  { key: "timezone", label: "Time zone" },
]

/**
 * The parent owns the decisions. Nothing is applied by the component: the
 * readout shows the profile that `applyAcceptedChanges` would save.
 */
export default function ChangeReviewDecisionsExample() {
  const [decisions, setDecisions] = React.useState<ChangeReviewDecisions>({})
  const result = applyAcceptedChanges(current, requested, decisions)

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <ChangeReview
        aria-label="Requested profile changes"
        before={current}
        after={requested}
        fields={fields}
        decisions={decisions}
        onDecisionsChange={setDecisions}
      />
      <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [letter-spacing:var(--hui-letter-spacing-mini)] [line-height:var(--hui-line-height-mini)]">
        Profile after approval: {result.displayName}, {result.title}, phone{" "}
        {result.phone || "not set"}.
      </p>
    </div>
  )
}
