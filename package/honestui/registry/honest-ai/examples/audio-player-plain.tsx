"use client"

import * as React from "react"

import { AudioPlayer } from "@/registry/honest-ai/ai/audio-player"

const DURATION = 95

/**
 * No audio plays. The player is controlled, and a timer stands in for the
 * audio clock, so the plain scrub bar has something to follow.
 */
export default function AudioPlayerPlain() {
  const [time, setTime] = React.useState(12)
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
    }, 100)
    return () => window.clearInterval(id)
  }, [playing, rate])

  return (
    <div className="w-full max-w-[26rem]">
      <AudioPlayer
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
    </div>
  )
}
