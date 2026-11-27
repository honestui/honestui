"use client"

import * as React from "react"
import { Pause as PauseIcon, Play as PlayIcon } from "honestui/icons"
import { AudioOrb } from "honestui/shaders"

import { Button } from "@/registry/default/ui/button"
import { LiveWaveform } from "@/registry/honest-ai/ai/live-waveform"
import type { VoiceOrbState } from "@/registry/honest-ai/ai/voice-orb"

type Turn = { state: VoiceOrbState; seconds: number; caption: string }

// One made-up exchange, played in a loop. No microphone or model is involved.
const script: Turn[] = [
  { state: "idle", seconds: 1.6, caption: "Tap to talk, or just start speaking." },
  { state: "listening", seconds: 3.4, caption: "“Can you move my 3 o’clock with Priya to tomorrow?”" },
  { state: "thinking", seconds: 1.8, caption: "Checking both calendars…" },
  { state: "speaking", seconds: 4.2, caption: "“Done. You’re both free at 3:30 tomorrow, so I moved it there.”" },
]

// Syllables inside phrases, with pauses between them.
function sampleVoice(seconds: number, pace: number) {
  const syllable = Math.max(0, Math.sin(seconds * 9.1 * pace)) ** 0.7
  const phrase = Math.max(0, Math.sin(seconds * 1.15 * pace) + 0.3)
  return Math.min(1, syllable * phrase * 0.85)
}

/**
 * The shader orb from Honest UI as the main mark of a voice screen, with the
 * Honest AI waveform under it. Both read the same made-up levels.
 */
export default function VoiceOrbShader() {
  const [turn, setTurn] = React.useState(0)
  const [playing, setPlaying] = React.useState(true)
  const current = script[turn]

  React.useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setTurn((index) => (index + 1) % script.length), current.seconds * 1000)
    return () => window.clearTimeout(timer)
  }, [turn, playing, current.seconds])

  const inputLevel = React.useCallback(() => sampleVoice(performance.now() / 1000, 1), [])
  const outputLevel = React.useCallback(() => sampleVoice(performance.now() / 1000 + 3, 1.25), [])
  const waveformLevel = current.state === "listening" ? inputLevel : current.state === "speaking" ? outputLevel : 0

  return (
    <div className="flex w-full max-w-[24rem] flex-col gap-[var(--hui-space-5)]">
      <div className="flex flex-col items-center gap-[var(--hui-space-4)]">
        <AudioOrb
          state={current.state}
          inputLevel={inputLevel}
          outputLevel={outputLevel}
          size={208}
          paused={!playing}
          announce={false}
        />
        <LiveWaveform
          state={current.state === "thinking" ? "processing" : current.state === "idle" ? "idle" : "active"}
          level={waveformLevel}
          className="h-7 w-40"
          aria-hidden="true"
        />
        <p
          aria-live="polite"
          className="m-0 min-h-[2lh] text-center text-pretty text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [line-height:var(--hui-line-height-regular)]"
        >
          {current.caption}
        </p>
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={() => setPlaying((value) => !value)}>
          {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </Button>
      </div>
    </div>
  )
}
