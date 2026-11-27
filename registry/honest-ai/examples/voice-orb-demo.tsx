"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { VoiceOrb, type VoiceOrbState } from "@/registry/honest-ai/ai/voice-orb"

const states: { value: VoiceOrbState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "listening", label: "Listening" },
  { value: "thinking", label: "Thinking" },
  { value: "speaking", label: "Speaking" },
]

// A made-up voice: syllables inside phrases, with pauses between them.
function sampleVoice(seconds: number, pace: number) {
  const syllable = Math.max(0, Math.sin(seconds * 9.1 * pace)) ** 0.7
  const phrase = Math.max(0, Math.sin(seconds * 1.15 * pace) + 0.3)
  return Math.min(1, syllable * phrase * 0.8)
}

/**
 * No microphone or model is involved. The levels are made up, so the orb has
 * something to listen to and something to say.
 */
export default function VoiceOrbDemo() {
  const [state, setState] = React.useState<VoiceOrbState>("listening")
  const inputLevel = React.useCallback(() => sampleVoice(performance.now() / 1000, 1), [])
  const outputLevel = React.useCallback(() => sampleVoice(performance.now() / 1000 + 3, 1.25), [])

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-center gap-[var(--hui-space-6)]">
      <VoiceOrb state={state} inputLevel={inputLevel} outputLevel={outputLevel} size={136} />
      <div role="group" aria-label="Orb state" className="flex flex-wrap justify-center gap-[var(--hui-space-2)]">
        {states.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={state === option.value ? "secondary" : "ghost"}
            aria-pressed={state === option.value}
            onClick={() => setState(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
