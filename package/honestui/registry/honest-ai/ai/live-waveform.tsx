"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

export type LiveWaveformState = "idle" | "active" | "processing"

export type LiveWaveformVariant = "bars" | "line"

/** A level from 0 to 1, or a function the waveform calls once per frame for one. */
export type LiveWaveformLevel = number | (() => number)

export type LiveWaveformLabels = {
  idle: string
  active: string
  processing: string
}

export const defaultLiveWaveformLabels: LiveWaveformLabels = {
  idle: "Audio waveform, silent",
  active: "Audio waveform, live",
  processing: "Audio waveform, processing",
}

export type LiveWaveformProps = Omit<React.ComponentProps<"div">, "children"> & {
  /**
   * What the waveform shows. `idle` is a flat line, `active` follows the
   * source, and `processing` is a slow shimmer while audio is being handled.
   * Defaults to `active` when a source is given and `idle` otherwise.
   */
  state?: LiveWaveformState
  /** A microphone or other stream. The waveform opens its own analyser and closes it on unmount. */
  stream?: MediaStream | null
  /** An analyser you already own. It takes precedence over `stream`, and is never closed here. */
  analyser?: AnalyserNode | null
  /** A level to draw when there is no stream or analyser. */
  level?: LiveWaveformLevel
  /** Scrolling bars of recent loudness, or a line of the current samples. */
  variant?: LiveWaveformVariant
  /** Width of one bar in CSS pixels. */
  barWidth?: number
  /** Space between bars in CSS pixels. */
  barGap?: number
  /** Multiplies the measured level before it is drawn. */
  sensitivity?: number
  labels?: Partial<LiveWaveformLabels>
}

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0)
const readLevel = (level: LiveWaveformLevel | undefined) =>
  clamp01(typeof level === "function" ? level() : (level ?? 0))

// New bars enter about this often, so the history moves at a readable pace.
const SAMPLE_MS = 45
const REDUCED_SAMPLE_MS = 250

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

/**
 * A stream gets its own context and analyser, which close when the stream
 * changes or the waveform unmounts. The frame loop reads the ref directly.
 */
function useStreamAnalyser(stream: MediaStream | null | undefined, skip: boolean) {
  const ref = React.useRef<AnalyserNode | null>(null)

  React.useEffect(() => {
    if (skip || !stream) return
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const source = context.createMediaStreamSource(stream)
    const node = context.createAnalyser()
    node.fftSize = 1024
    node.smoothingTimeConstant = 0.6
    source.connect(node)
    ref.current = node
    return () => {
      source.disconnect()
      ref.current = null
      void context.close()
    }
  }, [stream, skip])

  return ref
}

/**
 * A live picture of audio: bars of recent loudness that scroll in from the
 * right, or a line of the current samples. Feed it a `stream`, an `analyser`,
 * or a `level`. It records nothing and asks for no microphone itself.
 */
function LiveWaveform({
  state: stateProp,
  stream,
  analyser: analyserProp,
  level,
  variant = "bars",
  barWidth = 3,
  barGap = 2,
  sensitivity = 1,
  labels: labelsProp,
  className,
  style,
  ...props
}: LiveWaveformProps) {
  const labels = { ...defaultLiveWaveformLabels, ...labelsProp }
  const streamAnalyser = useStreamAnalyser(stream, analyserProp != null)
  const hasSource = analyserProp != null || stream != null || level != null
  const state: LiveWaveformState = stateProp ?? (hasSource ? "active" : "idle")
  const shouldReduceMotion = useReducedMotion() ?? false

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  // The latest props, read inside the frame loop without restarting it.
  const live = React.useRef({ level, analyser: analyserProp, sensitivity })
  React.useLayoutEffect(() => {
    live.current = { level, analyser: analyserProp, sensitivity }
  })

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    let width = 0
    let height = 0
    let dpr = 1
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = window.devicePixelRatio || 1
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
    }
    resize()

    let samples: Float32Array<ArrayBuffer> = new Float32Array(1024)
    const measure = () => {
      const { level: levelNow, sensitivity: gain } = live.current
      const node = live.current.analyser ?? streamAnalyser.current
      if (node) {
        if (samples.length !== node.fftSize) samples = new Float32Array(node.fftSize)
        node.getFloatTimeDomainData(samples)
        let sum = 0
        for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i]
        // Speech RMS sits well under 0.3, so scale it into a usable range.
        return clamp01(Math.sqrt(sum / samples.length) * 3.2 * gain)
      }
      return clamp01(readLevel(levelNow) * gain)
    }

    const history: number[] = []
    let lastSample = 0
    let frame = 0
    const start = performance.now()

    const draw = (now: number) => {
      // Colors come from CSS on every frame, so the drawing follows the theme.
      const computed = getComputedStyle(canvas)
      const ink = computed.color
      const step = barWidth + barGap
      const count = Math.max(1, Math.floor((width + barGap) / step))
      const mid = height / 2
      const minBar = Math.min(2, height)

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      context.fillStyle = ink
      context.strokeStyle = ink

      if (state === "active" && now - lastSample >= (shouldReduceMotion ? REDUCED_SAMPLE_MS : SAMPLE_MS)) {
        lastSample = now
        history.push(measure())
        if (history.length > count) history.splice(0, history.length - count)
      }

      const bar = (index: number, value: number, alpha: number) => {
        const h = Math.max(minBar, value * height)
        const x = width - (count - index) * step + barGap
        context.globalAlpha = alpha
        context.beginPath()
        context.roundRect(x, mid - h / 2, barWidth, h, barWidth / 2)
        context.fill()
      }

      if (state === "processing") {
        const t = (now - start) / 1000
        for (let i = 0; i < count; i += 1) {
          const phase = i / count
          // A soft crest that travels left to right; static with reduced motion.
          const crest = shouldReduceMotion ? 0.5 : 0.5 + 0.5 * Math.cos((phase - ((t * 0.6) % 1.4) + 0.2) * Math.PI * 4)
          const wave = shouldReduceMotion ? 0 : Math.max(0, crest)
          bar(i, 0.12 + 0.18 * wave * Math.sin(phase * Math.PI), 0.28 + 0.5 * wave)
        }
      } else if (state === "idle") {
        context.globalAlpha = 0.35
        context.fillRect(0, mid - 0.5, width, 1)
      } else if (variant === "line") {
        context.globalAlpha = 1
        context.lineWidth = 1.5
        context.lineJoin = "round"
        context.beginPath()
        const node = live.current.analyser ?? streamAnalyser.current
        const points = Math.max(2, Math.floor(width / 3))
        const t = (now - start) / 1000
        const levelNow = history.at(-1) ?? 0
        for (let i = 0; i < points; i += 1) {
          const x = (i / (points - 1)) * width
          let y: number
          if (node && !shouldReduceMotion) {
            const sample = samples[Math.floor((i / points) * samples.length)] ?? 0
            y = mid + clamp(sample * 2.4 * live.current.sensitivity, -1, 1) * (mid - 1)
          } else {
            // A level alone has no samples, so draw a calm wave of that size.
            const p = i / (points - 1)
            const envelope = Math.sin(p * Math.PI)
            const motion = shouldReduceMotion ? 0 : t
            const wave = Math.sin(p * 18 + motion * 7) * 0.7 + Math.sin(p * 41 - motion * 11) * 0.3
            y = mid + wave * envelope * levelNow * (mid - 1)
          }
          if (i === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.stroke()
      } else {
        const offset = count - history.length
        for (let i = 0; i < count; i += 1) {
          const value = i < offset ? 0 : history[i - offset]
          bar(i, value, i < offset ? 0.3 : 1)
        }
      }

      context.globalAlpha = 1
      if (state !== "idle" && !(shouldReduceMotion && state === "processing")) frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    // A static picture still has to follow a resize or a theme change.
    const redraw = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    const sizeObserver = new ResizeObserver(() => {
      resize()
      redraw()
    })
    sizeObserver.observe(canvas)
    const themeObserver = new MutationObserver(redraw)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] })

    return () => {
      cancelAnimationFrame(frame)
      sizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [state, variant, barWidth, barGap, shouldReduceMotion, streamAnalyser])

  return (
    <div
      data-slot="live-waveform"
      data-state={state}
      data-variant={variant}
      role="img"
      aria-label={labels[state]}
      className={cn("relative h-10 w-full min-w-0 text-[var(--hui-color-foreground-base-primary)]", className)}
      style={style}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />
    </div>
  )
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export { LiveWaveform }
