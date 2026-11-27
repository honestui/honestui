"use client"

import * as React from "react"

import {
  EvalCompare,
  type EvalCandidate,
  type EvalMetric,
  type EvalVote,
} from "@/registry/honest-ai/ai/eval-compare"

const metrics: EvalMetric[] = [
  { key: "correctness", label: "Correctness", better: "higher", format: (v) => `${Math.round(v * 100)}%` },
  { key: "faithfulness", label: "Faithfulness", better: "higher", format: (v) => `${Math.round(v * 100)}%` },
  { key: "latency", label: "Latency", better: "lower", format: (v) => `${(v / 1000).toFixed(1)} s` },
  { key: "tokens", label: "Output tokens", better: "lower" },
  { key: "cost", label: "Cost", better: "lower", format: (v) => `$${v.toFixed(4)}` },
]

type EvalCase = { prompt: string; expected: string; candidates: EvalCandidate[] }

// Three support questions answered by two models and a revised prompt.
const cases: EvalCase[] = [
  {
    prompt: "A customer on the Team plan asks whether they can get a refund for the unused months after downgrading.",
    expected: "Prorated credit to the account, not a refund to the card; refunds only within 14 days of renewal.",
    candidates: [
      {
        id: "sonnet",
        label: "Large · v3",
        meta: "Large model, prompt v3",
        output:
          "Downgrading keeps your workspace on Team until the end of the billing period. The unused months are added to your account as a prorated credit, which pays for future invoices. Refunds to your card are only available within 14 days of a renewal.",
        metrics: { correctness: 0.96, faithfulness: 0.98, latency: 2140, tokens: 58, cost: 0.0021 },
        assertions: [
          { label: "Mentions prorated credit", passed: true },
          { label: "States the 14-day window", passed: true },
          { label: "Under 80 words", passed: true },
        ],
      },
      {
        id: "haiku",
        label: "Small · v3",
        meta: "Small model, prompt v3",
        output:
          "Downgrading keeps your workspace on Team until the end of the billing period. The unused months are refunded to your card within 5 business days.",
        metrics: { correctness: 0.41, faithfulness: 0.52, latency: 860, tokens: 31, cost: 0.0004 },
        assertions: [
          { label: "Mentions prorated credit", passed: false, detail: "Promises a card refund instead." },
          { label: "States the 14-day window", passed: false },
          { label: "Under 80 words", passed: true },
        ],
      },
      {
        id: "sonnet-v4",
        label: "Large · v4",
        meta: "Prompt v4 cites the policy",
        output:
          "Downgrading keeps your workspace on Team until the end of the billing period. The unused months become a prorated credit on your account, which pays for future invoices. Card refunds are only available within 14 days of a renewal (Billing policy, section 3).",
        metrics: { correctness: 0.97, faithfulness: 0.99, latency: 2410, tokens: 64, cost: 0.0023 },
        assertions: [
          { label: "Mentions prorated credit", passed: true },
          { label: "States the 14-day window", passed: true },
          { label: "Under 80 words", passed: true },
        ],
      },
    ],
  },
  {
    prompt: "How do I move a project to another workspace?",
    expected: "Project settings → Transfer; needs admin in both workspaces; integrations must be reconnected.",
    candidates: [
      {
        id: "sonnet",
        label: "Large · v3",
        meta: "Large model, prompt v3",
        output:
          "Open the project, go to Settings, and choose Transfer. You need to be an admin in both workspaces. Integrations such as Slack and GitHub disconnect during the move, so reconnect them afterwards.",
        metrics: { correctness: 0.94, faithfulness: 0.97, latency: 1980, tokens: 44, cost: 0.0017 },
        assertions: [
          { label: "Names the Transfer setting", passed: true },
          { label: "Mentions admin in both", passed: true },
          { label: "Under 80 words", passed: true },
        ],
      },
      {
        id: "haiku",
        label: "Small · v3",
        meta: "Small model, prompt v3",
        output:
          "Open the project, go to Settings, and choose Transfer. You need to be an admin in both workspaces.",
        metrics: { correctness: 0.78, faithfulness: 0.96, latency: 790, tokens: 22, cost: 0.0003 },
        assertions: [
          { label: "Names the Transfer setting", passed: true },
          { label: "Mentions admin in both", passed: true },
          { label: "Under 80 words", passed: true },
        ],
      },
      {
        id: "sonnet-v4",
        label: "Large · v4",
        meta: "Prompt v4 cites the policy",
        output:
          "Open the project, go to Settings, and choose Transfer. You need to be an admin in both workspaces. Integrations such as Slack and GitHub disconnect during the move, so reconnect them afterwards (Help center: Moving projects).",
        metrics: { correctness: 0.95, faithfulness: 0.97, latency: 2260, tokens: 51, cost: 0.0019 },
        assertions: [
          { label: "Names the Transfer setting", passed: true },
          { label: "Mentions admin in both", passed: true },
          { label: "Under 80 words", passed: true },
        ],
      },
    ],
  },
]

/** Results are fixed sample data; no model runs here. */
export default function EvalCompareDemo() {
  const [caseIndex, setCaseIndex] = React.useState(0)
  const [votes, setVotes] = React.useState<EvalVote[]>(() => cases.map(() => null))
  const current = cases[caseIndex]

  return (
    <EvalCompare
      className="max-w-4xl"
      prompt={current.prompt}
      expected={current.expected}
      candidates={current.candidates}
      metrics={metrics}
      caseIndex={caseIndex}
      caseCount={cases.length}
      onCaseChange={setCaseIndex}
      vote={votes[caseIndex]}
      onVote={(vote) => setVotes((all) => all.map((entry, index) => (index === caseIndex ? vote : entry)))}
    />
  )
}
