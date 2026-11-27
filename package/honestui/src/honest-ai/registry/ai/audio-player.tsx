"use client"

import * as React from "react"
import { Pause as PauseIcon, Play as PlayIcon } from "honestui/icons"

import { cn } from "../../lib/utils.js"
import { Button } from "../../components/ui/button.js"

export type AudioPlayerLabels = {
  play: string
  pause: string
  /** The scrub bar's name. */
  seek: string
  /** The scrub bar's value, such as "0:12 of 1:04". */
  position: (current: string, total: string) => string
  /** The speed button's name, such as "Playback speed, 1.5×". */
  speed: (rate: string) => string
  /** Shown when the audio cannot be loaded. */
  error: string
  /** Formats a playback rate, such as 1.5 as "1.5×". */
  rate: (rate: number) => string
}

export const defaultAudioPlayerLabels: AudioPlayerLabels = {
  play: "Play",
  pause: "Pause",
  seek: "Seek",
  position: (current, total) => `${current} of ${total}`,
  speed: (rate) => `Playback speed, ${rate}`,
  error: "This audio could not be loaded.",
  rate: (rate) => `${rate}×`,
}

/** Formats seconds as m:ss, or h:mm:ss from an hour. */
export function formatAudioTime(seconds: number) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`
}

export type AudioPlayerProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /**
   * A file to play. The player owns an `<audio>` element for it. Leave it out
   * to drive the player yourself with `currentTime`, `duration`, and `playing`.
   */
  src?: string
  /** A line above the scrub bar, such as the recording's name. */
  title?: React.ReactNode
  /** Loudness from 0 to 1 across the file, drawn as the scrub bar. Without it, the bar is plain. */
  peaks?: number[]
  /** Seconds played. Controls the position when there is no `src`. */
  currentTime?: number
  /** Length in seconds. Required when there is no `src`; read from the file otherwise. */
  duration?: number
  /** Whether it is playing. Controls play and pause when there is no `src`. */
  playing?: boolean
  onPlayingChange?: (playing: boolean) => void
  /** Called with the new position in seconds when the person scrubs or seeks. */
  onSeek?: (seconds: number) => void
  /** Called as the owned `<audio>` element plays. */
  onTimeUpdate?: (seconds: number) => void
  playbackRate?: number
  onPlaybackRateChange?: (rate: number) => void
  /** The speeds the speed button steps through, in order. */
  rates?: number[]
  /** Seconds moved by the arrow keys. */
  step?: number
  labels?: Partial<AudioPlayerLabels>
}

const DEFAULT_RATES = [1, 1.25, 1.5, 2, 0.75]
const MAX_BARS = 96

/** Reduces peaks to at most `count` bars, keeping each bucket's loudest value. */
function resample(peaks: number[], count: number) {
  if (peaks.length <= count) return peaks.map(clamp01)
  const out: number[] = []
  const size = peaks.length / count
  for (let i = 0; i < count; i += 1) {
    let max = 0
    for (let j = Math.floor(i * size); j < Math.floor((i + 1) * size); j += 1) max = Math.max(max, peaks[j] ?? 0)
    out.push(clamp01(max))
  }
  return out
}

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0)

/**
 * A compact player for a recording or a spoken reply: play and pause, a scrub
 * bar drawn from the file's loudness, the time, and the speed.
 */
function AudioPlayer({
  src,
  title,
  peaks,
  currentTime: currentTimeProp,
  duration: durationProp,
  playing: playingProp,
  onPlayingChange,
  onSeek,
  onTimeUpdate,
  playbackRate: rateProp,
  onPlaybackRateChange,
  rates = DEFAULT_RATES,
  step = 5,
  labels: labelsProp,
  className,
  ...props
}: AudioPlayerProps) {
  const labels = { ...defaultAudioPlayerLabels, ...labelsProp }
  const owned = src != null
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const [ownTime, setOwnTime] = React.useState(0)
  const [ownDuration, setOwnDuration] = React.useState(0)
  const [ownPlaying, setOwnPlaying] = React.useState(false)
  const [ownRate, setOwnRate] = React.useState(1)
  const [failed, setFailed] = React.useState(false)
  const [scrubTime, setScrubTime] = React.useState<number | null>(null)

  const duration = owned ? ownDuration || (durationProp ?? 0) : (durationProp ?? 0)
  const time = scrubTime ?? (owned ? ownTime : (currentTimeProp ?? 0))
  const playing = owned ? ownPlaying : (playingProp ?? false)
  const rate = rateProp ?? ownRate
  const ratio = duration > 0 ? Math.min(Math.max(time / duration, 0), 1) : 0

  // A new file starts from the beginning, with any old error cleared.
  const [loadedSrc, setLoadedSrc] = React.useState(src)
  if (src !== loadedSrc) {
    setLoadedSrc(src)
    setFailed(false)
    setOwnTime(0)
    setOwnPlaying(false)
  }

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate, src])

  const setPlaying = (next: boolean) => {
    const audio = audioRef.current
    if (owned && audio) {
      if (next) audio.play().catch(() => setOwnPlaying(false))
      else audio.pause()
    }
    onPlayingChange?.(next)
  }

  const seek = (seconds: number) => {
    const next = Math.min(Math.max(seconds, 0), duration || 0)
    if (owned && audioRef.current) {
      audioRef.current.currentTime = next
      setOwnTime(next)
    }
    onSeek?.(next)
  }

  const cycleRate = () => {
    const index = rates.indexOf(rate)
    const next = rates[(index + 1) % rates.length] ?? 1
    setOwnRate(next)
    onPlaybackRateChange?.(next)
  }

  // Scrubbing: the position follows the pointer and is committed on release.
  const trackRef = React.useRef<HTMLDivElement>(null)
  const timeAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * duration
  }
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || duration <= 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus()
    setScrubTime(timeAt(event.clientX))
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scrubTime === null) return
    setScrubTime(timeAt(event.clientX))
  }
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scrubTime === null) return
    seek(timeAt(event.clientX))
    setScrubTime(null)
  }

  const onSliderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => seek(time + step),
      ArrowUp: () => seek(time + step),
      ArrowLeft: () => seek(time - step),
      ArrowDown: () => seek(time - step),
      PageUp: () => seek(time + duration / 10),
      PageDown: () => seek(time - duration / 10),
      Home: () => seek(0),
      End: () => seek(duration),
      " ": () => setPlaying(!playing),
    }
    const action = keys[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  const bars = React.useMemo(() => (peaks && peaks.length > 0 ? resample(peaks, MAX_BARS) : null), [peaks])
  const current = formatAudioTime(time)
  const total = formatAudioTime(duration)

  return (
    <div
      data-slot="audio-player"
      data-playing={playing ? "" : undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-[var(--hui-space-4)] rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] py-[var(--hui-space-3)] ps-[var(--hui-space-3)] pe-[var(--hui-space-4)] shadow-[var(--hui-shadow-feather)]",
        className
      )}
      {...props}
    >
      {owned ? (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(event) => setOwnDuration(event.currentTarget.duration)}
          onDurationChange={(event) => setOwnDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => {
            setOwnTime(event.currentTarget.currentTime)
            onTimeUpdate?.(event.currentTarget.currentTime)
          }}
          onPlay={() => setOwnPlaying(true)}
          onPause={() => setOwnPlaying(false)}
          onEnded={() => {
            setOwnPlaying(false)
            onPlayingChange?.(false)
          }}
          onError={() => setFailed(true)}
        />
      ) : null}

      <Button
        data-slot="audio-player-toggle"
        variant="secondary"
        size="icon"
        className="shrink-0 rounded-full"
        aria-label={playing ? labels.pause : labels.play}
        disabled={failed || (!owned && duration <= 0)}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
      </Button>

      <div className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-1)]">
        {title ? (
          <p
            data-slot="audio-player-title"
            className="m-0 truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [line-height:20px]"
          >
            {title}
          </p>
        ) : null}
        {failed ? (
          <p
            role="alert"
            className="m-0 text-[var(--hui-color-foreground-danger-primary)] [font-size:var(--hui-font-size-small)]"
          >
            {labels.error}
          </p>
        ) : (
          <div
            ref={trackRef}
            data-slot="audio-player-scrub"
            role="slider"
            tabIndex={duration > 0 ? 0 : -1}
            aria-label={labels.seek}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={labels.position(current, total)}
            aria-disabled={duration <= 0 || undefined}
            onKeyDown={onSliderKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setScrubTime(null)}
            className={cn(
              "group/scrub relative flex w-full cursor-pointer touch-none items-center rounded-[var(--hui-radius-1)] outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--hui-color-border-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hui-color-background-base-primary)] aria-disabled:cursor-default",
              bars ? "h-8" : "h-5"
            )}
          >
            {bars ? (
              <Peaks bars={bars} ratio={ratio} />
            ) : (
              <span className="relative h-1 w-full overflow-hidden rounded-full bg-[var(--hui-color-background-neutral-secondary)]">
                <span
                  className="absolute inset-y-0 start-0 rounded-full bg-[var(--hui-color-foreground-base-primary)]"
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
            )}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hui-color-foreground-base-primary)] transition-opacity",
                bars ? "h-full w-[2px] opacity-0 group-hover/scrub:opacity-100 group-focus-visible/scrub:opacity-100" : "size-3"
              )}
              style={{ left: `${ratio * 100}%` }}
            />
          </div>
        )}
      </div>

      <span
        data-slot="audio-player-time"
        className="shrink-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] tabular-nums"
      >
        <span aria-hidden="true">
          <span className="text-[var(--hui-color-foreground-base-primary)]">{current}</span>
          {" / "}
          {total}
        </span>
        <span className="sr-only">{labels.position(current, total)}</span>
      </span>

      <Button
        data-slot="audio-player-speed"
        variant="ghost"
        size="sm"
        className="min-w-11 shrink-0 tabular-nums"
        aria-label={labels.speed(labels.rate(rate))}
        onClick={cycleRate}
      >
        {labels.rate(rate)}
      </Button>
    </div>
  )
}

/** The scrub bar's waveform: played bars in the text color, the rest muted. */
function Peaks({ bars, ratio }: { bars: number[]; ratio: number }) {
  const played = ratio * bars.length
  return (
    <span aria-hidden="true" data-slot="audio-player-peaks" className="flex size-full items-center gap-[2px]">
      {bars.map((peak, index) => (
        <span
          key={index}
          className={cn(
            "min-w-[1px] flex-1 rounded-full transition-colors duration-150",
            index < played
              ? "bg-[var(--hui-color-foreground-base-primary)]"
              : "bg-[var(--hui-color-background-neutral-tertiary)] opacity-45"
          )}
          style={{ height: `${Math.max(12, peak * 100)}%` }}
        />
      ))}
    </span>
  )
}

export { AudioPlayer }
