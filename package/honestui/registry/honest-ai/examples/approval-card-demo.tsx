"use client"

import * as React from "react"

import {
  ApprovalCard,
  type ApprovalAnswers,
  type ApprovalQuestion,
} from "@/registry/honest-ai/ai/approval-card"
import { Button } from "@/registry/default/ui/button"

// Sample questions.
const sampleQuestions: ApprovalQuestion[] = [
  {
    id: "scope",
    prompt: "Which invoices should the export include?",
    type: "single",
    required: true,
    options: [
      { value: "paid", label: "Paid only" },
      { value: "all", label: "Paid and open" },
    ],
    allowCustom: true,
  },
  {
    id: "columns",
    prompt: "Which extra columns do you want?",
    type: "multiple",
    options: [
      { value: "tax", label: "Tax amount" },
      { value: "region", label: "Billing region" },
      { value: "po", label: "Purchase order number" },
    ],
  },
  {
    id: "format",
    prompt: "Which format should I write?",
    type: "single",
    options: [
      { value: "csv", label: "CSV" },
      { value: "xlsx", label: "Excel workbook" },
    ],
  },
]

/** This preview sends nothing. It shows the object your `onSubmit` receives. */
export default function ApprovalCardDemo() {
  const [received, setReceived] = React.useState<ApprovalAnswers | null>(null)
  const [isDismissed, setIsDismissed] = React.useState(false)
  const [resetKey, setResetKey] = React.useState(0)

  const restart = () => {
    setReceived(null)
    setIsDismissed(false)
    setResetKey((key) => key + 1)
  }

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      {isDismissed ? (
        <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
          You closed the card without sending.
        </p>
      ) : (
        <ApprovalCard
          key={resetKey}
          questions={sampleQuestions}
          onSubmit={setReceived}
          onDismiss={() => setIsDismissed(true)}
        />
      )}
      {received && (
        <pre
          aria-label="Answers received by onSubmit"
          tabIndex={0}
          className="m-0 w-full overflow-x-auto rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-4)] font-mono text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-mono-mini)] [line-height:var(--hui-line-height-regular)] focus-visible:[outline:var(--hui-focus-ring)]"
        >
          {JSON.stringify(received, null, 2)}
        </pre>
      )}
      {(received || isDismissed) && (
        <Button variant="secondary" size="sm" onClick={restart}>
          Show the questions again
        </Button>
      )}
    </div>
  )
}
