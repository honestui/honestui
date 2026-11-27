"use client"

import * as React from "react"

import { ContextMeter } from "@/registry/honest-ai/ai/context-meter"
import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"

// Sample figures. Each sent prompt is counted as one token for every four characters, a rough stand-in for a tokenizer.
const SAMPLE_LIMIT = 8_000
const SAMPLE_USED = 6_150

/** No model replies here. Sending a prompt adds its sample token count to the meter. */
export default function ContextMeterPromptBarExample() {
  const [used, setUsed] = React.useState(SAMPLE_USED)

  return (
    <div className="w-full max-w-md min-w-0">
      <PromptBar
        placeholder="Write a message…"
        onSubmit={({ text }) => setUsed((current) => current + Math.ceil(text.length / 4))}
        actions={<ContextMeter used={used} limit={SAMPLE_LIMIT} />}
      />
    </div>
  )
}
