"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import {
  InputRequest,
  type InputRequestField,
  type InputRequestValues,
} from "@/registry/honest-ai/ai/input-request"

const fields: InputRequestField[] = [
  {
    id: "environment",
    type: "select",
    label: "Target environment",
    required: true,
    options: [
      { value: "staging", label: "Staging" },
      { value: "production", label: "Production" },
    ],
  },
  {
    id: "window",
    type: "date",
    label: "Maintenance date",
    help: "The migration locks the orders table for about 10 minutes.",
    required: true,
    min: "2026-11-27",
  },
  {
    id: "batch",
    type: "number",
    label: "Batch size",
    unit: "rows",
    defaultValue: 5000,
    min: 500,
    max: 50000,
    step: 500,
  },
  {
    id: "notify",
    type: "multiselect",
    label: "Who should hear about it",
    options: [
      { value: "oncall", label: "On-call engineer" },
      { value: "support", label: "Support team" },
      { value: "finance", label: "Finance" },
    ],
    defaultValue: ["oncall"],
  },
  { id: "dryRun", type: "boolean", label: "Run a dry run first", help: "Reports row counts without writing.", defaultValue: true },
  { id: "notes", type: "textarea", label: "Anything else I should know", placeholder: "Optional", maxLength: 400 },
]

/** This preview sends nothing. Sending waits a moment, then shows what your `onSubmit` receives. */
export default function InputRequestDemo() {
  const [received, setReceived] = React.useState<InputRequestValues | null>(null)
  const [resetKey, setResetKey] = React.useState(0)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      <InputRequest
        key={resetKey}
        agent="Migration agent"
        title="Where and when should I run the orders migration?"
        reason="The plan is ready, but I can't pick the environment or a maintenance date on my own."
        nextStep="Back up the orders table, then migrate in batches and report the row counts."
        deadline="The run waits until 5:00 PM"
        fields={fields}
        onSubmit={(values) =>
          new Promise<void>((resolve) =>
            window.setTimeout(() => {
              setReceived(values)
              resolve()
            }, 700)
          )
        }
        onSkip={() => undefined}
        onCancelRun={() => undefined}
      />
      {received && (
        <pre
          aria-label="Values received by onSubmit"
          tabIndex={0}
          className="m-0 w-full overflow-x-auto rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] p-[var(--hui-space-4)] font-mono text-[var(--hui-color-foreground-base-primary)] outline-none [font-size:var(--hui-font-size-mono-mini)] [line-height:var(--hui-line-height-regular)] focus-visible:[outline:var(--hui-focus-ring)]"
        >
          {JSON.stringify(received, null, 2)}
        </pre>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setReceived(null)
          setResetKey((key) => key + 1)
        }}
      >
        Replay
      </Button>
    </div>
  )
}
