"use client"

import { useEffect, useRef } from "react"

/**
 * React Bits style VariableProximity: each letter's weight follows the
 * pointer's distance. Geist is a variable font, so this interpolates the real
 * `wght` axis instead of swapping faces. The text stays one accessible string.
 */
export function VariableProximity({
  text,
  className,
  radius = 260,
  from = 200,
  to = 800,
}: {
  text: string
  className?: string
  radius?: number
  from?: number
  to?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!window.matchMedia("(hover: hover)").matches) return
    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-letter]"))
    const current = letters.map(() => from)
    let px = -9999
    let py = -9999
    let raf = 0

    const tick = () => {
      let moving = false
      letters.forEach((letter, i) => {
        const r = letter.getBoundingClientRect()
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2))
        const t = Math.max(0, 1 - d / radius)
        const target = from + (to - from) * t * t
        current[i] += (target - current[i]) * 0.2
        if (Math.abs(target - current[i]) > 0.5) moving = true
        letter.style.fontVariationSettings = `"wght" ${current[i].toFixed(0)}`
      })
      raf = moving ? requestAnimationFrame(tick) : 0
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
    }
  }, [from, to, radius])

  return (
    <span aria-label={text} className={className} ref={ref} role="img">
      {text.split("").map((char, i) => (
        <span
          aria-hidden="true"
          data-letter=""
          key={i}
          style={{ fontVariationSettings: `"wght" ${from}`, display: "inline-block", whiteSpace: "pre" }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
