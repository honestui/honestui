"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { cn } from "../../lib/utils.js"

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking"

/** A level from 0 to 1, or a function the orb calls once per frame for one. */
export type VoiceOrbLevel = number | (() => number)

export type VoiceOrbLabels = Record<VoiceOrbState, string>

export const defaultVoiceOrbLabels: VoiceOrbLabels = {
  idle: "Voice assistant ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
}

export type VoiceOrbProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What the assistant is doing. The orb only shows it. */
  state?: VoiceOrbState
  /** The person's loudness, from 0 to 1. Moves the orb while `listening`. */
  inputLevel?: VoiceOrbLevel
  /** The assistant's loudness, from 0 to 1. Moves the orb while `speaking`. */
  outputLevel?: VoiceOrbLevel
  /** Diameter in CSS pixels. */
  size?: number
  /** A CSS color for the orb. Defaults to the text color, so it is monochrome. */
  accent?: string
  /** Set false to keep the state out of the accessibility tree, when your own text already says it. */
  announce?: boolean
  labels?: Partial<VoiceOrbLabels>
}

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0)
const readLevel = (level: VoiceOrbLevel | undefined) =>
  clamp01(typeof level === "function" ? level() : (level ?? 0))

const TAU = Math.PI * 2
const LOBES = 96
const HALO_RINGS = 6

/**
 * A round mark for a voice conversation that shows whose turn it is: it
 * breathes at rest, swells with the person's voice while listening, turns
 * while thinking, and ripples with the reply while speaking.
 */
function VoiceOrb({
  state = "idle",
  inputLevel,
  outputLevel,
  size = 96,
  accent,
  announce = true,
  labels: labelsProp,
  className,
  style,
  ...props
}: VoiceOrbProps) {
  const labels = { ...defaultVoiceOrbLabels, ...labelsProp }
  const shouldReduceMotion = useReducedMotion() ?? false
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const live = React.useRef({ state, inputLevel, outputLevel })
  React.useLayoutEffect(() => {
    live.current = { state, inputLevel, outputLevel }
  })

  React.useEffect(() => {
    if (shouldReduceMotion) return
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)

    let frame = 0
    let last = performance.now()
    let time = 0
    // Eased values, so a jump in level or a change of state never snaps.
    let energy = 0
    let spin = 0
    let thinking = 0

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      time += dt
      const { state: current, inputLevel: input, outputLevel: output } = live.current
      const target = current === "listening" ? readLevel(input) : current === "speaking" ? readLevel(output) : 0
      energy += (target - energy) * Math.min(1, dt * (target > energy ? 14 : 6))
      thinking += ((current === "thinking" ? 1 : 0) - thinking) * Math.min(1, dt * 4)
      spin += dt * (0.25 + thinking * 1.6)

      const ink = getComputedStyle(canvas).color
      const center = size / 2
      // Room is left around the body for the halo and the swell.
      const base = size * 0.34
      const breath = current === "idle" ? Math.sin(time * 1.6) * 0.015 : 0
      const swell = energy * 0.1

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, size, size)

      // The body: a circle whose edge ripples with the level.
      const ripple = current === "speaking" ? 0.09 : 0.06
      context.beginPath()
      for (let i = 0; i <= LOBES; i += 1) {
        const a = (i / LOBES) * TAU
        const wobble =
          Math.sin(a * 3 + time * 2.1 + spin) * 0.6 + Math.sin(a * 5 - time * 2.9) * 0.3 + Math.sin(a * 7 + time * 4.3) * 0.1
        const r = base * (1 + breath + swell + wobble * energy * ripple + wobble * 0.008)
        const x = center + Math.cos(a) * r
        const y = center + Math.sin(a) * r
        if (i === 0) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.closePath()
      context.globalAlpha = 0.92
      context.fillStyle = ink
      context.fill()

      // A soft highlight near the top that drifts a little as the orb turns.
      const hx = center - base * 0.3 + Math.cos(spin) * base * 0.12
      const hy = center - base * 0.38 + Math.sin(spin) * base * 0.12
      const shine = context.createRadialGradient(hx, hy, 0, hx, hy, base * 1.1)
      shine.addColorStop(0, "rgba(255,255,255,0.22)")
      shine.addColorStop(1, "rgba(255,255,255,0)")
      context.globalAlpha = 1
      context.globalCompositeOperation = "source-atop"
      context.fillStyle = shine
      context.fillRect(0, 0, size, size)

      // The halo widens with the voice and fades out, drawn behind the body.
      context.globalCompositeOperation = "destination-over"
      const haloRadius = base * (1.3 + energy * 0.25 + breath)
      // Stacked rings rather than a gradient, so any CSS color fades without parsing it.
      context.fillStyle = ink
      context.globalAlpha = (0.16 + energy * 0.14) / HALO_RINGS
      for (let ring = 1; ring <= HALO_RINGS; ring += 1) {
        context.beginPath()
        context.arc(center, center, base + (haloRadius - base) * (ring / HALO_RINGS), 0, TAU)
        context.fill()
      }
      context.globalCompositeOperation = "source-over"

      // While thinking, an arc travels around the outside.
      if (thinking > 0.01) {
        context.globalAlpha = thinking * 0.9
        context.strokeStyle = ink
        context.lineWidth = Math.max(1.5, size * 0.022)
        context.lineCap = "round"
        context.beginPath()
        const r = base * 1.32
        const startAngle = spin * 2.2
        context.arc(center, center, r, startAngle, startAngle + Math.PI * (0.35 + 0.25 * Math.sin(time * 2)))
        context.stroke()
      }

      context.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [size, shouldReduceMotion])

  return (
    <div
      data-slot="voice-orb"
      data-state={state}
      className={cn("relative inline-flex shrink-0 text-[var(--hui-color-foreground-base-primary)]", className)}
      style={{ width: size, height: size, ...(accent ? { color: accent } : null), ...style }}
      {...props}
    >
      {shouldReduceMotion ? (
        <StateGlyph state={state} size={size} />
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className="block size-full" />
      )}
      {announce ? (
        <span role="status" className="sr-only">
          {labels[state]}
        </span>
      ) : null}
    </div>
  )
}

/** The still picture shown with reduced motion: a disc with a mark for each state. */
function StateGlyph({ state, size }: { state: VoiceOrbState; size: number }) {
  return (
    <svg
      data-slot="voice-orb-glyph"
      aria-hidden="true"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="block"
    >
      <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="50" r="34" fill="currentColor" />
      <g
        stroke="var(--hui-color-background-base-primary)"
        fill="var(--hui-color-background-base-primary)"
        strokeWidth="4"
        strokeLinecap="round"
      >
        {state === "idle" ? <circle cx="50" cy="50" r="5" stroke="none" /> : null}
        {state === "listening" ? (
          <>
            <rect x="44" y="34" width="12" height="20" rx="6" stroke="none" />
            <path d="M38 50a12 12 0 0 0 24 0M50 62v5" fill="none" />
          </>
        ) : null}
        {state === "thinking" ? (
          <>
            <circle cx="38" cy="50" r="3.5" stroke="none" />
            <circle cx="50" cy="50" r="3.5" stroke="none" />
            <circle cx="62" cy="50" r="3.5" stroke="none" />
          </>
        ) : null}
        {state === "speaking" ? <path d="M36 46v8M43 40v20M50 35v30M57 40v20M64 46v8" fill="none" /> : null}
      </g>
    </svg>
  )
}

export { VoiceOrb }
