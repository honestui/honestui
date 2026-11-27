"use client"

import { TraceWaterfall, buildTraceTree, type FlatTraceSpan } from "@/registry/honest-ai/ai/trace-waterfall"

// Flat spans, as a tracing backend exports them, in milliseconds from the start of the run.
const spans: FlatTraceSpan[] = [
  { id: "run", name: "Answer refund question", kind: "run", start: 0, end: 6840 },
  { id: "plan", parentId: "run", name: "Plan", kind: "llm", model: "claude-sonnet-5-5", start: 40, end: 1180, tokens: { input: 1204, output: 96 }, cost: 0.0051,
    input: "System: You are a support agent for Northwind.\nUser: Can I still get a refund for order #48213?",
    output: "1. Look up the order.\n2. Check the refund policy for its category.\n3. Answer with the deadline." },
  { id: "lookup", parentId: "run", name: "get_order", kind: "tool", start: 1220, end: 1610, input: '{ "order_id": "48213" }', error: "TimeoutError: orders-api did not respond within 350ms", status: "error", attributes: { attempt: 1, region: "eu-west-1" } },
  { id: "lookup-2", parentId: "run", name: "get_order", kind: "tool", start: 1640, end: 2190, input: '{ "order_id": "48213" }', output: '{ "status": "delivered", "delivered_at": "2026-11-12", "category": "electronics" }', attributes: { attempt: 2, region: "eu-west-1" } },
  { id: "policy", parentId: "run", name: "Find refund policy", kind: "retrieval", start: 2210, end: 2980, attributes: { index: "help-center", documents: 4, top_score: 0.91 },
    input: "refund window electronics delivered", output: "Electronics can be returned within 30 days of delivery, unopened or faulty." },
  { id: "embed", parentId: "policy", name: "Embed query", kind: "llm", model: "text-embed-3", start: 2220, end: 2400, tokens: { input: 9 }, cost: 0.000002 },
  { id: "search", parentId: "policy", name: "vector_search", kind: "tool", start: 2410, end: 2960, attributes: { k: 8 } },
  { id: "answer", parentId: "run", name: "Write answer", kind: "llm", model: "claude-sonnet-5-5", start: 3010, end: 6800, tokens: { input: 2310, output: 214 }, cost: 0.0101,
    output: "Yes. Order #48213 was delivered on November 12, so you can return it until December 12." },
]

const trace = buildTraceTree(spans)

export default function TraceWaterfallDemo() {
  return (
    <div className="w-full max-w-2xl min-w-0">
      <TraceWaterfall title="Answer refund question" spans={trace} defaultSelectedId="lookup" />
    </div>
  )
}
