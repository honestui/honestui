"use client"

import { useRef, useState } from "react"

import { gsap, MOTION_OK, useGSAP } from "@/components/landing/gsap"
import styles from "@/components/landing/landing.module.css"
import { CodeTokens } from "@/components/landing/code-tokens"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// The composition is drawn at a fixed size and scaled by a "camera", so every
// target rectangle below is known up front instead of measured mid-scroll.
const W = 640
const H = 396
type Rect = { x: number; y: number; w: number; h: number }
const CARD: Rect = { x: 424, y: 156, w: 200, h: 224 }
const BUTTON: Rect = { x: 440, y: 328, w: 168, h: 36 }
const FULL: Rect = { x: 0, y: 0, w: W, h: H }

// The drawing is laid out at Z× with CSS zoom and the camera only ever scales
// it down, so the close-ups render as crisp text instead of a stretched bitmap.
const Z = 2.5
const zr = (r: Rect): Rect => ({ x: r.x * Z, y: r.y * Z, w: r.w * Z, h: r.h * Z })

// A loose ring around the centre, where the button forms.
const TOKENS = [
  { label: "--hui-accent-9", kind: "accent", x: 12, y: 22 },
  { label: "--hui-shadow-feather", kind: "shadow", x: 38, y: 11 },
  { label: "--hui-neutral-12", kind: "ink", x: 66, y: 22 },
  { label: "--hui-focus-ring", kind: "focus", x: 68, y: 48 },
  { label: "--hui-radius-2 · 10px", kind: "radius", x: 7, y: 50 },
  { label: "--hui-space-5 · 16px", kind: "space", x: 60, y: 75 },
  { label: "--hui-font-size-control", kind: "type", x: 18, y: 77 },
] as const

export type AssemblyStep = {
  title: string
  body: string
  file: string
  html: string
}

function inset(rect: Rect, collapse = false) {
  const r = zr(rect)
  const right = collapse ? W * Z - r.x : W * Z - r.x - r.w
  return `inset(${r.y}px ${right}px ${H * Z - r.y - r.h}px ${r.x}px round ${10 * Z}px)`
}

function box(rect: Rect): React.CSSProperties {
  return { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
}

const BARS = [42, 64, 50, 78, 58, 92, 70, 84]

/** One drawing of the product. `wire` is the blueprint, `solid` the real UI. */
function Composition({ mode }: { mode: "wire" | "solid" }) {
  const wire = mode === "wire"
  const tag = (label: string) =>
    wire ? <span className={styles.wireTag}>{label}</span> : null

  return (
    <div className={wire ? styles.compWire : styles.compSolid} style={{ zoom: Z, width: W, height: H }}>
      {/* Sidebar */}
      <div className={styles.compPanel} data-phase="3" style={box({ x: 0, y: 0, w: 140, h: H })}>
        {tag("<Sidebar>")}
        <div className="flex items-center gap-2 px-4 pt-5 pb-6">
          <span className={styles.compLogo} />
          <span className="text-sm font-medium">Acme</span>
        </div>
        {["Overview", "Team", "Billing", "Settings"].map((item, index) => (
          <div className={styles.compNav} data-active={index === 1 || undefined} key={item}>
            <span className={styles.compNavDot} />
            {item}
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className={styles.compBar} data-phase="3" style={box({ x: 140, y: 0, w: 500, h: 52 })}>
        {tag("<header>")}
        <span className="text-sm font-medium">Team</span>
        <span className={styles.compSearch}>Search members</span>
        <span className={styles.compAvatar}>CL</span>
      </div>

      {/* KPI tiles */}
      {[
        { label: "Seats used", value: "18 / 25" },
        { label: "Pending invites", value: "3" },
        { label: "Active this week", value: "14" },
      ].map((kpi, index) => (
        <div
          className={styles.compTile}
          data-phase="3"
          key={kpi.label}
          style={box({ x: 156 + index * 160, y: 68, w: 148, h: 72 })}
        >
          {tag("<Card>")}
          <span className={styles.compMuted}>{kpi.label}</span>
          <span className="text-xl font-medium tabular-nums">{kpi.value}</span>
        </div>
      ))}

      {/* Activity chart */}
      <div className={styles.compTile} data-phase="3" style={box({ x: 156, y: 156, w: 252, h: 224 })}>
        {tag("<BarChart>")}
        <span className={styles.compMuted}>Weekly activity</span>
        <div className={styles.compBars}>
          {BARS.map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>

      {/* Invite card */}
      <div className={styles.compCard} data-phase="2" style={box(CARD)}>
        {tag("<Card>")}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Invite teammate</span>
          {wire ? (
            <span className={styles.wireBlock} style={{ width: 34, height: 18 }} />
          ) : (
            <Badge size="sm" variant="secondary">
              7 left
            </Badge>
          )}
        </div>
        <span className={styles.compMuted}>They get edit access to this workspace.</span>
        <span className="mt-3 text-xs font-medium">Email</span>
        {wire ? (
          <span className={styles.wireBlock} style={{ height: 36 }}>
            {"<Input />"}
          </span>
        ) : (
          <Input aria-hidden="true" placeholder="name@acme.com" readOnly tabIndex={-1} />
        )}
      </div>

      {/* The primitive everything starts from */}
      <div className={styles.compButton} data-phase="1" style={box(BUTTON)}>
        {wire ? (
          <span className={styles.wireBlock} style={{ height: "100%" }}>
            {"<Button>"}
          </span>
        ) : (
          <Button aria-hidden="true" className="size-full" tabIndex={-1}>
            Send invite
          </Button>
        )}
      </div>
    </div>
  )
}

function TokenChip({ kind, label }: { kind: string; label: string }) {
  return (
    <span className={styles.token} data-kind={kind}>
      <span className={styles.tokenSpecimen} data-kind={kind}>
        {kind === "type" ? "Aa" : null}
      </span>
      <CodeTokens code={label} lang="css" />
    </span>
  )
}

export function Assembly({ steps }: { steps: AssemblyStep[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const [pinned, setPinned] = useState(false)

  useGSAP(
    () => {
      const section = sectionRef.current
      const stage = stageRef.current
      if (!section || !stage) return
      const q = gsap.utils.selector(section)
      const camera = q(`.${styles.camera}`)[0] as HTMLElement
      const solid = q(`.${styles.solidLayer}`)[0] as HTMLElement
      const chips = q(`.${styles.token}`) as HTMLElement[]

      const fit = (raw: Rect, share: number) => {
        const rect = zr(raw)
        const sw = stage.clientWidth
        const sh = stage.clientHeight
        const s = Math.min((sw * share) / rect.w, (sh * share) / rect.h)
        return {
          scale: s,
          x: sw / 2 - (rect.x + rect.w / 2) * s,
          y: sh / 2 - (rect.y + rect.h / 2) * s,
        }
      }

      // Function values so ScrollTrigger re-measures the stage on resize.
      const cam = (rect: Rect, share: number) => ({
        scale: () => fit(rect, share).scale,
        x: () => fit(rect, share).x,
        y: () => fit(rect, share).y,
      })

      const mm = gsap.matchMedia()

      // Static layout for small screens and reduced motion: the finished
      // product, fitted to the stage, with every step listed.
      mm.add(`(max-width: 1023px), (prefers-reduced-motion: reduce)`, () => {
        const place = () => gsap.set(camera, { transformOrigin: "0 0", ...fit(FULL, 0.96) })
        place()
        gsap.set(solid, { clipPath: "none" })
        gsap.set(q(`.${styles.compWire}`), { autoAlpha: 0 })
        window.addEventListener("resize", place)
        return () => window.removeEventListener("resize", place)
      })

      mm.add(`(min-width: 1024px) and ${MOTION_OK}`, () => {
        setPinned(true)
        const wire = (n: number) => q(`.${styles.compWire} [data-phase="${n}"]`)

        // 2D transforms keep the zoomed frames sharp; a 3D layer would be
        // rasterized at 1x and stretched.
        gsap.set(camera, { transformOrigin: "0 0", force3D: false })
        gsap.set([...wire(1), ...wire(2), ...wire(3)], { autoAlpha: 0 })
        gsap.set(solid, { clipPath: inset(BUTTON, true) })

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut", force3D: false },
          scrollTrigger: {
            trigger: section,
            pin: q(`.${styles.assemblyPin}`)[0],
            start: "top top",
            end: "+=320%",
            scrub: 0.7,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const p = self.progress
              setPhase(p < 0.12 ? 0 : p < 0.4 ? 1 : p < 0.66 ? 2 : 3)
            },
          },
        })

        tl.fromTo(camera, cam(BUTTON, 0.5), { ...cam(BUTTON, 0.5), duration: 1 }, 0)
          // Tokens converge on the button.
          .to(
            chips,
            {
              // Measured from the untransformed slot, never the moving chip.
              x: (_, el: HTMLElement) => {
                const r = el.parentElement!.getBoundingClientRect()
                const s = stage.getBoundingClientRect()
                return s.left + s.width / 2 - (r.left + r.width / 2)
              },
              y: (_, el: HTMLElement) => {
                const r = el.parentElement!.getBoundingClientRect()
                const s = stage.getBoundingClientRect()
                return s.top + s.height / 2 - (r.top + r.height / 2)
              },
              scale: 0.2,
              autoAlpha: 0,
              duration: 1.4,
              stagger: 0.06,
              ease: "power3.in",
            },
            1,
          )
          .to(wire(1), { autoAlpha: 1, duration: 0.6 }, 1.7)
          .to(solid, { clipPath: inset(BUTTON), duration: 0.9, ease: "power2.out" }, 2.5)
          // Once the real UI covers a region, retire its blueprint so no
          // dashed edges or tags peek out around it.
          .to(wire(1), { autoAlpha: 0, duration: 0.3 }, 3.4)
          // Pull back to the card.
          .to(camera, { ...cam(CARD, 0.78), duration: 1.4 }, 3.8)
          .to(wire(2), { autoAlpha: 1, duration: 0.7, stagger: 0.1 }, 4.2)
          .to(solid, { clipPath: inset(CARD), duration: 1, ease: "power2.out" }, 5.2)
          .to(wire(2), { autoAlpha: 0, duration: 0.3 }, 6.2)
          // Pull back to the product.
          .to(camera, { ...cam(FULL, 0.96), duration: 1.6 }, 6.6)
          .to(wire(3), { autoAlpha: 1, duration: 0.6, stagger: 0.08 }, 7)
          .to(solid, { clipPath: inset(FULL), duration: 1.2, ease: "power2.inOut" }, 8.2)
          .to(wire(3), { autoAlpha: 0, duration: 0.3 }, 9.4)
          .to({}, { duration: 0.8 })

        return () => setPinned(false)
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section
      aria-labelledby="assembly-title"
      className={styles.assembly}
      data-pinned={pinned || undefined}
      ref={sectionRef}
    >
      <div className={styles.assemblyPin}>
        <div className={styles.assemblyGrid}>
          <div className={styles.assemblyCopy}>
            <div className={styles.intro}>
              <p className={styles.redline}>tokens → {"<Button>"} → {"<Card>"} → page</p>
              <h2 className={styles.sectionTitle} id="assembly-title">
                From a token to a product, every layer readable
              </h2>
            </div>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li data-active={!pinned || phase === index || undefined} key={step.title}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepBody}>{step.body}</span>
                </li>
              ))}
            </ol>
            <div className={styles.codePanel}>
              <div className={styles.codeBar}>
                <span className={styles.codeFile}>{steps[pinned ? phase : steps.length - 1].file}</span>
              </div>
              <div className={styles.codeStack}>
                {steps.map((step, index) => (
                  <div
                    aria-hidden={(pinned ? phase : steps.length - 1) !== index}
                    className={styles.codeLayer}
                    dangerouslySetInnerHTML={{ __html: step.html }}
                    data-active={(pinned ? phase : steps.length - 1) === index || undefined}
                    key={step.file}
                  />
                ))}
              </div>
            </div>
          </div>

          <div aria-hidden="true" className={styles.assemblyStage} ref={stageRef}>
            <div className={styles.camera} style={{ width: W * Z, height: H * Z }}>
              <Composition mode="wire" />
              <div className={styles.solidLayer}>
                <Composition mode="solid" />
              </div>
            </div>
            {TOKENS.map((token) => (
              <span
                className={styles.tokenSlot}
                key={token.label}
                style={{ left: `${token.x}%`, top: `${token.y}%` }}
              >
                <TokenChip kind={token.kind} label={token.label} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
