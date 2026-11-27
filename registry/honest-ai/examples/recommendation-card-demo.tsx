"use client"

import * as React from "react"

import {
  RecommendationCard,
  type RecommendationOption,
} from "@/registry/honest-ai/ai/recommendation-card"

// Sample options.
const sampleOptions: RecommendationOption[] = [
  {
    id: "round-once",
    body: "Round the total once, after the rows are summed. All 14 existing tests pass with this change.",
    summary: "Round once, after the sum",
    confidence: 3,
    confidenceLabel: "High confidence",
    actionLabel: "Apply the fix",
  },
  {
    id: "decimal",
    body: "Store amounts as integer cents. This removes rounding entirely, but it changes the invoice schema.",
    summary: "Store amounts as integer cents",
    confidence: 2,
    confidenceLabel: "Needs review",
    actionLabel: "Draft the migration",
  },
  {
    id: "leave",
    body: "Leave the export as it is and note the one-cent drift in the changelog.",
    summary: "Leave it and document the drift",
    confidence: 0,
    confidenceLabel: "No evidence",
    actionLabel: "Write the note",
  },
]

/** This preview applies nothing. It shows the option your `onAccept` receives. */
export default function RecommendationCardDemo() {
  const [accepted, setAccepted] = React.useState("")

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col gap-[var(--hui-space-3)]">
      <RecommendationCard
        title="How should I fix the rounding drift?"
        options={sampleOptions}
        onAccept={(option) => setAccepted(option.id)}
      />
      <p
        role="status"
        className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]"
      >
        {accepted ? `onAccept received “${accepted}”` : ""}
      </p>
    </div>
  )
}
