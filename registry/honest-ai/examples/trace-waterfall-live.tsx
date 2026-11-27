"use client"

import * as React from "react"
import { RotateCcw as RotateCcwIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import { TraceWaterfall, type TraceSpan } from "@/registry/honest-ai/ai/trace-waterfall"

type Step = { id: string; name: string; kind: TraceSpan["kind"]; start: number; end: number; tokens?: TraceSpan["tokens"]; model?: string }

// The researcher agent's spans, revealed as the clock reaches them.
const steps: Step[] = [
  { id: "plan", name: "Plan research", kind: "llm", model: "claude-opus-5-5", start: 0, end: 900, tokens: { input: 840, output: 120 } },
  { id: "search-1", name: "web_search", kind: "tool", start: 950, end: 2100 },
  { id: "search-2", name: "web_search", kind: "tool", start: 960, end: 2600 },
  { id: "read", name: "Read sources", kind: "agent", start: 2650, end: 4600 },
  { id: "summarise", name: "Summarise findings", kind: "llm", model: "claude-opus-5-5", start: 4650, end: 6200, tokens: { input: 5120, output: 410 } },
]
const END = 6200

function spansAt(now: number): TraceSpan[] {
  const children: TraceSpan[] = steps
    .filter((step) => step.start <= now)
    .map((step) => ({
      ...step,
      end: step.end <= now ? step.end : undefined,
      tokens: step.end <= now ? step.tokens : undefined,
    }))
  return [{ id: "run", name: "Research competitors", kind: "run", start: 0, end: now >= END ? END : undefined, children }]
}

export default function TraceWaterfallLive() {
  const [now, setNow] = React.useState(0)
  const [run, setRun] = React.useState(0)

  React.useEffect(() => {
    const started = performance.now()
    let frame = 0
    const tick = () => {
      const elapsed = Math.min(END, (performance.now() - started) * 0.9)
      setNow(elapsed)
      if (elapsed < END) frame = window.setTimeout(tick, 100)
    }
    tick()
    return () => window.clearTimeout(frame)
  }, [run])

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-[var(--hui-space-4)]">
      <TraceWaterfall title="Research competitors" spans={spansAt(now)} now={now} />
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRun((value) => value + 1)}>
          <RotateCcwIcon aria-hidden="true" />
          Replay
        </Button>
      </div>
    </div>
  )
}
