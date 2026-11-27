"use client"

import * as React from "react"

import { VoiceInput, type VoiceInputState } from "@/registry/honest-ai/ai/voice-input"

const SAMPLE_TRANSCRIPT = "Summarize the failing billing tests and suggest a fix for the rounding one."

/** A speech-like level: syllables over a slow breath, with a little grain. */
function useSampleLevel(active: boolean) {
  const [level, setLevel] = React.useState(0)
  React.useEffect(() => {
    if (!active) return
    const started = performance.now()
    const timer = window.setInterval(() => {
      const t = (performance.now() - started) / 1000
      const syllable = Math.max(0, Math.sin(t * 9) * Math.sin(t * 2.3 + 1))
      const breath = 0.55 + 0.45 * Math.sin(t * 0.9)
      setLevel(Math.min(1, 0.08 + syllable * breath * 0.85 + Math.random() * 0.08))
    }, 60)
    return () => {
      window.clearInterval(timer)
      setLevel(0)
    }
  }, [active])
  return level
}

/**
 * No microphone is used. The states run on timers and the level is
 * generated, so the preview shows the whole flow without asking for access.
 */
export default function VoiceInputDemo() {
  const [state, setState] = React.useState<VoiceInputState>("idle")
  const level = useSampleLevel(state === "recording")
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const later = (next: VoiceInputState, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState(next), ms)
  }

  return (
    <div className="flex w-full max-w-sm min-w-0 flex-col gap-[var(--hui-space-4)]">
      <VoiceInput
        state={state}
        level={level}
        onStart={() => {
          setState("requesting")
          later("recording", 700)
        }}
        onStop={() => {
          setState("transcribing")
          later("done", 1400)
        }}
        onCancel={() => {
          window.clearTimeout(timer.current)
          setState("idle")
        }}
      />
      <p
        className="m-0 min-h-10 px-[var(--hui-space-2)] text-center text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [line-height:20px]"
      >
        {state === "done" ? `“${SAMPLE_TRANSCRIPT}”` : null}
      </p>
    </div>
  )
}
