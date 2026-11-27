"use client"

import * as React from "react"

import { RecommendationCard } from "@/registry/honest-ai/ai/recommendation-card"

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * There is no server behind this preview. The first accept is rejected on
 * purpose to show the failure state; the next one resolves.
 */
export default function RecommendationCardFailureExample() {
  const attempts = React.useRef(0)

  return (
    <div className="w-full max-w-md min-w-0">
      <RecommendationCard
        title="Run the migration on staging?"
        labels={{ accepted: "Started on staging." }}
        options={[
          {
            id: "run",
            body: "The migration adds a region column and backfills 1,204 rows. It can be rolled back.",
            summary: "Run the migration",
            confidence: 3,
            confidenceLabel: "High confidence",
            actionLabel: "Run it",
          },
        ]}
        onAccept={async () => {
          attempts.current += 1
          await wait(900)
          if (attempts.current === 1) throw new Error("This preview rejects the first accept.")
        }}
      />
    </div>
  )
}
