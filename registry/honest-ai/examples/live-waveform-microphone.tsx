"use client"

import * as React from "react"

import { Button } from "@/registry/default/ui/button"
import { LiveWaveform } from "@/registry/honest-ai/ai/live-waveform"

/**
 * The microphone opens only when the button is pressed, and every track stops
 * when it is pressed again or the preview unmounts. Nothing is recorded.
 */
export default function LiveWaveformMicrophone() {
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream])

  const toggle = async () => {
    if (stream) {
      setStream(null)
      return
    }
    setError(null)
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ audio: true }))
    } catch {
      setError("The microphone is unavailable or was not allowed.")
    }
  }

  return (
    <div className="flex w-full max-w-[30rem] items-center gap-[var(--hui-space-4)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] py-[var(--hui-space-3)] ps-[var(--hui-space-5)] pe-[var(--hui-space-3)] shadow-[var(--hui-shadow-feather)]">
      <div className="min-w-0 flex-1">
        {error ? (
          <p role="alert" className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)]">
            {error}
          </p>
        ) : (
          <LiveWaveform stream={stream} className="h-8" />
        )}
      </div>
      <Button size="sm" variant={stream ? "secondary" : "default"} onClick={toggle}>
        {stream ? "Stop" : "Use microphone"}
      </Button>
    </div>
  )
}
