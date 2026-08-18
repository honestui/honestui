import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]">
      <a
        href="#compare-main"
        className="sr-only z-50 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-primary)] px-[var(--hui-space-5)] py-[var(--hui-space-4)] text-sm font-medium shadow-[var(--hui-shadow-lifted)] outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:[outline:var(--hui-focus-ring)]"
      >
        Skip to comparison content
      </a>
      <SiteHeader />
      {children}
      <footer className="mt-auto border-t-[0.5px] border-[var(--hui-color-border-base-primary)]">
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-4 px-5 py-7 text-sm text-[var(--hui-color-foreground-base-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>MIT licensed. Source-first by design.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
              href="/docs/component-guide"
            >
              Components
            </Link>
            <Link
              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
              href="/docs/get-started"
            >
              Get started
            </Link>
            <Link
              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
              href="/privacy"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
