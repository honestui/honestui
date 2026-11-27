"use client"

import * as React from "react"

import { ToolChips, type ToolCall } from "@/registry/honest-ai/ai/tool-chips"
import { Button } from "@/registry/default/ui/button"
import { RefreshRounded as RefreshIcon } from "honestui/icons"

// Sample run. The last call fails on purpose.
const sampleCalls: ToolCall[] = [
  { id: "read", label: "Read", detail: "schema.sql", detailIsCode: true },
  { id: "write", label: "Write", detail: "0042_add_region.sql", detailIsCode: true },
  {
    id: "migrate",
    label: "Run",
    detail: "npm run migrate",
    detailIsCode: true,
    outputIsCode: true,
    output: [{ text: "error: column \"region\" already exists" }],
  },
]

const CALL_MILLISECONDS = 1000

/**
 * No tools run behind this preview. A timer adds one call at a time, and the
 * last one is marked failed, to show how the list reads while a run is live.
 */
export default function ToolChipsRunningExample() {
  const [settled, setSettled] = React.useState(0)
  const isRunning = settled < sampleCalls.length

  React.useEffect(() => {
    if (!isRunning) return
    const timer = window.setTimeout(() => setSettled((count) => count + 1), CALL_MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [settled, isRunning])

  const calls = sampleCalls.slice(0, settled + 1).map((call, index): ToolCall => {
    if (index >= settled) return { ...call, status: "running", output: undefined }
    return { ...call, status: call.id === "migrate" ? "error" : "done" }
  })

  return (
    <div className="flex w-full max-w-[32rem] min-w-0 flex-col items-start gap-[var(--hui-space-6)]">
      <ToolChips
        summary={isRunning ? `Running call ${calls.length} of ${sampleCalls.length}` : "3 tool calls, 1 failed"}
        calls={calls}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={isRunning}
        onClick={() => setSettled(0)}
        className="-ms-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)]"
      >
        <RefreshIcon aria-hidden="true" className="size-4" />
        Run the sample again
      </Button>
    </div>
  )
}
