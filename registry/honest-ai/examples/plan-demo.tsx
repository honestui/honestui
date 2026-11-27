"use client"

import * as React from "react"
import { RotateCcw as RotateCcwIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { Plan, type PlanStatus, type PlanStep } from "@/registry/honest-ai/ai/plan"

// A sample plan.
const sampleSteps: PlanStep[] = [
  { id: "read", title: "Read the failed export logs", detail: "Last three nightly runs, from the billing worker." },
  { id: "find", title: "Find the rows that broke the schema", detail: "Compare them with the v4 column contract." },
  { id: "patch", title: "Patch the currency mapper", detail: "Add the missing ISO codes and a test for each." },
  { id: "rerun", title: "Re-run last night's export", detail: "Into a staging bucket, so nothing reaches finance yet." },
]

/** No agent runs here. Approve and Revise set the status your handlers would. */
export default function PlanDemo() {
  const [status, setStatus] = React.useState<PlanStatus>("proposed")

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      <Plan
        title="Fix the nightly billing export"
        summary="The export stops on rows with an unmapped currency. I'll find them, patch the mapper, and re-run into staging."
        steps={sampleSteps}
        status={status}
        onApprove={() => setStatus("approved")}
        onRevise={() => setStatus("revising")}
      />
      {status !== "proposed" && (
        <Button variant="ghost" size="xs" onClick={() => setStatus("proposed")}>
          <RotateCcwIcon aria-hidden="true" />
          Reset
        </Button>
      )}
    </div>
  )
}
