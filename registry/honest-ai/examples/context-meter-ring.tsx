"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { ContextMeter } from "@/registry/honest-ai/ai/context-meter"

// Sample figures.
const SAMPLE_LIMIT = 200_000
const SAMPLE_STEP = 30_000

/** Nothing is counting tokens here. The button adds a sample 30,000 tokens. */
export default function ContextMeterRingExample() {
  const [used, setUsed] = React.useState(48_000)

  return (
    <div className="flex w-full max-w-md min-w-0 items-center gap-[var(--hui-space-3)]">
      <ContextMeter used={used} limit={SAMPLE_LIMIT} showPercent={false} />
      <Button variant="secondary" size="sm" onClick={() => setUsed(used + SAMPLE_STEP)}>
        Add 30,000 tokens
      </Button>
      <Button variant="ghost" size="sm" disabled={used === 48_000} onClick={() => setUsed(48_000)}>
        Reset
      </Button>
    </div>
  )
}
