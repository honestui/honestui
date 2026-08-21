import Link from "next/link"

import { BrandWordmark } from "@/components/brand-wordmark"

export function PublicContentLayout({
  children,
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode
  description: React.ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <div className="min-h-screen bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]">
      <a
        className="sr-only z-50 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-sm font-medium shadow-[var(--hui-shadow-lifted)] outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:[outline:var(--hui-focus-ring)]"
        href="#main-content"
      >
        Skip to main content
      </a>

      <header className="border-b border-[var(--hui-color-border-base-primary)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            aria-label="Honest UI home"
            className="rounded-[var(--hui-radius-2)] outline-none focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
            href="/"
          >
            <BrandWordmark className="text-[17px]" markClassName="size-7" />
          </Link>
          <nav aria-label="Site links" className="flex items-center text-sm">
            <Link
              className="rounded-[var(--hui-radius-1)] outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
              href="/docs"
            >
              Documentation
            </Link>
          </nav>
        </div>
      </header>

      <main
        className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20"
        id="main-content"
        tabIndex={-1}
      >
        <p className="text-sm font-medium text-[var(--hui-color-foreground-accent-primary)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
          {title}
        </h1>
        <div className="mt-5 text-lg leading-8 text-[var(--hui-color-foreground-base-secondary)]">
          {description}
        </div>

        <div className="mt-12 space-y-10 text-base leading-7 text-[var(--hui-color-foreground-base-secondary)]">
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--hui-color-border-base-primary)]">
        <nav
          aria-label="Project information"
          className="mx-auto flex max-w-5xl flex-wrap gap-x-5 gap-y-3 px-5 py-8 text-sm text-[var(--hui-color-foreground-base-secondary)] sm:px-8"
        >
          <Link className="hover:underline" href="/about">About Honest UI</Link>
          <Link className="hover:underline" href="/contact">Contact</Link>
          <Link className="hover:underline" href="/privacy">Privacy</Link>
          <a className="hover:underline" href="https://github.com/honestui/honestui">
            GitHub repository
          </a>
        </nav>
      </footer>
    </div>
  )
}

export function ContentSection({
  children,
  id,
  title,
}: {
  children: React.ReactNode
  id: string
  title: string
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        className="text-2xl font-medium text-[var(--hui-color-foreground-base-primary)]"
        id={id}
      >
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}
