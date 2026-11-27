"use client"

import * as React from "react"

import { AudioPlayer } from "@/registry/honest-ai/ai/audio-player"
import { TranscriptViewer, type TranscriptSegment } from "@/registry/honest-ai/ai/transcript-viewer"

// Sample lines with made-up timings. Word times are spread evenly across each line.
const lines: [speaker: string, start: number, end: number, text: string][] = [
  ["Dana", 0, 4.2, "Thanks for joining. I want to look at why the March invoices were off."],
  ["Assistant", 4.6, 10.4, "Sure. Totals are rounded on every line, so long orders drift by a cent or two."],
  ["Assistant", 10.6, 15.2, "Across March that adds up to about forty dollars, all in the customer's favor."],
  ["Dana", 15.8, 19.6, "That matches what finance saw. Can we round once, at the end?"],
  ["Assistant", 20.2, 26.8, "Yes. Rounding the order total instead of each line removes the drift entirely."],
  ["Assistant", 27, 32.4, "Old invoices keep their totals. Only new ones change, from the next billing run."],
  ["Dana", 33, 37.2, "Good. Who needs to sign off before we ship it?"],
  ["Assistant", 37.8, 43.6, "Finance owns the rounding rule, so Priya should approve the change first."],
  ["Dana", 44.2, 48, "I'll send it to her this afternoon. Anything else we should check?"],
  ["Assistant", 48.6, 55.4, "Run the export on last month's orders and compare the sums. They should match to the cent."],
  ["Dana", 56, 58.8, "Perfect. Let's do that tomorrow morning."],
]

const segments: TranscriptSegment[] = lines.map(([speaker, start, end, text], index) => {
  const tokens = text.split(" ")
  const span = (end - start) / tokens.length
  return {
    id: `s${index}`,
    speaker,
    start,
    end,
    text,
    words: tokens.map((token, i) => ({ text: token, start: start + i * span, end: start + (i + 1) * span })),
  }
})

const DURATION = 60

/**
 * No audio plays. A timer stands in for the player's clock and drives both the
 * player and the transcript, the way a real `<audio>` element's time would.
 */
export default function TranscriptViewerDemo() {
  const [time, setTime] = React.useState(5)
  const [playing, setPlaying] = React.useState(false)
  const [rate, setRate] = React.useState(1)
  const timeRef = React.useRef(time)
  React.useEffect(() => {
    timeRef.current = time
  }, [time])

  React.useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const next = Math.min(DURATION, timeRef.current + ((now - last) / 1000) * rate)
      last = now
      setTime(next)
      if (next >= DURATION) setPlaying(false)
    }, 50)
    return () => window.clearInterval(id)
  }, [playing, rate])

  return (
    <div className="flex w-full max-w-[34rem] flex-col gap-[var(--hui-space-3)]">
      <AudioPlayer
        title="Billing sync · March 14"
        currentTime={time}
        duration={DURATION}
        playing={playing}
        onPlayingChange={(next) => {
          if (next && time >= DURATION) setTime(0)
          setPlaying(next)
        }}
        onSeek={setTime}
        playbackRate={rate}
        onPlaybackRateChange={setRate}
      />
      <TranscriptViewer
        segments={segments}
        currentTime={time}
        onSeek={(seconds) => {
          setTime(seconds)
          setPlaying(true)
        }}
        className="h-[18rem]"
      />
    </div>
  )
}
