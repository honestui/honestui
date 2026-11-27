"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { LiveWaveform, type LiveWaveformState, type LiveWaveformVariant } from "@/registry/honest-ai/ai/live-waveform"

const states: { value: LiveWaveformState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "active", label: "Listening" },
  { value: "processing", label: "Processing" },
]

function sampleVoice(seconds: number) {
  const syllable = Math.max(0, Math.sin(seconds * 9.4)) ** 0.6
  const phrase = Math.max(0, Math.sin(seconds * 1.2) + 0.35)
  const grain = 0.85 + Math.sin(seconds * 53) * 0.15
  return Math.min(1, syllable * phrase * grain * 0.85)
}

/** No microphone is open. The level is made up, so the preview never asks for permission. */
export default function LiveWaveformDemo() {
  const [state, setState] = React.useState<LiveWaveformState>("active")
  const [variant, setVariant] = React.useState<LiveWaveformVariant>("bars")
  const level = React.useCallback(() => sampleVoice(performance.now() / 1000), [])

  return (
    <div className="flex w-full max-w-[30rem] flex-col gap-[var(--hui-space-4)]">
      <div className="rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] shadow-[var(--hui-shadow-feather)]">
        <LiveWaveform state={state} variant={variant} level={level} className="h-14" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-[var(--hui-space-3)]">
        <div role="group" aria-label="Waveform state" className="flex gap-[var(--hui-space-2)]">
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
        <div role="group" aria-label="Waveform style" className="flex gap-[var(--hui-space-2)]">
          {(["bars", "line"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={variant === value ? "secondary" : "ghost"}
              aria-pressed={variant === value}
              onClick={() => setVariant(value)}
            >
              {value === "bars" ? "Bars" : "Line"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
