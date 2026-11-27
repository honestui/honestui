"use client"

import * as React from "react"
import { AiGlowBorder, type AiGlowBorderState } from "honestui/shaders"

import { PromptBar } from "@/registry/honest-ai/ai/prompt-bar"

const THINKING_MILLISECONDS = 1800
const STREAMING_MILLISECONDS = 3600

const statusText: Record<AiGlowBorderState, string> = {
  idle: "Send a message to watch the edge follow the reply.",
  thinking: "Thinking…",
  streaming: "Writing a reply…",
  error: "The reply was stopped.",
}

/**
 * No model replies in this preview. Timers stand in for the time to the first
 * token and for the reply streaming in. The glow follows the same status that
 * drives the Stop button, so it never shows activity that is not happening.
 */
export default function PromptBarGlowExample() {
  const [state, setState] = React.useState<AiGlowBorderState>("idle")
  const [intensity, setIntensity] = React.useState(0.5)
  const isBusy = state === "thinking" || state === "streaming"

  React.useEffect(() => {
    if (state === "thinking") {
      const timer = window.setTimeout(() => setState("streaming"), THINKING_MILLISECONDS)
      return () => window.clearTimeout(timer)
    }
    if (state === "streaming") {
      // Token rate varies while a reply streams; the edge quickens with it.
      const pulse = window.setInterval(() => setIntensity(0.35 + Math.random() * 0.6), 450)
      const done = window.setTimeout(() => setState("idle"), STREAMING_MILLISECONDS)
      return () => {
        window.clearInterval(pulse)
        window.clearTimeout(done)
      }
    }
  }, [state])

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)] py-[var(--hui-space-6)]">
      <AiGlowBorder state={state} intensity={intensity}>
        <PromptBar
          placeholder="Ask about your workspace…"
          onSubmit={() => setState("thinking")}
          onStop={isBusy ? () => setState("error") : undefined}
        />
      </AiGlowBorder>
      <p
        role="status"
        className="m-0 min-h-[var(--hui-space-5)] px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]"
      >
        {statusText[state]}
      </p>
    </div>
  )
}
