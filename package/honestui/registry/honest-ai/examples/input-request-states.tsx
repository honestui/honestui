"use client"

import { InputRequest, type InputRequestField } from "@/registry/honest-ai/ai/input-request"

const fields: InputRequestField[] = [
  { id: "budget", type: "number", label: "Monthly budget", unit: "USD", required: true },
  {
    id: "channels",
    type: "multiselect",
    label: "Channels",
    options: [
      { value: "search", label: "Search" },
      { value: "social", label: "Social" },
      { value: "email", label: "Email" },
    ],
  },
  { id: "approve", type: "boolean", label: "Auto-approve small changes" },
]

const noop = () => undefined

/** The finished states: what was sent, as shown after a reload, and a request that expired. */
export default function InputRequestStates() {
  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-5)]">
      <InputRequest
        agent="Campaign agent"
        title="What budget should the Q1 campaign use?"
        fields={fields}
        onSubmit={noop}
        status="submitted"
        submittedValues={{ budget: 12000, channels: ["search", "email"], approve: false }}
      />
      <InputRequest
        agent="Campaign agent"
        title="Which audience should the retargeting ads use?"
        fields={[{ id: "audience", type: "text", label: "Audience" }]}
        onSubmit={noop}
        status="expired"
      />
    </div>
  )
}
