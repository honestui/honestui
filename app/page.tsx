import type { Metadata } from "next"
import Link from "next/link"

import { GithubIcon } from "@/assets/icons"
import { BrandWordmark } from "@/components/brand-wordmark"
import ThemeSwitcher from "@/components/docs/sidebar/theme-switcher"
import { LandingShowcase } from "@/components/landing-showcase"
import { Button } from "@/components/ui/button"
import { useGithubStars as getGithubStars } from "@/hooks/use-github-stars"

export const metadata: Metadata = {
  title: {
    absolute: "Honest UI — Source-First React Components",
  },
  description:
    "Thoughtful React components, charts, icons, and visual effects with good defaults, visible source, and no lock-in.",
  alternates: {
    canonical: "/",
  },
}

export default async function Home() {
  const stars = await getGithubStars()

  return (
    <div className="min-h-screen bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-sm font-medium shadow-[var(--hui-shadow-lifted)] outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:[outline:var(--hui-focus-ring)]"
      >
        Skip to main content
      </a>

      <header>
        <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            aria-label="Honest UI home"
            className="rounded-[var(--hui-radius-2)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
          >
            <BrandWordmark className="text-[17px]" markClassName="size-7" />
          </Link>

          <nav aria-label="Site links" className="flex items-center gap-2">
            <Button
              aria-label={
                stars === null
                  ? "Honest UI on GitHub (opens in a new tab)"
                  : `Honest UI on GitHub, ${stars.toLocaleString("en-US")} stars (opens in a new tab)`
              }
              className="h-8"
              render={
                <Link
                  href="https://github.com/honestui/honestui"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              size="sm"
              variant="link"
            >
              <GithubIcon aria-hidden="true" className="size-4" />
              {stars !== null && (
                <span aria-hidden="true" className="text-xs tabular-nums">
                  {stars.toLocaleString("en-US")}
                </span>
              )}
            </Button>
            <ThemeSwitcher />
            <Button
              className="h-8"
              render={
                <Link
                  href="https://connorlove.com"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              size="sm"
              variant="ghost"
            >
              <span className="text-[var(--hui-color-foreground-base-secondary)]">
                Made by Connor
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </Button>
          </nav>
        </div>
      </header>

      <LandingShowcase />
    </div>
  )
}
