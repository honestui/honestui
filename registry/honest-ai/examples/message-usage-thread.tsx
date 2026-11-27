"use client"

import { MessageUsage, sumUsage, type MessageUsageTokens } from "@/registry/honest-ai/ai/message-usage"

const turns: { prompt: string; usage: MessageUsageTokens; cost: number; latency: number }[] = [
  { prompt: "Summarize last week's churn", usage: { input: 6_210, output: 742 }, cost: 0.0298, latency: 3_120 },
  { prompt: "Break it down by plan", usage: { input: 7_480, cachedInput: 6_144, output: 1_036 }, cost: 0.0211, latency: 2_460 },
  { prompt: "Draft a note for the team", usage: { input: 8_905, cachedInput: 7_168, output: 1_412, reasoning: 384 }, cost: 0.0262, latency: 4_870 },
]

/** Each turn shows its billed cost; the footer totals the thread. */
export default function MessageUsageThread() {
  const total = sumUsage(turns.map((turn) => turn.usage))
  const totalCost = turns.reduce((sum, turn) => sum + turn.cost, 0)

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]">
      <ul className="m-0 list-none p-0">
        {turns.map((turn) => (
          <li
            key={turn.prompt}
            className="flex min-h-11 flex-wrap items-center justify-between gap-x-[var(--hui-space-4)] border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-2)] [font-size:var(--hui-font-size-regular)]"
          >
            <span className="min-w-0 truncate">{turn.prompt}</span>
            <MessageUsage
              className="-me-[var(--hui-space-2)]"
              usage={turn.usage}
              cost={turn.cost}
              latency={turn.latency}
              show={["tokens", "cost"]}
              model="claude-sonnet-5-5"
            />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-3)] py-[var(--hui-space-2)]">
        <MessageUsage variant="thread" messageCount={turns.length} usage={total} cost={totalCost} />
      </div>
    </div>
  )
}
