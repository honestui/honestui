"use client"

import { motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Check } from "honestui/icons"

import styles from "@/components/landing/landing.module.css"
import { CodeTokens } from "@/components/landing/code-tokens"

export type InstallItem = {
  name: string
  title: string
  lines: number
  html: string
}

type Line = { kind: "cmd" | "ok" | "file" | "muted"; text: string }

const BASE_FILES = ["card.tsx", "input.tsx", "label.tsx"]

export function InstallPlayground({ items }: { items: InstallItem[] }) {
  const reduce = useReducedMotion()
  const dropRef = useRef<HTMLDivElement>(null)
  const [installed, setInstalled] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)
  const [lines, setLines] = useState<Line[]>([
    { kind: "muted", text: "Drag a component here, or click one" },
  ])
  const timers = useRef<number[]>([])
  // Refs, not state: a drop and the click that follows it land in the same
  // tick, before React re-renders, so state alone would install twice.
  const busyRef = useRef(false)
  const installedRef = useRef<string[]>([])
  const draggedRef = useRef(false)

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reduce ? 0 : ms))
  }

  const install = (name: string) => {
    if (busyRef.current) return
    const file = `components/ui/${name}.tsx`
    if (installedRef.current.includes(name)) {
      setActive(name)
      setLines((prev) => [...prev, { kind: "muted", text: `${file} is already in your project` }])
      return
    }
    busyRef.current = true
    installedRef.current = [...installedRef.current, name]
    const command = `npx honestui@latest add ${name}`
    // Type the command, then report what the CLI writes.
    setLines((prev) => [...prev.slice(-6), { kind: "cmd", text: "" }])
    const chars = command.split("")
    chars.forEach((_, i) => {
      later(() => {
        setLines((prev) => {
          const next = [...prev]
          next[next.length - 1] = { kind: "cmd", text: command.slice(0, i + 1) }
          return next
        })
      }, 18 * i)
    })
    const typed = 18 * chars.length
    later(() => setLines((p) => [...p, { kind: "ok", text: "Checked registry" }]), typed + 220)
    later(() => setLines((p) => [...p, { kind: "ok", text: "Created 1 file:" }]), typed + 520)
    later(() => {
      setLines((p) => [...p, { kind: "file", text: `  - ${file}` }])
      setInstalled((p) => (p.includes(name) ? p : [...p, name]))
      setActive(name)
      busyRef.current = false
    }, typed + 700)
  }

  const activeItem = items.find((item) => item.name === active)
  const files = [...BASE_FILES, ...installed.map((n) => `${n}.tsx`)].sort()

  return (
    <div className={styles.installGrid}>
      <div className={styles.installTray}>
        <p className={styles.trayHint} id="tray-hint">
          Drag a component into the project, or click it
        </p>
        <ul aria-describedby="tray-hint" className={styles.chips}>
          {items.map((item) => {
            const added = installed.includes(item.name)
            return (
            <li key={item.name}>
              <motion.button
                aria-label={
                  added
                    ? `${item.title} is in the example project, open its source`
                    : `Add ${item.title} to the example project`
                }
                className={styles.chip}
                data-installed={added || undefined}
                drag={!reduce}
                dragSnapToOrigin
                dragElastic={0.6}
                onClick={() => {
                  // A drag ends with a click on the same chip; the drop
                  // already handled it.
                  if (draggedRef.current) {
                    draggedRef.current = false
                    return
                  }
                  install(item.name)
                }}
                onDragStart={() => {
                  draggedRef.current = true
                }}
                onDrag={(_, info) => {
                  const rect = dropRef.current?.getBoundingClientRect()
                  if (!rect) return
                  const { x, y } = info.point
                  const sx = x - window.scrollX
                  const sy = y - window.scrollY
                  setHovering(sx > rect.left && sx < rect.right && sy > rect.top && sy < rect.bottom)
                }}
                onDragEnd={(_, info) => {
                  // Clear the flag if no click follows (pointer released elsewhere).
                  window.setTimeout(() => {
                    draggedRef.current = false
                  }, 0)
                  const rect = dropRef.current?.getBoundingClientRect()
                  setHovering(false)
                  if (!rect) return
                  const sx = info.point.x - window.scrollX
                  const sy = info.point.y - window.scrollY
                  if (sx > rect.left && sx < rect.right && sy > rect.top && sy < rect.bottom) {
                    install(item.name)
                  }
                }}
                type="button"
                whileDrag={{ scale: 1.08, rotate: -3, zIndex: 20 }}
              >
                {added ? (
                  <span aria-hidden="true" className={styles.chipCheck}>
                    <Check />
                  </span>
                ) : (
                  <span aria-hidden="true" className={styles.chipGrip} />
                )}
                {item.title}
                <span className={styles.chipMeta}>
                  {added ? `ui/${item.name}.tsx` : `${item.lines} lines`}
                </span>
              </motion.button>
            </li>
            )
          })}
        </ul>
      </div>

      <div className={styles.ide} data-hover={hovering || undefined} ref={dropRef}>
        <div className={styles.ideBar}>
          <span className={styles.ideDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>acme-dashboard</span>
        </div>
        <div className={styles.ideBody}>
          <nav aria-label="Example project files" className={styles.ideTree}>
            <span className={styles.treeDir}>app</span>
            <span className={styles.treeDir}>components</span>
            <span className={styles.treeDir} data-depth="2">ui</span>
            {files.map((file) => {
              const name = file.replace(".tsx", "")
              const added = installed.includes(name)
              return (
                <button
                  className={styles.treeFile}
                  data-active={active === name || undefined}
                  data-added={added || undefined}
                  disabled={!added}
                  key={file}
                  onClick={() => setActive(name)}
                  type="button"
                >
                  {file}
                </button>
              )
            })}
            <span className={styles.treeDir}>lib</span>
          </nav>
          <div className={styles.ideEditor}>
            {activeItem ? (
              <>
                <div className={styles.editorHead}>
                  <code>components/ui/{activeItem.name}.tsx</code>
                  <span>{activeItem.lines} lines · in your repo</span>
                </div>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.editorCode}
                  dangerouslySetInnerHTML={{ __html: activeItem.html }}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  key={activeItem.name}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </>
            ) : (
              <div className={styles.editorEmpty}>
                <span>{"// Nothing open yet"}</span>
                <span>{"// Added components open here as source you can edit"}</span>
              </div>
            )}
          </div>
        </div>
        <div aria-live="polite" className={styles.terminal} role="log">
          {lines.map((line, i) => (
            <div data-kind={line.kind} key={i}>
              {line.kind === "cmd" ? <span aria-hidden="true">$ </span> : null}
              {line.kind === "ok" ? <span aria-hidden="true">✔ </span> : null}
              {line.kind === "cmd" ? <CodeTokens code={line.text} lang="bash" /> : line.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
