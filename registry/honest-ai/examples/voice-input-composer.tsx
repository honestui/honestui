"use client"

import * as React from "react"
import { ArrowUp as ArrowUpIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  useVoiceRecorder,
  VoiceInput,
  type VoiceInputState,
} from "@/registry/honest-ai/ai/voice-input"

const SAMPLE_TRANSCRIPT = "Which suppliers have orders due this week?"

/**
 * Voice input in a composer's toolbar. By default it is simulated. "Try with
 * your microphone" switches to useVoiceRecorder, which asks for access only
 * then; the recording stays in the page, since transcription is your app's step.
 */
export default function VoiceInputComposer() {
  const [useMic, setUseMic] = React.useState(false)
  const [text, setText] = React.useState("")
  const [simState, setSimState] = React.useState<VoiceInputState>("idle")
  const [simLevel, setSimLevel] = React.useState(0)
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null)
  const [transcribing, setTranscribing] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)

  const recorder = useVoiceRecorder({
    onRecorded: (blob) => {
      setTranscribing(true)
      setRecordingUrl(URL.createObjectURL(blob))
      // Where your app would send the blob to a transcription service.
      timer.current = window.setTimeout(() => setTranscribing(false), 600)
    },
  })

  React.useEffect(() => {
    if (simState !== "recording") return
    const started = performance.now()
    const interval = window.setInterval(() => {
      const t = (performance.now() - started) / 1000
      setSimLevel(Math.min(1, 0.1 + Math.max(0, Math.sin(t * 8) * Math.sin(t * 1.7)) * 0.8 + Math.random() * 0.1))
    }, 60)
    return () => window.clearInterval(interval)
  }, [simState])

  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  React.useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
  }, [recordingUrl])

  const micState: VoiceInputState =
    recorder.state === "error" ? "error" : transcribing ? "transcribing" : recorder.state
  const state = useMic ? micState : simState

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)]">
      <div className="flex min-w-0 flex-col gap-[var(--hui-space-3)] rounded-[var(--hui-radius-5)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-[var(--hui-space-4)] shadow-[var(--hui-shadow-soft)]">
        <textarea
          aria-label="Message"
          rows={2}
          value={text}
          placeholder="Ask about your orders"
          onChange={(event) => setText(event.target.value)}
          className="w-full resize-none border-0 bg-transparent px-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] outline-none placeholder:text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-regular)] [line-height:20px]"
        />
        <div className="flex min-w-0 items-center justify-end gap-[var(--hui-space-2)]">
          <VoiceInput
            size="compact"
            state={state}
            level={useMic ? recorder.level : simLevel}
            elapsed={useMic ? recorder.elapsed : undefined}
            message={useMic && recorder.error ? recorder.error.message : undefined}
            onStart={() => {
              if (useMic) {
                void recorder.start()
                return
              }
              setSimState("recording")
            }}
            onStop={() => {
              if (useMic) {
                recorder.stop()
                return
              }
              setSimState("transcribing")
              timer.current = window.setTimeout(() => {
                setSimState("idle")
                setText((current) => (current ? `${current} ${SAMPLE_TRANSCRIPT}` : SAMPLE_TRANSCRIPT))
              }, 1200)
            }}
            onCancel={() => (useMic ? recorder.cancel() : setSimState("idle"))}
          />
          <Button size="sm" aria-label="Send" disabled={!text.trim()} className="size-8 min-h-8 rounded-full p-0">
            <ArrowUpIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-[var(--hui-space-4)]">
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={useMic}
          disabled={state === "recording" || state === "requesting"}
          onClick={() => setUseMic((current) => !current)}
        >
          {useMic ? "Back to the simulation" : "Try with your microphone"}
        </Button>
        {useMic && recordingUrl && (
          // The recording, so you can hear what useVoiceRecorder captured.
          <audio controls src={recordingUrl} aria-label="Your recording" className="h-8 max-w-full" />
        )}
      </div>
    </div>
  )
}
