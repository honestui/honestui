"use client"

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { flushSync } from "react-dom"

const FRAME_WIDTH = 1448
const q = (px: number) => `${(px / FRAME_WIDTH) * 100}cqw`

const LAND_EASE = [0.25, 0.7, 0.2, 1] as const
const SLOT_EASE = [0.23, 1, 0.32, 1] as const
const TILT_AT = 1400
const TILT_MAX = 7

export type KanbanListStage = "to-call" | "called" | "trial" | "signed" | "dropped"
export type KanbanListView = "kanban" | "list"

export interface KanbanListItem {
  id: string
  name: string
  stage: KanbanListStage
  action: string
  note: string
  age: string
  booked?: boolean
}

export interface KanbanListProps {
  defaultItems?: KanbanListItem[]
  onItemsChange?: (items: KanbanListItem[]) => void
  columns?: KanbanListStage[]
  view?: KanbanListView
  className?: string
  ariaLabel?: string
}

type Rect = {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

type Target = { stage: KanbanListStage; index: number }

type Snapshot = {
  cols: Map<KanbanListStage, Rect>
  cards: Map<string, Rect>
  board: Rect
  gap: number
  scrollOffset: number
}

type DragRecord = {
  id: string
  lead: KanbanListItem
  from: KanbanListStage
  fromIndex: number
  rect: Rect
  rootRect: Rect
  startX: number
  startY: number
  pointerX: number
  pointerY: number
  shot: Snapshot
  phase: "dragging" | "landing"
}

type SlotArrangement = {
  from: Record<string, number>
  to: Record<string, number>
}

const STAGES: ReadonlyArray<{
  id: KanbanListStage
  name: string
  tone: string
  soft: string
  icon: "phone" | "outgoing" | "calendar" | "check" | "close"
}> = [
  { id: "to-call", name: "To call", tone: "#4F7CF7", soft: "#EAF0FF", icon: "phone" },
  { id: "called", name: "Called", tone: "#A06CDC", soft: "#F3ECFB", icon: "outgoing" },
  { id: "trial", name: "Trial booked", tone: "#D8863B", soft: "#FFF2E6", icon: "calendar" },
  { id: "signed", name: "Signed", tone: "#2E9B68", soft: "#E6F6EE", icon: "check" },
  { id: "dropped", name: "Dropped", tone: "#A1A1AA", soft: "#EFEFF1", icon: "close" },
]

const DEFAULT_ITEMS: KanbanListItem[] = [
  { id: "ava", name: "Ava Rodriguez", stage: "to-call", action: "+1 415 555 0142", note: "Referred by Marcus at Northstar", age: "12m" },
  { id: "liam", name: "Liam Chen", stage: "to-call", action: "+1 206 555 0188", note: "Asked about the team plan", age: "38m" },
  { id: "sophie", name: "Sophie Williams", stage: "to-call", action: "+44 20 7946 0831", note: "Downloaded the pricing guide", age: "2h" },
  { id: "noah", name: "Noah Thompson", stage: "called", action: "+1 312 555 0194", note: "Follow up after finance review", age: "1d" },
  { id: "maya", name: "Maya Patel", stage: "called", action: "+1 646 555 0129", note: "Interested in annual billing", age: "1d" },
  { id: "ethan", name: "Ethan Brooks", stage: "called", action: "+1 617 555 0165", note: "Needs SSO and audit logs", age: "2d" },
  { id: "isla", name: "Isla Campbell", stage: "trial", action: "Tue, 10:30 AM", note: "Invite product and operations", age: "3h", booked: true },
  { id: "lucas", name: "Lucas Martin", stage: "trial", action: "Wed, 2:00 PM", note: "Review migration workflow", age: "6h", booked: true },
  { id: "mia", name: "Mia Anderson", stage: "trial", action: "Fri, 9:00 AM", note: "Wants a security overview", age: "1d", booked: true },
  { id: "oliver", name: "Oliver Jensen", stage: "signed", action: "+45 33 12 44 08", note: "Growth plan · 18 seats", age: "2d" },
  { id: "amelia", name: "Amelia Davis", stage: "signed", action: "+1 718 555 0173", note: "Business plan · 32 seats", age: "4d" },
  { id: "henry", name: "Henry Wilson", stage: "dropped", action: "+1 213 555 0116", note: "Timing changed; revisit in Q4", age: "6d" },
]

const styles = `
  .kanban-list { --kanban-list-ink: #171717; --kanban-list-muted: #737373; --kanban-list-note: #8F8F8F; --kanban-list-quiet: #9CA3AF; --kanban-list-marker: #9B9B9B; --kanban-list-marker-quiet: #BDBDBD; --kanban-list-tray: #FAFAFB; --kanban-list-card: #FFFFFF; --kanban-list-hover: #F5F5F6; --kanban-list-border: rgba(24, 24, 27, 0.08); --kanban-list-count: #ECECEF; --kanban-list-count-ink: #71717A; --kanban-list-fade: var(--background, #FFFFFF); position: relative; width: 100%; color: var(--kanban-list-ink); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .dark .kanban-list, .kanban-list.dark { --kanban-list-ink: #F4F4F5; --kanban-list-muted: #B4B4BC; --kanban-list-note: #92929C; --kanban-list-quiet: #7D7D89; --kanban-list-marker: #8B8B95; --kanban-list-marker-quiet: #676771; --kanban-list-tray: #18181B; --kanban-list-card: #242427; --kanban-list-hover: #2B2B2F; --kanban-list-border: rgba(255, 255, 255, 0.085); --kanban-list-count: #2E2E33; --kanban-list-count-ink: #B4B4BC; --kanban-list-fade: var(--background, #101012); }
  .kanban-list * { box-sizing: border-box; }
  .kanban-list__scroller { position: relative; overflow-x: auto; overflow-y: hidden; padding-inline: ${q(44)}; padding-block: ${q(10)} ${q(24)}; scrollbar-width: thin; scrollbar-color: var(--kanban-list-border) transparent; overscroll-behavior-inline: contain; }
  .kanban-list__board { position: relative; display: flex; align-items: flex-start; width: max-content; min-width: 100%; gap: ${q(12)}; }
  .kanban-list__column { width: ${q(300)}; min-height: ${q(470)}; flex: 0 0 ${q(300)}; padding: ${q(6)}; border-radius: ${q(14)}; background: var(--kanban-list-tray); border: ${q(1)} solid var(--kanban-list-border); }
  .kanban-list--preview-two-columns .kanban-list__board { width: 100%; min-width: 0; }
  .kanban-list--preview-two-columns .kanban-list__column { width: calc((100% - ${q(12)}) / 2); flex-basis: calc((100% - ${q(12)}) / 2); }
  .kanban-list--preview-scroll { height: 100%; min-height: 0; }
  .kanban-list--preview-scroll[data-view="list"] .kanban-list__scroller { height: 100%; max-height: 100%; }
  .kanban-list__header { height: ${q(32)}; display: flex; align-items: center; gap: ${q(8)}; padding-inline: ${q(10)}; }
  .kanban-list__stage-icon { width: ${q(16)}; height: ${q(16)}; display: grid; place-items: center; flex: 0 0 auto; border-radius: ${q(5)}; }
  .kanban-list__stage-icon svg { width: ${q(10)}; height: ${q(10)}; }
  .kanban-list__stage-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: ${q(12)}; line-height: ${q(16)}; font-weight: 600; }
  .kanban-list__count-wrap { position: relative; margin-left: auto; width: ${q(18)}; height: ${q(18)}; overflow: hidden; border-radius: ${q(9)}; background: var(--kanban-list-count); color: var(--kanban-list-count-ink); }
  .kanban-list__count { position: absolute; inset: 0; display: grid; place-items: center; font-size: ${q(9.5)}; line-height: ${q(12)}; font-weight: 600; font-variant-numeric: tabular-nums; }
  .kanban-list__list { position: relative; min-height: ${q(420)}; }
  .kanban-list__slot { width: 100%; pointer-events: none; }
  .kanban-list__item { width: 100%; }
  .kanban-list__card { position: relative; display: block; width: 100%; min-width: 0; appearance: none; border: 0; margin: 0; padding: ${q(12)} ${q(16)} ${q(15)}; border-radius: ${q(10)}; background: var(--kanban-list-card); color: inherit; text-align: left; cursor: grab; touch-action: none; user-select: none; box-shadow: 0 ${q(1)} ${q(2)} rgba(0, 0, 0, 0.08), 0 ${q(4)} ${q(12)} rgba(0, 0, 0, 0.055), inset 0 0 0 ${q(1)} var(--kanban-list-border); transition: box-shadow 160ms cubic-bezier(0.19, 1, 0.22, 1), background-color 160ms cubic-bezier(0.19, 1, 0.22, 1); }
  .kanban-list__card:hover { box-shadow: 0 ${q(2)} ${q(4)} rgba(0, 0, 0, 0.1), 0 ${q(7)} ${q(16)} rgba(0, 0, 0, 0.08), inset 0 0 0 ${q(1)} var(--kanban-list-border); }
  .kanban-list__card:active { cursor: grabbing; }
  .kanban-list__card:focus-visible { outline: ${q(2)} solid #4F7CF7; outline-offset: ${q(2)}; }
  .kanban-list__row { display: grid; min-width: 0; grid-template-columns: ${q(16)} minmax(0, 1fr); column-gap: ${q(8)}; align-items: center; }
  .kanban-list__row + .kanban-list__row--action { margin-top: ${q(10)}; }
  .kanban-list__row--note { margin-top: ${q(8)}; }
  .kanban-list__marker { width: ${q(16)}; height: ${q(16)}; display: grid; place-items: center; }
  .kanban-list__marker svg { display: block; width: ${q(13)}; height: ${q(13)}; color: var(--kanban-list-marker); }
  .kanban-list__row--note .kanban-list__marker svg { width: ${q(12)}; height: ${q(12)}; color: var(--kanban-list-marker-quiet); }
  .kanban-list__name { min-width: 0; padding-right: ${q(34)}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: ${q(14)}; line-height: ${q(17.5)}; font-weight: 500; color: var(--kanban-list-ink); }
  .kanban-list__action { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: ${q(12)}; line-height: ${q(18)}; font-weight: 400; color: var(--kanban-list-muted); font-variant-numeric: tabular-nums; }
  .kanban-list__note { min-width: 0; display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 1; font-size: ${q(11.5)}; line-height: ${q(17.4)}; font-weight: 400; color: var(--kanban-list-note); }
  .kanban-list__age { position: absolute; top: ${q(13)}; right: ${q(16)}; font-size: ${q(10)}; line-height: ${q(14)}; font-weight: 400; color: var(--kanban-list-quiet); font-variant-numeric: tabular-nums; }
  .kanban-list__overlay-layer { position: absolute; inset: 0; z-index: 20; pointer-events: none; overflow: visible; }
  .kanban-list__overlay { position: absolute; left: 0; top: 0; transform-origin: 50% 50%; will-change: transform; }
  .kanban-list__overlay .kanban-list__card { height: 100%; cursor: grabbing; box-shadow: none; }
  .kanban-list__tone-ring { position: absolute; inset: 0; z-index: 2; pointer-events: none; border-radius: inherit; box-shadow: inset 0 0 0 ${q(1.5)} color-mix(in srgb, var(--kanban-list-ink) 18%, transparent); }
  .kanban-list__signed-mark { position: absolute; z-index: 3; right: ${q(12)}; bottom: ${q(10)}; width: ${q(20)}; height: ${q(20)}; display: grid; place-items: center; border-radius: 50%; color: #39AD79; background: color-mix(in srgb, currentColor 15%, var(--kanban-list-card)); box-shadow: 0 ${q(2)} ${q(6)} rgba(46, 155, 104, 0.16); }
  .kanban-list__signed-mark svg { width: ${q(12)}; height: ${q(12)}; }
  .kanban-list__fade { position: absolute; z-index: 10; top: 0; bottom: 0; width: ${q(38)}; pointer-events: none; opacity: 0; transition: opacity 160ms cubic-bezier(0.19, 1, 0.22, 1); }
  .kanban-list__fade[data-visible="true"] { opacity: 1; }
  .kanban-list__fade--left { left: 0; background: linear-gradient(90deg, var(--kanban-list-fade), transparent); }
  .kanban-list__fade--right { right: 0; background: linear-gradient(270deg, var(--kanban-list-fade), transparent); }
  .kanban-list[data-view="list"] .kanban-list__scroller { max-height: var(--kanban-list-list-max-height, ${q(840)}); overflow-x: hidden; overflow-y: auto; overscroll-behavior-inline: auto; overscroll-behavior-block: contain; }
  .kanban-list[data-view="list"] .kanban-list__board { width: 100%; min-width: 0; flex-direction: column; gap: ${q(10)}; }
  .kanban-list[data-view="list"] .kanban-list__column { width: 100%; min-height: 0; flex: none; }
  .kanban-list[data-view="list"] .kanban-list__list { min-height: 0; overflow: hidden; border-radius: ${q(10)}; background: var(--kanban-list-card); box-shadow: inset 0 0 0 ${q(1)} var(--kanban-list-border); }
  .kanban-list[data-view="list"] .kanban-list__card { height: ${q(44)}; display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 2fr) ${q(60)}; align-items: center; gap: ${q(12)}; padding: 0 ${q(16)}; border-radius: 0; background: transparent; box-shadow: inset 0 -${q(1)} 0 var(--kanban-list-border); }
  .kanban-list[data-view="list"] [data-last="true"] .kanban-list__card { box-shadow: none; }
  .kanban-list[data-view="list"] .kanban-list__card:hover { background: var(--kanban-list-hover); box-shadow: inset 0 -${q(1)} 0 var(--kanban-list-border); }
  .kanban-list[data-view="list"] [data-last="true"] .kanban-list__card:hover { box-shadow: none; }
  .kanban-list[data-view="list"] .kanban-list__overlay .kanban-list__card { border-radius: inherit; background: var(--kanban-list-card); box-shadow: none; }
  .kanban-list[data-view="list"] .kanban-list__name { padding-right: 0; font-size: ${q(13)}; line-height: ${q(17)}; }
  .kanban-list[data-view="list"] .kanban-list__action, .kanban-list[data-view="list"] .kanban-list__note { display: flex; align-items: center; min-width: 0; gap: ${q(8)}; font-size: ${q(12.5)}; line-height: ${q(17)}; }
  .kanban-list[data-view="list"] .kanban-list__note { color: var(--kanban-list-note); }
  .kanban-list[data-view="list"] .kanban-list__cell-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kanban-list[data-view="list"] .kanban-list__marker { flex: 0 0 ${q(16)}; }
  .kanban-list[data-view="list"] .kanban-list__marker svg { width: ${q(12)}; height: ${q(12)}; }
  .kanban-list[data-view="list"] .kanban-list__note .kanban-list__marker svg { width: ${q(12)}; height: ${q(12)}; color: var(--kanban-list-marker-quiet); }
  .kanban-list[data-view="list"] .kanban-list__age { position: static; justify-self: end; min-width: 0; font-size: ${q(10)}; line-height: ${q(14)}; text-align: right; }
  .kanban-list[data-view="list"] .kanban-list__fade { left: 0; right: 0; width: auto; height: ${q(28)}; }
  .kanban-list[data-view="list"] .kanban-list__fade--left { top: 0; bottom: auto; background: linear-gradient(180deg, var(--kanban-list-fade), transparent); }
  .kanban-list[data-view="list"] .kanban-list__fade--right { top: auto; bottom: 0; background: linear-gradient(0deg, var(--kanban-list-fade), transparent); }
  .dark .kanban-list__stage-icon, .kanban-list.dark .kanban-list__stage-icon { background: color-mix(in srgb, currentColor 15%, transparent) !important; }
  .kanban-list__instructions, .kanban-list__live { position: absolute; width: ${q(1)}; height: ${q(1)}; padding: 0; margin: -${q(1)}; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @media (prefers-reduced-motion: reduce) { .kanban-list__card { transition: none; } }
`

function copyRect(rect: DOMRect): Rect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function stageMeta(stage: KanbanListStage) {
  return STAGES.find((item) => item.id === stage) ?? STAGES[0]
}

function StageGlyph({ name }: { name: (typeof STAGES)[number]["icon"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.65 }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {name === "phone" && <path {...common} d="M4.3 2.6 6 2.2l1.1 3-1.2 1c.7 1.6 1.9 2.8 3.5 3.5l1-1.2 3 1.1-.4 1.8c-.2.8-.9 1.4-1.8 1.3-4.8-.5-8.6-4.3-9.1-9.1-.1-.5.3-.9.8-1Z" />}
      {name === "outgoing" && <><path {...common} d="M3 8.2c.7-2.8 2.4-4.5 5.2-5.2" /><path {...common} d="M7.8 2.8h3.4v3.4M12.6 9.6v1.8c0 .7-.5 1.2-1.2 1.2H4.6c-.7 0-1.2-.5-1.2-1.2V8" /></>}
      {name === "calendar" && <><rect {...common} x="2.5" y="3.6" width="11" height="9.6" rx="1.8" /><path {...common} d="M5.2 2.4v2.3m5.6-2.3v2.3M2.5 6.5h11" /></>}
      {name === "check" && <path {...common} d="m3.2 8.2 3 3 6.6-6.6" />}
      {name === "close" && <path {...common} d="m4 4 8 8m0-8-8 8" />}
    </svg>
  )
}

function PhoneGlyph({ booked }: { booked?: boolean }) {
  return booked ? <StageGlyph name="calendar" /> : <StageGlyph name="phone" />
}

function NoteGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 3.2h10v7.4H7l-3.2 2.2v-2.2H3z" fill="currentColor" />
    </svg>
  )
}

function KanbanListCardContent({ lead, view }: { lead: KanbanListItem; view: KanbanListView }) {
  if (view === "list") {
    return (
      <>
        <span className="kanban-list__name">{lead.name}</span>
        <span className="kanban-list__action">
          <span className="kanban-list__marker"><PhoneGlyph booked={lead.booked} /></span>
          <span className="kanban-list__cell-text">{lead.action}</span>
        </span>
        <span className="kanban-list__note">
          <span className="kanban-list__marker"><NoteGlyph /></span>
          <span className="kanban-list__cell-text">{lead.note}</span>
        </span>
        <span className="kanban-list__age">{lead.age}</span>
      </>
    )
  }

  return (
    <>
      <span className="kanban-list__age">{lead.age}</span>
      <span className="kanban-list__row">
        <span className="kanban-list__marker" aria-hidden="true" />
        <span className="kanban-list__name">{lead.name}</span>
      </span>
      <span className="kanban-list__row kanban-list__row--action">
        <span className="kanban-list__marker"><PhoneGlyph booked={lead.booked} /></span>
        <span className="kanban-list__action">{lead.action}</span>
      </span>
      <span className="kanban-list__row kanban-list__row--note">
        <span className="kanban-list__marker"><NoteGlyph /></span>
        <span className="kanban-list__note">{lead.note}</span>
      </span>
    </>
  )
}

function RollingCount({ value }: { value: number }) {
  return (
    <span className="kanban-list__count-wrap" aria-label={`${value} items`}>
      <motion.span
        key={value}
        className="kanban-list__count"
        initial={{ y: q(12), opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: `-${q(12)}`, opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
      >
        {value}
      </motion.span>
    </span>
  )
}

function DragOverlay({
  drag,
  target,
  mx,
  my,
  screenX,
  screenY,
  scaleValue,
  view,
  tiltGain,
  lift,
  ringOpacity,
  radius,
}: {
  drag: DragRecord
  target: Target | null
  mx: MotionValue<number>
  my: MotionValue<number>
  screenX: MotionValue<number>
  screenY: MotionValue<number>
  scaleValue: MotionValue<number>
  view: KanbanListView
  tiltGain: MotionValue<number>
  lift: MotionValue<number>
  ringOpacity: MotionValue<number>
  radius: MotionValue<number>
}) {
  const reduce = useReducedMotion()
  const velocity = useVelocity(view === "list" ? screenY : screenX)
  const tiltRaw = useTransform(velocity, [-TILT_AT, TILT_AT], [-TILT_MAX, TILT_MAX], { clamp: true })
  const tiltSpring = useSpring(tiltRaw, { stiffness: 300, damping: 30, mass: 0.6 })
  const tilt = useTransform(() => (reduce ? 0 : tiltSpring.get() * tiltGain.get()))
  const shadow = useTransform(lift, (value) => {
    const a = Math.max(0, Math.min(1, value))
    return `0 ${q(2 + a * 8)} ${q(5 + a * 21)} rgba(0,0,0,${0.08 + a * 0.12}), 0 ${q(1 + a * 2)} ${q(2 + a * 6)} rgba(0,0,0,${0.06 + a * 0.06}), inset 0 0 0 ${q(1)} var(--kanban-list-border)`
  })
  return (
    <motion.div
      className="kanban-list__overlay"
      style={{
        x: mx,
        y: my,
        rotate: tilt,
        scale: scaleValue,
        width: drag.rect.width,
        height: drag.rect.height,
        borderRadius: radius,
        boxShadow: shadow,
      }}
    >
      <div className="kanban-list__card" style={{ borderRadius: "inherit" }}>
        <KanbanListCardContent lead={drag.lead} view={view} />
      </div>
      <motion.span className="kanban-list__tone-ring" style={{ opacity: ringOpacity }} />
      {target?.stage === "signed" ? (
        <motion.span
          className="kanban-list__signed-mark"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: [0.19, 1, 0.22, 1] }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <motion.path
              d="m3 8.3 3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
            />
          </svg>
        </motion.span>
      ) : null}
    </motion.div>
  )
}

function mergeClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

function reorderLeads(all: KanbanListItem[], id: string, target: Target) {
  const moved = all.find((lead) => lead.id === id)
  if (!moved) return all
  const buckets = new Map<KanbanListStage, KanbanListItem[]>(STAGES.map((stage) => [stage.id, []]))
  for (const lead of all) {
    if (lead.id !== id) buckets.get(lead.stage)?.push(lead)
  }
  buckets.get(target.stage)?.splice(target.index, 0, { ...moved, stage: target.stage })
  return STAGES.flatMap((stage) => buckets.get(stage.id) ?? [])
}

export function KanbanList({
  defaultItems = DEFAULT_ITEMS,
  onItemsChange,
  columns,
  view = "kanban",
  className,
  ariaLabel = "Kanban list",
}: KanbanListProps) {
  const isList = view === "list"
  const [leads, setLeads] = useState<KanbanListItem[]>(() => defaultItems.map((lead) => ({ ...lead })))
  const [drag, setDrag] = useState<DragRecord | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [announcement, setAnnouncement] = useState("")
  const [slots, setSlots] = useState<SlotArrangement>({ from: {}, to: {} })
  const [scrollEdges, setScrollEdges] = useState({ leading: false, trailing: false })
  const reduce = useReducedMotion()

  const rootRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef(new Map<KanbanListStage, HTMLElement>())
  const listRefs = useRef(new Map<KanbanListStage, HTMLDivElement>())
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const dragRef = useRef<DragRecord | null>(null)
  const targetRef = useRef<Target | null>(null)
  const pressRef = useRef<DragRecord | null>(null)
  const cleanupPointerRef = useRef<(() => void) | null>(null)
  const autoScrollRef = useRef<number | null>(null)
  const slotAnimationRef = useRef<ReturnType<typeof animate> | null>(null)
  const slotProgress = useMotionValue(1)
  const slotHeightRef = useRef(0)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const screenX = useMotionValue(0)
  const screenY = useMotionValue(0)
  const scaleValue = useMotionValue(1)
  const tiltGain = useMotionValue(1)
  const lift = useMotionValue(0)
  const ringOpacity = useMotionValue(0)
  const radius = useMotionValue(0)

  const displayedStages = useMemo(
    () => columns?.length ? STAGES.filter((stage) => columns.includes(stage.id)) : STAGES,
    [columns],
  )

  const grouped = useMemo(() => {
    const map = new Map<KanbanListStage, KanbanListItem[]>(STAGES.map((stage) => [stage.id, []]))
    for (const lead of leads) map.get(lead.stage)?.push(lead)
    return map
  }, [leads])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const paint = (value: number) => {
      root.querySelectorAll<HTMLElement>("[data-slotwrap]").forEach((slot) => {
        const from = Number.parseFloat(slot.style.getPropertyValue("--slot-from")) || 0
        const delta = Number.parseFloat(slot.style.getPropertyValue("--slot-delta")) || 0
        slot.style.paddingTop = `${from + delta * value}px`
      })
    }
    paint(slotProgress.get())
    return slotProgress.on("change", paint)
  }, [slotProgress])

  useEffect(() => () => {
    cleanupPointerRef.current?.()
    if (autoScrollRef.current !== null) cancelAnimationFrame(autoScrollRef.current)
    slotAnimationRef.current?.stop()
  }, [])

  useEffect(() => {
    const controls = animate(ringOpacity, target ? 1 : 0, {
      duration: reduce ? 0 : 0.14,
      ease: [0.19, 1, 0.22, 1],
    })
    return () => controls.stop()
  }, [reduce, ringOpacity, target])

  const scale = useCallback((value: number) => {
    const width = rootRef.current?.getBoundingClientRect().width ?? FRAME_WIDTH
    return (value / FRAME_WIDTH) * width
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const update = () => {
      const edge = scale(1)
      const position = isList ? scroller.scrollTop : scroller.scrollLeft
      const max = isList
        ? Math.max(0, scroller.scrollHeight - scroller.clientHeight)
        : Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      const next = {
        leading: position > edge,
        trailing: position < max - edge,
      }
      setScrollEdges((current) => current.leading === next.leading && current.trailing === next.trailing ? current : next)
    }
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    if (boardRef.current) observer.observe(boardRef.current)
    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [displayedStages, isList, scale])

  const currentSlotValues = useCallback(() => {
    const current: Record<string, number> = {}
    rootRef.current?.querySelectorAll<HTMLElement>("[data-slot-key]").forEach((slot) => {
      const key = slot.dataset.slotKey
      const padding = Number.parseFloat(getComputedStyle(slot).paddingTop) || 0
      if (key && padding > 0.01) current[key] = padding
    })
    return current
  }, [])

  const setSlotTarget = useCallback((next: Target | null, immediate = false) => {
    slotAnimationRef.current?.stop()
    const nextValues = next ? { [`${next.stage}:${next.index}`]: slotHeightRef.current } : {}
    if (immediate || reduce) {
      setSlots({ from: nextValues, to: nextValues })
      slotProgress.set(1)
      return
    }
    const current = currentSlotValues()
    setSlots({ from: current, to: nextValues })
    slotProgress.set(0)
    requestAnimationFrame(() => {
      slotAnimationRef.current = animate(slotProgress, 1, {
        duration: 0.24,
        ease: SLOT_EASE,
      })
    })
  }, [currentSlotValues, reduce, slotProgress])

  const measureSnapshot = useCallback((): Snapshot | null => {
    const scroller = scrollerRef.current
    const board = boardRef.current
    if (!scroller || !board) return null
    const cols = new Map<KanbanListStage, Rect>()
    const cards = new Map<string, Rect>()
    columnRefs.current.forEach((node, stage) => cols.set(stage, copyRect(node.getBoundingClientRect())))
    cardRefs.current.forEach((node, id) => cards.set(id, copyRect(node.getBoundingClientRect())))
    return {
      cols,
      cards,
      board: copyRect(board.getBoundingClientRect()),
      gap: isList ? 0 : scale(8),
      scrollOffset: isList ? scroller.scrollTop : scroller.scrollLeft,
    }
  }, [isList, scale])

  const resolveTarget = useCallback((record: DragRecord, clientX: number, clientY: number): Target | null => {
    const scroller = scrollerRef.current
    const currentScroll = scroller ? (isList ? scroller.scrollTop : scroller.scrollLeft) : record.shot.scrollOffset
    const scrollDelta = currentScroll - record.shot.scrollOffset
    if (isList) {
      const bound = scale(80)
      if (clientX < record.shot.board.left - bound || clientX > record.shot.board.right + bound) return null
    } else {
      const bound = scale(60)
      if (clientY < record.shot.board.top - bound || clientY > record.shot.board.bottom + bound) return null
    }

    const along = (isList ? clientY : clientX) + scrollDelta
    let selected: KanbanListStage | null = null
    let best = Number.POSITIVE_INFINITY
    for (const stage of displayedStages) {
      const rect = record.shot.cols.get(stage.id)
      if (!rect) continue
      const start = isList ? rect.top : rect.left
      const end = isList ? rect.bottom : rect.right
      const edgeDistance = along < start ? start - along : along > end ? along - end : 0
      if (edgeDistance < best) {
        best = edgeDistance
        selected = stage.id
      }
    }
    if (!selected) return null

    const contentY = clientY + (isList ? scrollDelta : 0)
    const ids = leads.filter((lead) => lead.stage === selected).map((lead) => lead.id)
    let index = 0
    for (const id of ids) {
      const rect = record.shot.cards.get(id)
      if (rect && contentY > rect.top + rect.height / 2) index += 1
    }
    if (selected === record.from && index > record.fromIndex) index -= 1
    const max = ids.length - (selected === record.from ? 1 : 0)
    return { stage: selected, index: Math.max(0, Math.min(index, max)) }
  }, [displayedStages, isList, leads, scale])

  const applyTarget = useCallback((next: Target | null, immediate = false) => {
    const previous = targetRef.current
    if (previous?.stage === next?.stage && previous?.index === next?.index) return
    targetRef.current = next
    setTarget(next)
    setSlotTarget(next, immediate)
  }, [setSlotTarget])

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const record = dragRef.current
    if (!record || record.phase !== "dragging") return
    record.pointerX = clientX
    record.pointerY = clientY
    mx.set(record.rect.left - record.rootRect.left + clientX - record.startX)
    my.set(record.rect.top - record.rootRect.top + clientY - record.startY)
    screenX.set(record.rect.left + clientX - record.startX)
    screenY.set(record.rect.top + clientY - record.startY)
    applyTarget(resolveTarget(record, clientX, clientY))
  }, [applyTarget, mx, my, resolveTarget, screenX, screenY])

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) cancelAnimationFrame(autoScrollRef.current)
    autoScrollRef.current = null
  }, [])

  const startAutoScroll = useCallback(() => {
    stopAutoScroll()
    const tick = () => {
      const record = dragRef.current
      const scroller = scrollerRef.current
      if (!record || record.phase !== "dragging" || !scroller) return
      const rect = scroller.getBoundingClientRect()
      const zone = scale(90)
      const maxStep = scale(22)
      let step = 0
      const pointer = isList ? record.pointerY : record.pointerX
      const start = isList ? rect.top : rect.left
      const end = isList ? rect.bottom : rect.right
      if (pointer < start + zone) step = -maxStep * (1 - Math.max(0, pointer - start) / zone)
      else if (pointer > end - zone) step = maxStep * (1 - Math.max(0, end - pointer) / zone)
      if (step !== 0) {
        const before = isList ? scroller.scrollTop : scroller.scrollLeft
        const max = isList
          ? scroller.scrollHeight - scroller.clientHeight
          : scroller.scrollWidth - scroller.clientWidth
        const next = Math.max(0, Math.min(max, before + step))
        if (isList) scroller.scrollTop = next
        else scroller.scrollLeft = next
        if (next !== before) updateFromPointer(record.pointerX, record.pointerY)
      }
      autoScrollRef.current = requestAnimationFrame(tick)
    }
    autoScrollRef.current = requestAnimationFrame(tick)
  }, [isList, scale, stopAutoScroll, updateFromPointer])

  const commitMove = useCallback((id: string, next: Target) => {
    const updated = reorderLeads(leads, id, next)
    setLeads(updated)
    onItemsChange?.(updated)
    const moved = leads.find((lead) => lead.id === id)
    setAnnouncement(`${moved?.name ?? "Item"} moved to ${stageMeta(next.stage).name}, position ${next.index + 1}.`)
  }, [leads, onItemsChange])

  const finishDrag = useCallback((record: DragRecord, destination: Target) => {
    flushSync(() => {
      commitMove(record.id, destination)
      setDrag(null)
      setTarget(null)
      setSlots({ from: {}, to: {} })
      slotProgress.set(1)
    })
    dragRef.current = null
    targetRef.current = null
    lift.set(0)
    scaleValue.set(1)
    ringOpacity.set(0)
  }, [commitMove, lift, ringOpacity, scaleValue, slotProgress])

  const land = useCallback((record: DragRecord, destination: Target) => {
    record.phase = "landing"
    stopAutoScroll()
    targetRef.current = destination
    setTarget(destination)
    setSlotTarget(destination, true)

    if (reduce) {
      finishDrag(record, destination)
      return
    }

    requestAnimationFrame(async () => {
      const root = rootRef.current
      const list = listRefs.current.get(destination.stage)
      const scopedSlot = list?.querySelector<HTMLElement>(`[data-slot-key="${destination.stage}:${destination.index}"]`)
      if (!root || !list || !scopedSlot) {
        finishDrag(record, destination)
        return
      }

      const rootRect = root.getBoundingClientRect()
      const slotRect = scopedSlot.getBoundingClientRect()
      let closingAbove = 0
      root.querySelectorAll<HTMLElement>("[data-slotwrap]").forEach((node) => {
        if (node === scopedSlot) return
        const rect = node.getBoundingClientRect()
        const overlaps = rect.left < slotRect.right && rect.right > slotRect.left
        if (overlaps && rect.top < slotRect.top) closingAbove += Number.parseFloat(getComputedStyle(node).paddingTop) || 0
      })

      const targetX = slotRect.left - rootRect.left
      const targetY = slotRect.top - rootRect.top + (!isList && destination.index > 0 ? record.shot.gap : 0) - closingAbove
      const distance = Math.hypot(targetX - mx.get(), targetY - my.get())
      const duration = destination.stage === "dropped"
        ? Math.min(0.4, 0.26 + distance / 2400)
        : Math.min(0.32, 0.18 + distance / 2400)

      const flights = [
        animate(mx, targetX, { type: "tween", duration, ease: LAND_EASE }),
        animate(my, targetY, { type: "tween", duration, ease: LAND_EASE }),
        animate(tiltGain, 0, { duration: duration * 0.55, ease: [0.77, 0, 0.175, 1] }),
        animate(lift, 0, { duration: duration * 0.74, ease: [0.19, 1, 0.22, 1] }),
        animate(scaleValue, 1, { duration: duration * 0.8, ease: [0.19, 1, 0.22, 1] }),
        animate(radius, scale(10), { duration: duration * 0.84, ease: [0.77, 0, 0.175, 1] }),
        animate(ringOpacity, 0, { duration: duration * 0.9, ease: "linear" }),
      ]
      await Promise.all(flights)
      finishDrag(record, destination)
    })
  }, [finishDrag, isList, lift, mx, my, radius, reduce, ringOpacity, scale, scaleValue, setSlotTarget, stopAutoScroll, tiltGain])

  const beginDrag = useCallback((record: DragRecord) => {
    dragRef.current = record
    slotHeightRef.current = record.rect.height + record.shot.gap
    mx.set(record.rect.left - record.rootRect.left)
    my.set(record.rect.top - record.rootRect.top)
    screenX.set(record.rect.left)
    screenY.set(record.rect.top)
    tiltGain.set(1)
    lift.set(1)
    scaleValue.set(reduce ? 1 : 1.04)
    ringOpacity.set(1)
    radius.set(scale(12))
    setDrag(record)
    const initial = resolveTarget(record, record.pointerX, record.pointerY) ?? { stage: record.from, index: record.fromIndex }
    targetRef.current = initial
    setTarget(initial)
    setSlotTarget(initial, true)
    setAnnouncement(`${record.lead.name} picked up from ${stageMeta(record.from).name}.`)
    startAutoScroll()
  }, [lift, mx, my, radius, reduce, resolveTarget, ringOpacity, scale, scaleValue, screenX, screenY, setSlotTarget, startAutoScroll, tiltGain])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, lead: KanbanListItem) => {
    if (event.button !== 0 || dragRef.current) return
    const shot = measureSnapshot()
    const card = cardRefs.current.get(lead.id)
    const root = rootRef.current
    if (!shot || !card || !root) return
    const rect = copyRect(card.getBoundingClientRect())
    const fromIndex = (grouped.get(lead.stage) ?? []).findIndex((item) => item.id === lead.id)
    const record: DragRecord = {
      id: lead.id,
      lead,
      from: lead.stage,
      fromIndex,
      rect,
      rootRect: copyRect(root.getBoundingClientRect()),
      startX: event.clientX,
      startY: event.clientY,
      pointerX: event.clientX,
      pointerY: event.clientY,
      shot,
      phase: "dragging",
    }
    pressRef.current = record

    const onMove = (moveEvent: PointerEvent) => {
      const pending = pressRef.current
      if (!pending) return
      pending.pointerX = moveEvent.clientX
      pending.pointerY = moveEvent.clientY
      const travelled = Math.hypot(moveEvent.clientX - pending.startX, moveEvent.clientY - pending.startY)
      if (!dragRef.current && travelled >= scale(4)) beginDrag(pending)
      if (dragRef.current) {
        moveEvent.preventDefault()
        updateFromPointer(moveEvent.clientX, moveEvent.clientY)
      }
    }

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      cleanupPointerRef.current = null
    }
    const onUp = () => {
      cleanup()
      pressRef.current = null
      const active = dragRef.current
      if (!active || active.phase !== "dragging") return
      const destination = targetRef.current ?? { stage: active.from, index: active.fromIndex }
      land(active, destination)
    }

    cleanupPointerRef.current?.()
    cleanupPointerRef.current = cleanup
    window.addEventListener("pointermove", onMove, { passive: false })
    window.addEventListener("pointerup", onUp, { once: true })
    window.addEventListener("pointercancel", onUp, { once: true })
  }, [beginDrag, grouped, land, measureSnapshot, scale, updateFromPointer])

  const onCardKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, lead: KanbanListItem) => {
    const stageIndex = displayedStages.findIndex((stage) => stage.id === lead.stage)
    const stageLeads = grouped.get(lead.stage) ?? []
    const leadIndex = stageLeads.findIndex((item) => item.id === lead.id)
    let destination: Target | null = null
    if (event.key === "ArrowLeft" && stageIndex > 0) destination = { stage: displayedStages[stageIndex - 1].id, index: (grouped.get(displayedStages[stageIndex - 1].id) ?? []).length }
    if (event.key === "ArrowRight" && stageIndex < displayedStages.length - 1) destination = { stage: displayedStages[stageIndex + 1].id, index: (grouped.get(displayedStages[stageIndex + 1].id) ?? []).length }
    if (event.key === "ArrowUp" && leadIndex > 0) destination = { stage: lead.stage, index: leadIndex - 1 }
    if (event.key === "ArrowDown" && leadIndex < stageLeads.length - 1) destination = { stage: lead.stage, index: leadIndex + 1 }
    if (!destination) return
    event.preventDefault()
    commitMove(lead.id, destination)
    requestAnimationFrame(() => cardRefs.current.get(lead.id)?.focus())
  }, [commitMove, displayedStages, grouped])

  const slotStyle = useCallback((key: string): CSSProperties => {
    const from = slots.from[key] ?? 0
    const to = slots.to[key] ?? 0
    const progress = slotProgress.get()
    return {
      "--slot-from": from,
      "--slot-delta": to - from,
      paddingTop: `${from + (to - from) * progress}px`,
    } as CSSProperties
  }, [slotProgress, slots])

  return (
    <section
      ref={rootRef}
      className={mergeClassNames("kanban-list", className)}
      style={{ containerType: "inline-size" }}
      data-view={view}
      aria-label={ariaLabel}
    >
      <style>{styles}</style>
      <p id="kanban-list-instructions" className="kanban-list__instructions">
        Drag an item between stages. With a keyboard, focus an item and use the arrow keys to move it.
      </p>
      <div className="kanban-list__live" aria-live="polite">{announcement}</div>
      <div ref={scrollerRef} className="kanban-list__scroller">
        <div ref={boardRef} className="kanban-list__board">
          {displayedStages.map((stage) => {
            const stageLeads = grouped.get(stage.id) ?? []
            const visible = drag ? stageLeads.filter((lead) => lead.id !== drag.id) : stageLeads
            return (
              <section
                key={stage.id}
                ref={(node) => { if (node) columnRefs.current.set(stage.id, node); else columnRefs.current.delete(stage.id) }}
                className="kanban-list__column"
                aria-labelledby={`lead-stage-${stage.id}`}
              >
                <header className="kanban-list__header">
                  <span className="kanban-list__stage-icon" style={{ color: stage.tone, background: stage.soft }}>
                    <StageGlyph name={stage.icon} />
                  </span>
                  <span id={`lead-stage-${stage.id}`} className="kanban-list__stage-name">{stage.name}</span>
                  <RollingCount value={stageLeads.length} />
                </header>
                <div
                  ref={(node) => { if (node) listRefs.current.set(stage.id, node); else listRefs.current.delete(stage.id) }}
                  className="kanban-list__list"
                >
                  {visible.map((lead, index) => {
                    const slotKey = `${stage.id}:${index}`
                    return (
                      <div key={lead.id} data-item-wrap data-last={index === visible.length - 1}>
                        <div data-slotwrap data-slot-key={slotKey} className="kanban-list__slot" style={slotStyle(slotKey)} />
                        <motion.div
                          layout
                          className="kanban-list__item"
                          style={{ marginTop: isList || index === 0 ? 0 : q(8) }}
                          transition={{ layout: reduce ? { duration: 0 } : { duration: 0.24, ease: SLOT_EASE } }}
                        >
                          <button
                            ref={(node) => { if (node) cardRefs.current.set(lead.id, node); else cardRefs.current.delete(lead.id) }}
                            type="button"
                            className="kanban-list__card"
                            aria-describedby="kanban-list-instructions"
                            aria-label={`${lead.name}, ${stage.name}. Use arrow keys to move.`}
                            onPointerDown={(event) => onPointerDown(event, lead)}
                            onKeyDown={(event) => onCardKeyDown(event, lead)}
                          >
                            <KanbanListCardContent lead={lead} view={view} />
                          </button>
                        </motion.div>
                      </div>
                    )
                  })}
                  <div
                    data-slotwrap
                    data-slot-key={`${stage.id}:${visible.length}`}
                    className="kanban-list__slot"
                    style={slotStyle(`${stage.id}:${visible.length}`)}
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>
      <div className="kanban-list__fade kanban-list__fade--left" data-visible={scrollEdges.leading} aria-hidden="true" />
      <div className="kanban-list__fade kanban-list__fade--right" data-visible={scrollEdges.trailing} aria-hidden="true" />
      <div className="kanban-list__overlay-layer" aria-hidden="true">
        {drag ? (
          <DragOverlay
            drag={drag}
            target={target}
            mx={mx}
            my={my}
            screenX={screenX}
            screenY={screenY}
            scaleValue={scaleValue}
            view={view}
            tiltGain={tiltGain}
            lift={lift}
            ringOpacity={ringOpacity}
            radius={radius}
          />
        ) : null}
      </div>
    </section>
  )
}
