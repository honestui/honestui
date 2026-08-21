import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Page not found",
};

const recoveryLinks = [
  { href: "/docs", label: "Documentation index" },
  { href: "/sitemap.xml", label: "XML sitemap" },
  { href: "/llms.txt", label: "Agent documentation index" },
  { href: "/openapi.json", label: "OpenAPI specification" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
        <p className="font-mono text-sm text-[var(--hui-color-foreground-base-secondary)]">
          HTTP 404
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[var(--hui-letter-spacing-t4)] sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-7 text-[var(--hui-color-foreground-base-secondary)]">
          Honest UI doesn’t have a page at this URL. Use one of these indexes to find the component, guide, or machine-readable resource you need.
        </p>
        <nav aria-label="404 recovery" className="mt-8">
          <ul className="grid gap-3 sm:grid-cols-2">
            {recoveryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="block rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] px-5 py-4 font-medium outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)]"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
