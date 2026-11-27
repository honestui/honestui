"use client"

import * as React from "react"

import { ApprovalCard, type ApprovalQuestion } from "@/registry/honest-ai/ai/approval-card"

// Sample question.
const sampleQuestions: ApprovalQuestion[] = [
  {
    id: "deploy",
    prompt: "The migration drops the legacy_region column. Run it on staging?",
    type: "single",
    required: true,
    options: [
      { value: "run", label: "Run it on staging" },
      { value: "hold", label: "Hold until I review the SQL" },
    ],
  },
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

/**
 * There is no server behind this preview. The first send is rejected on
 * purpose to show the failure state; the next send resolves.
 */
export default function ApprovalCardFailureExample() {
  const attempts = React.useRef(0)

  return (
    <div className="w-full max-w-md min-w-0">
      <ApprovalCard
        questions={sampleQuestions}
        labels={{ submitted: "Answer sent. The agent will continue." }}
        onSubmit={async () => {
          attempts.current += 1
          await wait(900)
          if (attempts.current === 1) {
            throw new Error("This preview rejects the first send.")
          }
        }}
      />
    </div>
  )
}
