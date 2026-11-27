"use client"

import { AgentHandoff } from "@/registry/honest-ai/ai/agent-handoff"

export default function AgentHandoffDemo() {
  return (
    <div className="w-full max-w-lg min-w-0">
      <AgentHandoff
        from={{ name: "Triage", role: "Routes new conversations" }}
        to={{ name: "Billing", role: "Refunds and invoices" }}
        status="accepted"
        time="2:14 PM"
        reason="The customer is asking for a refund on a delivered order, which needs the billing tools."
        summary="Maya Chen wants to return order #48213, delivered November 12. She has the original packaging and asked whether the refund goes back to her card."
        facts={[
          { label: "Customer", value: "Maya Chen · Pro plan" },
          { label: "Order", value: "#48213 · $1,249.00" },
          { label: "Delivered", value: "November 12, 2026" },
          { label: "Return window", value: "Open until December 12" },
        ]}
        items={[
          { name: "order-48213.json", meta: "2 KB" },
          { name: "conversation.md", meta: "14 messages" },
        ]}
        tokens={1240}
        defaultOpen
        onViewContext={() => {}}
      />
    </div>
  )
}
