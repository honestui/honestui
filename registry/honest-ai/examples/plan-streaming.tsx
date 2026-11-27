"use client"

import * as React from "react"
import { RotateCcw as RotateCcwIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { Plan, type PlanStep } from "@/registry/honest-ai/ai/plan"

const sampleSteps: PlanStep[] = [
  { id: "audit", title: "List every page that loads the old SDK" },
  { id: "swap", title: "Swap the client for the v2 import", detail: "One pull request per app, behind a flag." },
  { id: "verify", title: "Check sign-in on staging" },
  { id: "remove", title: "Remove the old package" },
]

/** Steps arrive one by one, as an agent would stream them. */
export default function PlanStreaming() {
  const [count, setCount] = React.useState(0)
  const [run, setRun] = React.useState(0)

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setCount((current) => {
        if (current >= sampleSteps.length) {
          window.clearInterval(timer)
          return current
        }
        return current + 1
      })
    }, 700)
    return () => window.clearInterval(timer)
  }, [run])

  const done = count >= sampleSteps.length

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col items-start gap-[var(--hui-space-4)]">
      <Plan
        key={run}
        title="Migrate to the v2 auth client"
        summary="Four steps, each reversible until the last."
        steps={sampleSteps.slice(0, count)}
        status={done ? "proposed" : "streaming"}
        onApprove={() => {}}
        onRevise={() => {}}
      />
      <Button variant="ghost" size="xs" onClick={() => {
          setCount(0)
          setRun((current) => current + 1)
        }}>
        <RotateCcwIcon aria-hidden="true" />
        Replay
      </Button>
    </div>
  )
}
