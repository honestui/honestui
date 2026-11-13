"use client"

import { useRef, type ElementType, type ReactNode } from "react"

import { gsap, MOTION_OK, SplitText, useGSAP } from "@/components/landing/gsap"
import styles from "@/components/landing/landing.module.css"

/**
 * A React Bits style SplitText, rebuilt on GSAP's SplitText plugin.
 * Characters rise out of a per-line mask. `autoSplit` re-splits when the
 * font finishes loading or the line breaks change, so the mask never clips
 * a reflowed word.
 */
export function SplitReveal({
  as: Tag = "span",
  children,
  className,
  id,
  delay = 0,
  stagger = 0.022,
  trigger = "load",
  type = "chars",
}: {
  as?: ElementType
  children: ReactNode
  className?: string
  id?: string
  delay?: number
  stagger?: number
  trigger?: "load" | "view"
  type?: "chars" | "words"
}) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const element = ref.current
      if (!element) return

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(element, {
          type: type === "chars" ? "lines,words,chars" : "lines,words",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(type === "chars" ? self.chars : self.words, {
              yPercent: 115,
              rotate: 4,
              duration: 1.15,
              ease: "expo.out",
              stagger,
              delay,
              scrollTrigger:
                trigger === "view"
                  ? { trigger: element, start: "top 88%", once: true }
                  : undefined,
            })
          },
        })
        gsap.set(element, { visibility: "visible" })
        return () => split.revert()
      })
      // Reduced motion: show the text as written.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(element, { visibility: "visible" })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <Tag
      className={[styles.splitPending, className].filter(Boolean).join(" ")}
      id={id}
      ref={ref}
    >
      {children}
    </Tag>
  )
}
