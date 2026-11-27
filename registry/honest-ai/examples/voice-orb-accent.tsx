"use client"

import * as React from "react"

import { VoiceOrb } from "@/registry/honest-ai/ai/voice-orb"

function sampleVoice(seconds: number) {
  const syllable = Math.max(0, Math.sin(seconds * 11)) ** 0.7
  const phrase = Math.max(0, Math.sin(seconds * 1.4) + 0.4)
  return Math.min(1, syllable * phrase * 0.8)
}

/** An orb in the accent color, in a call header. The reply's level is made up. */
export default function VoiceOrbAccent() {
  const outputLevel = React.useCallback(() => sampleVoice(performance.now() / 1000), [])

  return (
    <div className="flex w-full max-w-[24rem] items-center gap-[var(--hui-space-4)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-4)] shadow-[var(--hui-shadow-feather)]">
      <VoiceOrb
        state="speaking"
        outputLevel={outputLevel}
        size={56}
        accent="var(--hui-color-foreground-accent-primary)"
        announce={false}
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)]">
          Support assistant
        </p>
        <p className="m-0 truncate text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
          Speaking · <span className="tabular-nums">2:14</span>
        </p>
      </div>
    </div>
  )
}
