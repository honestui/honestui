"use client"

import type * as React from "react"

import { AgentHandoff } from "@/registry/honest-ai/ai/agent-handoff"

function Message({ from, children }: { from: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-[var(--hui-space-1)]">
      <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">{from}</span>
      <p className="m-0 text-pretty [font-size:var(--hui-font-size-regular)] [line-height:var(--hui-line-height-regular)]">{children}</p>
    </div>
  )
}

export default function AgentHandoffInline() {
  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-6)]">
      <Message from="Triage">Thanks, Maya. Refunds are handled by our billing team, so I&apos;m passing you over with everything you&apos;ve told me.</Message>
      <AgentHandoff
        variant="inline"
        from={{ name: "Triage" }}
        to={{ name: "Billing" }}
        status="accepted"
        time="2:14 PM"
        reason="Refund on a delivered order needs the billing tools."
        summary="Maya wants to return order #48213, delivered November 12, and asked whether the refund goes back to her card."
        facts={[
          { label: "Order", value: "#48213 · $1,249.00" },
          { label: "Return window", value: "Open until December 12" },
        ]}
      />
      <Message from="Billing">Hi Maya, I can see order #48213. It&apos;s within the return window, and the refund goes back to the card you paid with.</Message>
    </div>
  )
}
