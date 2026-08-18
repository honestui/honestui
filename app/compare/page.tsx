import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublishedComparisons } from "@/lib/comparisons";
import { absoluteUrl } from "@/lib/utils";

const pageTitle = "Compare Honest UI with other React UI libraries";
const pageDescription =
  "Compare HonestUI with other React libraries by source ownership, installation, styling, accessibility, included tools, and license.";

export function generateMetadata(): Metadata {
  const hasPublishedComparisons = getPublishedComparisons().length > 0;

  return {
    title: { absolute: pageTitle },
    description: pageDescription,
    alternates: { canonical: absoluteUrl("/compare") },
    robots: {
      index: hasPublishedComparisons,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: absoluteUrl("/compare"),
      siteName: "Honest UI",
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: absoluteUrl("/og/og-image.png"),
          width: 1200,
          height: 630,
          alt: "Honest UI",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [absoluteUrl("/og/og-image.png")],
    },
  };
}

export default function CompareDirectoryPage() {
  const comparisons = getPublishedComparisons();

  return (
    <main id="compare-main" tabIndex={-1}>
      <div className="mx-auto w-full max-w-[64rem] px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-24">
        <header className="max-w-[42rem]">
          <h1 className="text-[clamp(2.375rem,10vw,3.25rem)]! leading-[0.94]! font-medium tracking-[var(--hui-letter-spacing-t4)]">
            Compare HonestUI
          </h1>
          <p className="mt-7 text-lg leading-7 text-[var(--hui-color-foreground-base-secondary)]">
            See how HonestUI differs from other React libraries in source ownership, installation, styling, accessibility, included tools, and license.
          </p>
        </header>

        <section aria-labelledby="published-comparisons" className="mt-16 sm:mt-20">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="published-comparisons" className="text-xl font-medium">
              Published guides
            </h2>
            <p className="text-sm tabular-nums text-[var(--hui-color-foreground-base-secondary)]">
              {comparisons.length} published
            </p>
          </div>

          {comparisons.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2">
              {comparisons.map((comparison) => (
                <li key={comparison.url}>
                  <Link
                    className="group flex h-full min-h-52 flex-col gap-5 rounded-[var(--hui-radius-5)] bg-[var(--hui-color-background-base-primary)] p-6 shadow-[var(--hui-shadow-lifted)] ring-[0.5px] ring-[var(--hui-color-border-base-primary)] outline-none motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:outline-offset-4"
                    href={comparison.url}
                  >
                    <span className="text-xl leading-7 font-medium">
                      {comparison.data.title}
                    </span>
                    <span className="text-sm leading-6 text-[var(--hui-color-foreground-base-secondary)]">
                      {comparison.data.description}
                    </span>
                    <span className="mt-auto flex items-center gap-2 text-sm font-medium text-[var(--hui-color-foreground-accent-primary)]">
                      Read guide
                      <ArrowRight aria-hidden="true" className="size-4 transition-transform motion-safe:group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="max-w-[42rem] rounded-[var(--hui-radius-5)] bg-[var(--hui-color-background-base-primary)] p-6 shadow-[var(--hui-shadow-lifted)] ring-[0.5px] ring-[var(--hui-color-border-base-primary)]">
              <div>
                <h3 className="text-lg font-medium">No guides are published yet</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--hui-color-foreground-base-secondary)]">
                  Drafts stay private until their claims, sources, and recommendations have been reviewed.
                </p>
              </div>
              <Button className="mt-6" render={<Link href="/docs/component-guide" />} variant="outline">
                Browse components
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-static";
export const revalidate = false;
