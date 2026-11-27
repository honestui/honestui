"use client"

import * as React from "react"

import {
  GuardrailNotice,
  RedactedText,
  type GuardrailEvent,
  type GuardrailRange,
} from "@/registry/honest-ai/ai/guardrail-notice"

// The text as the reader may see it. Masked spans hold placeholders, never the originals.
const text =
  "Thanks — I've updated the account. Send the renewal to •••••••••••• and call ••••••••••• if the card ending •••• is declined. The API key ••••••••••••• has been rotated."

function rangeOf(needle: string, from = 0) {
  const start = text.indexOf(needle, from)
  return { start, end: start + needle.length }
}

const email = rangeOf("••••••••••••")
const phone = rangeOf("•••••••••••", email.end)
const card = rangeOf("••••", phone.end)
const secret = rangeOf("•••••••••••••", card.end)

const ranges: GuardrailRange[] = [
  { ...email, eventId: "email" },
  { ...phone, eventId: "phone" },
  { ...card, eventId: "card" },
  { ...secret, eventId: "secret" },
]

const events: GuardrailEvent[] = [
  {
    id: "email",
    action: "masked",
    category: "email",
    categoryLabel: "Email address",
    placeholder: "email",
    rule: "pii.email",
    reason: "Personal contact details are hidden in shared transcripts.",
    severity: "low",
    source: "Reply",
    revealable: true,
  },
  {
    id: "phone",
    action: "masked",
    category: "phone",
    categoryLabel: "Phone number",
    placeholder: "phone",
    rule: "pii.phone",
    reason: "Personal contact details are hidden in shared transcripts.",
    severity: "low",
    source: "Reply",
    revealable: true,
  },
  {
    id: "card",
    action: "masked",
    category: "card",
    categoryLabel: "Card digits",
    placeholder: "card",
    rule: "pci.pan-fragment",
    reason: "Card numbers are never shown, even in part.",
    severity: "medium",
    source: "Reply",
  },
  {
    id: "secret",
    action: "blocked",
    category: "secret",
    categoryLabel: "API key",
    placeholder: "secret",
    rule: "secrets.live-key",
    reason: "A live key was in the reply. It was removed before sending, and the key was rotated.",
    severity: "high",
    source: "Reply",
  },
  {
    id: "tone",
    action: "flagged",
    category: "policy",
    categoryLabel: "Payment pressure",
    rule: "policy.collections-tone",
    reason: "Mentions a declined card. Queued for a quick review by the billing team.",
    severity: "low",
    source: "Reply",
  },
]

const originals: Record<string, string> = { email: "ana.ruiz@northwind.co", phone: "+1 415 555 0142" }

/** Reveal waits briefly, as your server would while it records who looked. */
export default function GuardrailNoticeDemo() {
  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-primary)]">
      <p className="m-0 [font-size:var(--hui-font-size-regular)] [line-height:22px]">
        <RedactedText
          text={text}
          ranges={ranges}
          events={events}
          onReveal={(event) =>
            new Promise<string>((resolve) => window.setTimeout(() => resolve(originals[event.id] ?? ""), 600))
          }
        />
      </p>
      <GuardrailNotice events={events} />
    </div>
  )
}
