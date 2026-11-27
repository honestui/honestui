"use client"

import { GuardrailNotice, type GuardrailEvent } from "@/registry/honest-ai/ai/guardrail-notice"

const events: GuardrailEvent[] = [
  {
    id: "dosage",
    action: "blocked",
    category: "policy",
    categoryLabel: "Medication dosage",
    rule: "policy.medical-dosing",
    reason: "The assistant does not give dosing advice. It suggested asking a pharmacist instead.",
    severity: "high",
    source: "Your message",
  },
  {
    id: "name",
    action: "allowed",
    category: "pii",
    categoryLabel: "Person's name",
    rule: "pii.person-name",
    reason: "A name was sent to the model. It is allowed in private chats, but not stored.",
    severity: "low",
    source: "Your message",
  },
]

/** A blocked request opens its details at once, so the reason is never hidden. */
export default function GuardrailNoticeBlocked() {
  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-primary)]">
      <p className="m-0 self-end rounded-[var(--hui-radius-4)] bg-[var(--hui-color-background-neutral-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] [font-size:var(--hui-font-size-regular)] [line-height:20px]">
        How much ibuprofen can Maya take with her other prescription?
      </p>
      <GuardrailNotice events={events} />
    </div>
  )
}
