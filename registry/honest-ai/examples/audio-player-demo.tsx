"use client"

import * as React from "react"

import { AudioPlayer } from "@/registry/honest-ai/ai/audio-player"

const SAMPLE_RATE = 22_050
const SECONDS = 14
const PEAK_COUNT = 96
// A short pentatonic phrase, in hertz, played by soft sine notes that ring into each other.
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 1046.5]

/** Renders a little melody in the browser, so the preview ships no audio file. */
async function renderSample() {
  const context = new OfflineAudioContext(1, SAMPLE_RATE * SECONDS, SAMPLE_RATE)
  NOTES.forEach((frequency, index) => {
    const start = 0.4 + index * 1.1
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = "sine"
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.32 * (0.6 + (index % 3) * 0.2), start + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 2.3)
  })
  const buffer = await context.startRendering()
  const data = buffer.getChannelData(0)

  const peaks: number[] = []
  const bucket = Math.floor(data.length / PEAK_COUNT)
  for (let i = 0; i < PEAK_COUNT; i += 1) {
    let max = 0
    for (let j = i * bucket; j < (i + 1) * bucket; j += 1) max = Math.max(max, Math.abs(data[j]))
    peaks.push(max)
  }
  const loudest = Math.max(...peaks, 0.0001)

  return { url: URL.createObjectURL(toWav(data)), peaks: peaks.map((peak) => peak / loudest) }
}

/** Wraps mono samples in a 16-bit WAV file. */
function toWav(samples: Float32Array) {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2))
  const text = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  text(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, "WAVE")
  text(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true))
  return new Blob([view], { type: "audio/wav" })
}

/** A real `<audio>` element plays a melody rendered in the browser. Its peaks are measured from the same samples. */
export default function AudioPlayerDemo() {
  const [sample, setSample] = React.useState<{ url: string; peaks: number[] } | null>(null)

  React.useEffect(() => {
    let url: string | null = null
    let cancelled = false
    renderSample().then((result) => {
      if (cancelled) return URL.revokeObjectURL(result.url)
      url = result.url
      setSample(result)
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  return (
    <div className="w-full max-w-[30rem]">
      <AudioPlayer
        src={sample?.url}
        peaks={sample?.peaks}
        title="Voice memo · Pricing review"
      />
    </div>
  )
}
