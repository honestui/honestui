"use client"

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import {
  Anchor, Archive, Award, Battery, Bell, Bookmark, Box, Briefcase, Calendar, Camera,
  Clipboard, Clock, Cloud, Code, Coffee, Compass, Cpu, CreditCard, Crown, Database,
  Download, Droplet, Eye, Feather, File, Flag, Flame, Folder, Gift, Globe, Hash,
  Headphones, Heart, Image, Inbox, Infinity as InfinityIcon, Key, Layers, Leaf, LifeBuoy,
  Lightbulb, Link, Lock, Mail, Map, Mic, Moon, Music, Navigation, Package, Palette,
  Paperclip, Pen, Phone, Plane, Play, Printer, Puzzle, Radio, Rocket, Ruler, Scissors,
  Search, Send, Server, Settings, Share, Shield, ShoppingCart, Smile, Sparkles, Star,
  Sun, Tag, Target, Terminal, Thermometer, Ticket, Trash, Trophy, Truck, Umbrella,
  Upload, User,
} from "honestui/icons"

import styles from "@/components/landing/landing.module.css"
import { CodeTokens } from "@/components/landing/code-tokens"

const LandingAreaChart = dynamic(() => import("@/components/landing-area-chart"), { ssr: false })
const Grainient = dynamic(() => import("honestui/shaders").then((m) => m.Grainient), {
  ssr: false,
})

const ICONS = [
  Anchor, Archive, Award, Battery, Bell, Bookmark, Box, Briefcase, Calendar, Camera,
  Clipboard, Clock, Cloud, Code, Coffee, Compass, Cpu, CreditCard, Crown, Database,
  Download, Droplet, Eye, Feather, File, Flag, Flame, Folder, Gift, Globe, Hash,
  Headphones, Heart, Image, Inbox, InfinityIcon, Key, Layers, Leaf, LifeBuoy,
  Lightbulb, Link, Lock, Mail, Map, Mic, Moon, Music, Navigation, Package, Palette,
  Paperclip, Pen, Phone, Plane, Play, Printer, Puzzle, Radio, Rocket, Ruler, Scissors,
  Search, Send, Server, Settings, Share, Shield, ShoppingCart, Smile, Sparkles, Star,
  Sun, Tag, Target, Terminal, Thermometer, Ticket, Trash, Trophy, Truck, Umbrella,
  Upload, User,
]

/* ---------------------------------------------------------------- */
/* Scroll-velocity marquee (React Bits ScrollVelocity, on motion)    */
/* ---------------------------------------------------------------- */

function VelocityRow({ items, baseVelocity }: { items: string[]; baseVelocity: number }) {
  const reduce = useReducedMotion()
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [0, 1000], [0, 5], { clamp: false })
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`)
  const direction = useRef(1)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    let move = direction.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) direction.current = -1
    else if (f > 0) direction.current = 1
    move += direction.current * move * f
    baseX.set(baseX.get() + move)
  })

  const row = (
    <span className={styles.marqueeChunk}>
      {items.map((item) => (
        <span key={item}>
          {item}
          <i aria-hidden="true" />
        </span>
      ))}
    </span>
  )

  return (
    <div className={styles.marqueeRow}>
      <motion.div className={styles.marqueeTrack} style={{ x }}>
        {row}
        {row}
      </motion.div>
    </div>
  )
}

export function VelocityMarquee({ items }: { items: string[] }) {
  const half = Math.ceil(items.length / 2)
  return (
    <div aria-hidden="true" className={styles.marquee}>
      <VelocityRow baseVelocity={-2.2} items={items.slice(0, half)} />
      <VelocityRow baseVelocity={2.2} items={items.slice(half)} />
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Icon field: icons respond to pointer distance                    */
/* ---------------------------------------------------------------- */

function IconField() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const field = ref.current
    if (!field || reduce) return
    const cells = Array.from(field.querySelectorAll<HTMLElement>("[data-cell]"))
    let px = -9999
    let py = -9999
    let raf = 0
    const current = cells.map(() => 0)

    const tick = () => {
      const rect = field.getBoundingClientRect()
      let moving = false
      cells.forEach((cell, i) => {
        const cx = cell.offsetLeft + cell.offsetWidth / 2
        const cy = cell.offsetTop + cell.offsetHeight / 2
        const d = Math.hypot(px - rect.left - cx, py - rect.top - cy)
        const target = Math.max(0, 1 - d / 150)
        current[i] += (target - current[i]) * 0.18
        if (Math.abs(target - current[i]) > 0.002) moving = true
        cell.style.setProperty("--p", current[i].toFixed(3))
      })
      raf = moving ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      kick()
    }
    const onLeave = () => {
      px = -9999
      py = -9999
      kick()
    }
    field.addEventListener("pointermove", onMove)
    field.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      field.removeEventListener("pointermove", onMove)
      field.removeEventListener("pointerleave", onLeave)
    }
  }, [reduce])

  return (
    <div aria-hidden="true" className={styles.iconField} ref={ref}>
      {ICONS.map((Icon, i) => (
        <span data-cell="" key={i}>
          <Icon />
        </span>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- */

function ShaderTile() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  // Mount the WebGL context only once the tile is near the viewport.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        io.disconnect()
      }
    }, { rootMargin: "200px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      aria-hidden="true"
      className={styles.shaderFill}
      ref={ref}
      style={{ background: "linear-gradient(135deg, #4c6ef5, #b197fc, #12b886)" }}
    >
      {visible ? (
        <Grainient
          className="size-full"
          color1="#4c6ef5"
          color2="#b197fc"
          color3="#12b886"
          grainAmount={0.1}
        />
      ) : null}
    </div>
  )
}

export function CollectionsBento({ iconCount }: { iconCount: string }) {
  return (
    <div className={styles.bento}>
      <article className={styles.tile} data-area="icons">
        <div className={styles.tileHead}>
          <h3>{iconCount} icons</h3>
          <CodeTokens code={'import { Rocket } from "honestui/icons"'} />
        </div>
        <IconField />
      </article>

      <article className={styles.tile} data-area="chart">
        <div className={styles.tileHead}>
          <h3>Charts</h3>
          <CodeTokens code={'import { AreaChart } from "honestui/charts"'} />
        </div>
        <p className={styles.tileNote}>Sample data: monthly bike rentals.</p>
        <div className={styles.chartFill}>
          <LandingAreaChart />
        </div>
      </article>

      <article className={styles.tile} data-area="shader">
        <ShaderTile />
        <div className={styles.tileHead} data-on-media="">
          <h3>Shaders</h3>
          <CodeTokens code={'import { Grainient } from "honestui/shaders"'} onMedia />
        </div>
      </article>
    </div>
  )
}
