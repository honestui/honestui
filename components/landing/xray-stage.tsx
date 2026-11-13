"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"

import { gsap, useGSAP } from "@/components/landing/gsap"
import styles from "@/components/landing/landing.module.css"

const LENS_RADIUS = 150
const FULL_RADIUS = 2600

type Readout = { name: string; size: string; role: string | null }

const TAG_NAMES: Record<string, string> = {
  BUTTON: "<button>",
  INPUT: "<input>",
  SELECT: "<select>",
  TEXTAREA: "<textarea>",
  LABEL: "<Label>",
  H3: "<CardTitle>",
  LEGEND: "<legend>",
  UL: "<ul>",
  LI: "<li>",
}

// Names the closest meaningful element under the pointer: an annotated card,
// a component slot, or a native control. This is what the lens "reads".
function describe(target: Element | null): Readout | null {
  let node: Element | null = target
  while (node && node instanceof HTMLElement) {
    const tag = TAG_NAMES[node.tagName]
    const slot = node.dataset.slot
    if (tag || slot || node.dataset.xray) {
      const rect = node.getBoundingClientRect()
      const name = tag
        ? tag
        : slot
          ? `<${slot.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase())}>`
          : (node.dataset.xray ?? "").split(" · ")[0]
      return {
        name,
        size: `${Math.round(rect.width)}×${Math.round(rect.height)}`,
        role: node.getAttribute("role") ?? node.getAttribute("type"),
      }
    }
    node = node.parentElement
  }
  return null
}

type XrayContext = {
  locked: boolean
  setLocked: (locked: boolean) => void
  toggleRef: RefObject<(() => void) | null>
}

const Context = createContext<XrayContext | null>(null)

function useXray() {
  const value = useContext(Context)
  if (!value) throw new Error("X-ray parts must be inside <XrayProvider>")
  return value
}

/** Lets the toggle live in the hero copy, away from the stage it controls. */
export function XrayProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false)
  const toggleRef = useRef<(() => void) | null>(null)
  const value = useMemo(() => ({ locked, setLocked, toggleRef }), [locked])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function XrayToggle() {
  const { locked, toggleRef } = useXray()
  return (
    <div className={styles.xrayControls}>
      <button
        aria-pressed={locked}
        className={styles.xrayToggle}
        onClick={() => toggleRef.current?.()}
        type="button"
      >
        <span aria-hidden="true" className={styles.xrayToggleDot} />
        {locked ? "Show the interface" : "See the structure"}
      </button>
      <p aria-hidden="true" className={styles.xrayHint} data-hidden={locked || undefined}>
        or point at any component
      </p>
    </div>
  )
}

export function XrayStage({
  live,
  xray,
  className,
}: {
  live: ReactNode
  xray: ReactNode
  className?: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [readout, setReadout] = useState<Readout | null>(null)
  const { locked, setLocked, toggleRef } = useXray()
  const lockedRef = useRef(false)
  const movers = useRef<{
    x?: gsap.QuickToFunc
    y?: gsap.QuickToFunc
    rx?: gsap.QuickToFunc
    ry?: gsap.QuickToFunc
  }>({})
  const frame = useRef(0)

  useGSAP(
    () => {
      const stage = stageRef.current
      const ring = ringRef.current
      if (!stage || !ring) return
      gsap.set(stage, { "--lx": "50%", "--ly": "40%", "--lr": "0px" })
      movers.current = {
        x: gsap.quickTo(stage, "--lx", { duration: 0.45, ease: "power3", unit: "px" }),
        y: gsap.quickTo(stage, "--ly", { duration: 0.45, ease: "power3", unit: "px" }),
        rx: gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }),
        ry: gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" }),
      }
    },
    { scope: stageRef },
  )

  const setRadius = useCallback((radius: number, duration = 0.6) => {
    const stage = stageRef.current
    if (!stage) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    gsap.to(stage, {
      "--lr": `${radius}px`,
      duration: reduce ? 0 : duration,
      ease: radius > LENS_RADIUS ? "power3.inOut" : "expo.out",
      overwrite: "auto",
    })
    gsap.to(ringRef.current, {
      opacity: radius === LENS_RADIUS ? 1 : 0,
      scale: radius === LENS_RADIUS ? 1 : 0.6,
      duration: reduce ? 0 : 0.35,
    })
  }, [])

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || lockedRef.current) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    movers.current.x?.(x)
    movers.current.y?.(y)
    movers.current.rx?.(x)
    movers.current.ry?.(y)

    cancelAnimationFrame(frame.current)
    const { clientX, clientY } = event
    frame.current = requestAnimationFrame(() => {
      setReadout(describe(document.elementFromPoint(clientX, clientY)))
    })
  }

  const onPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || lockedRef.current) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    // Start the lens where the pointer entered instead of sliding in from the
    // last position.
    gsap.set(stage, {
      "--lx": `${event.clientX - rect.left}px`,
      "--ly": `${event.clientY - rect.top}px`,
    })
    gsap.set(ringRef.current, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    setRadius(LENS_RADIUS)
  }

  const onPointerLeave = () => {
    if (lockedRef.current) return
    setRadius(0, 0.45)
    setReadout(null)
  }

  const toggleLock = () => {
    const next = !lockedRef.current
    lockedRef.current = next
    setLocked(next)
    setReadout(null)
    setRadius(next ? FULL_RADIUS : 0, next ? 1.1 : 0.7)
  }

  useEffect(() => {
    toggleRef.current = toggleLock
  })

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <div
      className={[styles.xrayStage, className].filter(Boolean).join(" ")}
      data-locked={locked || undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      ref={stageRef}
    >
      <div className={styles.xrayViewport}>{live}</div>
      <div aria-hidden="true" className={styles.xrayLayer} inert>
        {xray}
      </div>
      <div aria-hidden="true" className={styles.lensRing} ref={ringRef}>
        <span className={styles.lensTag} data-empty={!readout || undefined}>
          {readout ? (
            <>
              <strong>{readout.name}</strong>
              <span>{readout.size}</span>
              {readout.role ? <span>{readout.role}</span> : null}
            </>
          ) : (
            "x-ray"
          )}
        </span>
      </div>
    </div>
  )
}
