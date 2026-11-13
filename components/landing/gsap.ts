"use client"

import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

// Registered once for every landing section. Client-only: ScrollTrigger reads
// layout and SplitText rewrites the DOM, neither of which can run on the server.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
}

export const MOTION_OK = "(prefers-reduced-motion: no-preference)"

export { gsap, ScrollTrigger, SplitText, useGSAP }
