"use client"

import { MessageUsage } from "@/registry/honest-ai/ai/message-usage"

/** A reply with its usage underneath. The figures are a sample of what a provider reports. */
export default function MessageUsageDemo() {
  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)]">
      <p className="m-0 [font-size:var(--hui-font-size-regular)] [line-height:20px]">
        Three invoices are past due: INV-2041 ($1,240, 18 days), INV-2052 ($860, 9 days), and INV-2060 ($2,115, 3 days).
        I drafted a reminder for each, oldest first.
      </p>
      <MessageUsage
        className="-ms-[var(--hui-space-2)] self-start"
        model="gpt-5-mini"
        usage={{ input: 18_420, cachedInput: 12_288, output: 1_184, reasoning: 640 }}
        pricing={{ input: 0.25, cachedInput: 0.025, output: 2 }}
        latency={2_380}
        show={["tokens", "cost", "latency", "model"]}
      />
    </div>
  )
}
