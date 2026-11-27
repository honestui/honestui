"use client"

import * as React from "react"
import {
  Check as CheckIcon,
  CircleAlert as CircleAlertIcon,
  LoaderCircle as LoaderCircleIcon,
  Mic as MicIcon,
  Square as StopIcon,
  X as XIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export type VoiceInputState = "idle" | "requesting" | "recording" | "transcribing" | "done" | "error"

export type VoiceInputLabels = {
  group: string
  start: string
  stop: string
  cancel: string
  retry: string
  idle: string
  requesting: string
  recording: string
  transcribing: string
  done: string
  error: string
}

export const defaultVoiceInputLabels: VoiceInputLabels = {
  group: "Voice input",
  start: "Start voice input",
  stop: "Stop recording",
  cancel: "Cancel recording",
  retry: "Try again",
  idle: "Tap to speak",
  requesting: "Waiting for microphone access",
  recording: "Listening",
  transcribing: "Transcribing",
  done: "Added to your message",
  error: "The microphone isn't available",
}

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:var(--hui-line-height-regular)]"

/** m:ss, with hours when a recording runs that long. */
function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = String(total % 60).padStart(2, "0")
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`
}

/* -------------------------------------------------------------------------- */
/* Audio level                                                                 */
/* -------------------------------------------------------------------------- */

type AudioContextConstructor = typeof AudioContext

function getAudioContext(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  )
}

/**
 * The loudness of a stream, 0 to 1, read with Web Audio. Returns 0 without a
 * stream. Nothing is recorded or sent anywhere.
 */
export function useStreamLevel(stream: MediaStream | null | undefined) {
  const [level, setLevel] = React.useState(0)

  React.useEffect(() => {
    const Context = getAudioContext()
    if (!stream || !Context || stream.getAudioTracks().length === 0) return

    const context = new Context()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.6
    source.connect(analyser)
    const samples = new Uint8Array(analyser.fftSize)
    let frame = 0
    let smoothed = 0

    const tick = () => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (const sample of samples) {
        const centered = (sample - 128) / 128
        sum += centered * centered
      }
      // Speech sits low in RMS terms; the curve lifts it into a readable range.
      const rms = Math.sqrt(sum / samples.length)
      const next = Math.min(1, Math.pow(rms * 3.2, 0.7))
      smoothed = smoothed * 0.65 + next * 0.35
      setLevel(smoothed)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      source.disconnect()
      void context.close()
      setLevel(0)
    }
  }, [stream])

  return stream ? level : 0
}

/* -------------------------------------------------------------------------- */
/* Recorder hook                                                               */
/* -------------------------------------------------------------------------- */

export type VoiceRecorderState = "idle" | "requesting" | "recording" | "error"

export type UseVoiceRecorderOptions = {
  /** Called with the recording when it stops. Send it to your transcription service. */
  onRecorded?: (blob: Blob) => void
  /** Preferred container, such as "audio/webm". The browser's default otherwise. */
  mimeType?: string
  /** Passed to getUserMedia. */
  constraints?: MediaTrackConstraints
}

export type UseVoiceRecorderResult = {
  state: VoiceRecorderState
  /** Loudness while recording, 0 to 1. */
  level: number
  /** Milliseconds since recording started. */
  elapsed: number
  /** The last finished recording. */
  blob: Blob | null
  error: Error | null
  stream: MediaStream | null
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
}

/**
 * Microphone recording with getUserMedia and MediaRecorder. Nothing happens
 * until you call start, so the browser asks for the microphone only then.
 */
export function useVoiceRecorder({
  onRecorded,
  mimeType,
  constraints,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderResult {
  const [state, setState] = React.useState<VoiceRecorderState>("idle")
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [elapsed, setElapsed] = React.useState(0)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const discardRef = React.useRef(false)
  const startedAt = React.useRef(0)
  const onRecordedRef = React.useRef(onRecorded)
  React.useEffect(() => {
    onRecordedRef.current = onRecorded
  }, [onRecorded])

  const level = useStreamLevel(state === "recording" ? stream : null)

  React.useEffect(() => {
    if (state !== "recording") return
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 250)
    return () => window.clearInterval(timer)
  }, [state])

  const release = React.useCallback((current: MediaStream | null) => {
    current?.getTracks().forEach((track) => track.stop())
    setStream(null)
  }, [])

  const start = React.useCallback(async () => {
    if (recorderRef.current) return
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(new Error("Recording is not supported in this browser."))
      setState("error")
      return
    }

    setError(null)
    setState("requesting")
    let media: MediaStream
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: constraints ?? true })
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)))
      setState("error")
      return
    }

    const type = mimeType && MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined
    const recorder = new MediaRecorder(media, type ? { mimeType: type } : undefined)
    const chunks: Blob[] = []
    discardRef.current = false
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      recorderRef.current = null
      release(media)
      setState("idle")
      if (discardRef.current) return
      const recording = new Blob(chunks, { type: recorder.mimeType || type || "audio/webm" })
      setBlob(recording)
      onRecordedRef.current?.(recording)
    }

    recorderRef.current = recorder
    startedAt.current = Date.now()
    setElapsed(0)
    setStream(media)
    recorder.start()
    setState("recording")
  }, [constraints, mimeType, release])

  const stop = React.useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }, [])

  const cancel = React.useCallback(() => {
    discardRef.current = true
    stop()
  }, [stop])

  // Let go of the microphone if the component goes away mid-recording.
  React.useEffect(
    () => () => {
      discardRef.current = true
      const recorder = recorderRef.current
      if (recorder?.state === "recording") recorder.stop()
      recorder?.stream.getTracks().forEach((track) => track.stop())
    },
    []
  )

  return { state, level, elapsed, blob, error, stream, start, stop, cancel }
}

/* -------------------------------------------------------------------------- */
/* Level bars                                                                  */
/* -------------------------------------------------------------------------- */

/** Samples the level at a steady pace, so the bars scroll at the same speed however often it changes. */
function useLevelHistory(level: number, count: number, active: boolean) {
  const [history, setHistory] = React.useState<number[]>(() => Array(count).fill(0))
  const latest = React.useRef(level)
  React.useEffect(() => {
    latest.current = level
  }, [level])

  React.useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => {
      setHistory((current) => [...current.slice(-(count - 1)), latest.current])
    }, 70)
    return () => {
      window.clearInterval(timer)
      setHistory(Array(count).fill(0))
    }
  }, [active, count])

  return history.length === count ? history : Array<number>(count).fill(0)
}

function LevelBars({ levels, className }: { levels: number[]; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="voice-input-meter"
      className={cn("flex h-6 min-w-0 items-center gap-[2px]", className)}
    >
      {levels.map((value, index) => (
        <span
          key={index}
          className="w-[2px] shrink-0 rounded-full bg-[var(--hui-color-foreground-base-secondary)]"
          style={{ height: `${Math.round(12 + Math.min(1, Math.max(0, value)) * 88)}%` }}
        />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Voice input                                                                 */
/* -------------------------------------------------------------------------- */

export type VoiceInputProps = Omit<React.ComponentProps<"div">, "children"> & {
  state: VoiceInputState
  /** Loudness 0 to 1 while recording. Takes precedence over stream. */
  level?: number
  /** A live stream to read the level from, when you don't pass level. */
  stream?: MediaStream | null
  /** Milliseconds recorded. Counted from the start of recording when you leave it out. */
  elapsed?: number
  /** Replaces the status line, such as the reason recording failed. */
  message?: string
  /** "compact" fits a composer's toolbar. "default" stands on its own. */
  size?: "default" | "compact"
  onStart?: () => void
  onStop?: () => void
  onCancel?: () => void
  disabled?: boolean
  labels?: Partial<VoiceInputLabels>
}

/**
 * A microphone control: start, a level meter and timer while listening, then
 * transcribing and done. It shows the state you pass; recording and
 * transcription are your app's work, or use useVoiceRecorder for the first.
 */
function VoiceInput({
  state,
  level: levelProp,
  stream,
  elapsed: elapsedProp,
  message,
  size = "default",
  onStart,
  onStop,
  onCancel,
  disabled,
  labels: labelsProp,
  className,
  ...props
}: VoiceInputProps) {
  const labels = React.useMemo(() => ({ ...defaultVoiceInputLabels, ...labelsProp }), [labelsProp])
  const recording = state === "recording"
  const streamLevel = useStreamLevel(levelProp === undefined && recording ? stream : null)
  const level = levelProp ?? streamLevel
  const compact = size === "compact"
  const history = useLevelHistory(level, compact ? 14 : 36, recording)

  // An internal clock for when the app does not count.
  const [ownElapsed, setOwnElapsed] = React.useState(0)
  React.useEffect(() => {
    if (!recording || elapsedProp !== undefined) return
    const startedAt = Date.now()
    const timer = window.setInterval(() => setOwnElapsed(Date.now() - startedAt), 250)
    return () => {
      window.clearInterval(timer)
      setOwnElapsed(0)
    }
  }, [recording, elapsedProp])
  const elapsed = elapsedProp ?? ownElapsed

  const status = message ?? labels[state]

  // Focus follows the control that replaces the one pressed, but only after a
  // press here, so state changes from elsewhere never pull focus in.
  const rootRef = React.useRef<HTMLDivElement>(null)
  const followFocus = React.useRef(false)
  const press = (handler?: () => void) => () => {
    followFocus.current = true
    handler?.()
  }
  React.useEffect(() => {
    if (!followFocus.current) return
    const slot = state === "recording" ? "voice-input-stop" : "voice-input-start"
    const target = rootRef.current?.querySelector<HTMLButtonElement>(`[data-slot="${slot}"]`)
    if (target && !target.disabled) {
      target.focus()
      followFocus.current = false
    }
  }, [state])

  React.useEffect(() => {
    if (!recording) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && rootRef.current?.contains(document.activeElement)) {
        followFocus.current = true
        onCancel?.()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [recording, onCancel])

  const startButton = (
    <Button
      variant={compact ? "ghost" : "secondary"}
      size={compact ? "sm" : "default"}
      data-slot="voice-input-start"
      aria-label={state === "error" ? labels.retry : labels.start}
      disabled={disabled || state === "requesting" || state === "transcribing"}
      onClick={press(onStart)}
      className={cn(
        "shrink-0 rounded-full",
        compact ? "size-8 min-h-8 p-0" : "size-14 min-h-14 p-0 [&_svg]:size-5!"
      )}
    >
      {state === "requesting" || state === "transcribing" ? (
        <LoaderCircleIcon aria-hidden="true" className="motion-safe:animate-spin" />
      ) : (
        <MicIcon aria-hidden="true" />
      )}
    </Button>
  )

  const cancelButton = (
    <Button
      variant="ghost"
      size="sm"
      data-slot="voice-input-cancel"
      aria-label={labels.cancel}
      onClick={press(onCancel)}
      className="size-8 min-h-8 shrink-0 rounded-full p-0 text-[var(--hui-color-foreground-base-secondary)]"
    >
      <XIcon aria-hidden="true" />
    </Button>
  )

  const stopButton = (
    <Button
      variant="default"
      size="sm"
      data-slot="voice-input-stop"
      aria-label={labels.stop}
      onClick={press(onStop)}
      className="size-8 min-h-8 shrink-0 rounded-full p-0"
    >
      <StopIcon aria-hidden="true" className="size-3! fill-current" />
    </Button>
  )

  const timer = (
    <span
      role="timer"
      aria-label={formatElapsed(elapsed)}
      data-slot="voice-input-elapsed"
      className={cn("shrink-0 tabular-nums text-[var(--hui-color-foreground-base-primary)]", metaText)}
    >
      {formatElapsed(elapsed)}
    </span>
  )

  const statusIcon =
    state === "done" ? (
      <CheckIcon aria-hidden="true" className="size-3.5 shrink-0" />
    ) : state === "error" ? (
      <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]" />
    ) : null

  if (compact) {
    return (
      <div
        ref={rootRef}
        role="group"
        aria-label={labels.group}
        data-slot="voice-input"
        data-state={state}
        data-size="compact"
        className={cn(
          "inline-flex min-w-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-secondary)]",
          recording &&
            "rounded-full border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] py-[2px] ps-[2px] pe-[var(--hui-space-2)] shadow-[var(--hui-shadow-feather)]",
          className
        )}
        {...props}
      >
        {recording ? (
          <>
            {cancelButton}
            <LevelBars levels={history} className="h-4 px-[var(--hui-space-2)]" />
            {timer}
            {stopButton}
          </>
        ) : (
          <>
            {(state === "transcribing" || state === "error" || state === "requesting") && (
              <span className={cn("inline-flex min-w-0 items-center gap-[var(--hui-space-2)] ps-[var(--hui-space-2)]", metaText)}>
                {statusIcon}
                <span className="truncate">{status}</span>
              </span>
            )}
            {startButton}
          </>
        )}
        <span aria-live="polite" className="sr-only">
          {state === "idle" ? "" : status}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={labels.group}
      data-slot="voice-input"
      data-state={state}
      data-size="default"
      className={cn(
        "flex w-full min-w-0 flex-col items-center gap-[var(--hui-space-5)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-6)] py-[var(--hui-space-7)] text-[var(--hui-color-foreground-base-primary)] shadow-[var(--hui-shadow-feather)]",
        rowText,
        className
      )}
      {...props}
    >
      <div className="flex h-14 w-full min-w-0 items-center justify-center">
        {recording ? (
          <div className="flex w-full min-w-0 items-center justify-center gap-[var(--hui-space-4)]">
            {cancelButton}
            <LevelBars levels={history} className="h-8 justify-center" />
            {stopButton}
          </div>
        ) : (
          <span className="relative inline-flex">
            {/* A soft halo while the browser asks, so the wait reads as the app's, not a hang. */}
            {state === "requesting" && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[var(--hui-color-background-neutral-secondary)] motion-safe:animate-ping"
              />
            )}
            {startButton}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col items-center gap-[var(--hui-space-1)] text-center">
        <p
          aria-live="polite"
          data-slot="voice-input-status"
          className={cn(
            "m-0 inline-flex min-w-0 items-center gap-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]",
            state === "error" && "text-[var(--hui-color-foreground-base-primary)]"
          )}
        >
          {statusIcon}
          <span className="min-w-0">{status}</span>
        </p>
        <p className={cn("m-0 h-4 text-[var(--hui-color-foreground-base-secondary)] tabular-nums", metaText)}>
          {recording ? timer : state === "error" && onStart ? labels.retry : null}
        </p>
      </div>
    </div>
  )
}

export { VoiceInput }
