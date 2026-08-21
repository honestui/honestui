import type { Metadata } from "next"

import { LandingShowcase } from "@/components/landing-showcase"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: {
    absolute: "Honest UI — Source-First React Components",
  },
  description:
    "Thoughtful React components, charts, icons, and visual effects with good defaults, visible source, and no lock-in.",
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": "/index.md",
    },
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-sm font-medium shadow-[var(--hui-shadow-lifted)] outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:[outline:var(--hui-focus-ring)]"
      >
        Skip to main content
      </a>

      <SiteHeader />

      <LandingShowcase />
    </div>
  )
}
