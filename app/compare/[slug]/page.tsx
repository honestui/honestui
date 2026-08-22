import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "honestui/icons";
import { notFound } from "next/navigation";

import { mdxComponents } from "@/components/docs/mdx";
import { Button } from "@/components/ui/button";
import {
  getPublishedComparison,
  getPublishedComparisons,
  type PublishedComparison,
} from "@/lib/comparisons";
import { absoluteUrl, SITE_URL } from "@/lib/utils";

export function generateStaticParams() {
  return getPublishedComparisons().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPublishedComparison(slug);

  if (!page) return {};

  const url = absoluteUrl(page.url);
  const image = absoluteUrl(page.data.image);

  return {
    title: { absolute: page.data.metaTitle },
    description: page.data.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Honest UI",
      title: page.data.metaTitle,
      description: page.data.description,
      publishedTime: page.data.publishedAt,
      modifiedTime: page.data.updatedAt,
      authors: [page.data.author],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: page.data.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.data.metaTitle,
      description: page.data.description,
      images: [image],
    },
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function buildComparisonJsonLd(page: PublishedComparison) {
  const url = absoluteUrl(page.url);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.data.title,
        description: page.data.description,
        url,
        mainEntityOfPage: url,
        image: absoluteUrl(page.data.image),
        datePublished: page.data.publishedAt,
        dateModified: page.data.updatedAt,
        inLanguage: "en",
        isAccessibleForFree: true,
        author: {
          "@type": "Person",
          name: page.data.author,
          ...(page.data.authorUrl ? { url: page.data.authorUrl } : {}),
        },
        citation: page.data.sources,
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Comparisons",
            item: absoluteUrl("/compare"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.data.title,
            item: url,
          },
        ],
      },
    ],
  };
}

export default async function ComparisonArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPublishedComparison(slug);

  if (!page) notFound();

  const Article = page.data.body;
  const hasDistinctUpdate = page.data.updatedAt !== page.data.publishedAt;

  return (
    <main id="compare-main" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildComparisonJsonLd(page)).replace(/</g, "\\u003c"),
        }}
      />
      <article className="mx-auto w-full max-w-[64rem] px-5 py-12 sm:px-8 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--hui-color-foreground-base-secondary)]">
            <li>
              <Link className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]" href="/compare">
                Comparisons
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page">{page.data.competitor}</li>
          </ol>
        </nav>

        <header className="max-w-[48rem]">
          <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02] font-medium tracking-[var(--hui-letter-spacing-t4)] text-balance">
            {page.data.title}
          </h1>
          <p className="mt-6 max-w-[46rem] text-lg leading-7 text-[var(--hui-color-foreground-base-secondary)]">
            {page.data.description}
          </p>
          <dl
            aria-label="Article information"
            className="mt-9 flex flex-wrap gap-x-10 gap-y-5"
          >
            <div>
              <dt className="text-xs leading-4 font-medium tracking-wide text-[var(--hui-color-foreground-base-secondary)] uppercase">
                Written by
              </dt>
              <dd className="mt-1 text-sm leading-5 font-medium">
                {page.data.authorUrl ? (
                  <Link
                    className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
                    href={page.data.authorUrl}
                  >
                    {page.data.author}
                  </Link>
                ) : (
                  page.data.author
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs leading-4 font-medium tracking-wide text-[var(--hui-color-foreground-base-secondary)] uppercase">
                Published
              </dt>
              <dd className="mt-1 text-sm leading-5 font-medium tabular-nums">
                <time dateTime={page.data.publishedAt}>
                  {formatDate(page.data.publishedAt)}
                </time>
              </dd>
            </div>
            {hasDistinctUpdate ? (
              <div>
                <dt className="text-xs leading-4 font-medium tracking-wide text-[var(--hui-color-foreground-base-secondary)] uppercase">
                  Updated
                </dt>
                <dd className="mt-1 text-sm leading-5 font-medium tabular-nums">
                  <time dateTime={page.data.updatedAt}>
                    {formatDate(page.data.updatedAt)}
                  </time>
                </dd>
              </div>
            ) : null}
            {page.data.reviewedBy ? (
              <div>
                <dt className="text-xs leading-4 font-medium tracking-wide text-[var(--hui-color-foreground-base-secondary)] uppercase">
                  Reviewed by
                </dt>
                <dd className="mt-1 text-sm leading-5 font-medium">
                  {page.data.reviewedBy}
                </dd>
              </div>
            ) : null}
          </dl>
        </header>

        <div className="mt-12 max-w-full text-base leading-7 text-[var(--hui-color-foreground-base-primary)] [&>:not([role=region])]:max-w-[48rem] [&_[role=region]_table]:min-w-[56rem] [&_[role=region]_td]:align-top [&_[role=region]_td]:whitespace-normal [&_[role=region]_th]:align-top">
          <Article components={mdxComponents} />
        </div>

        <footer className="mt-16 max-w-[48rem] border-t-[0.5px] border-[var(--hui-color-border-base-primary)] pt-8">
          <h2 className="text-xl font-medium">Review HonestUI before you decide</h2>
          <p className="mt-3 max-w-[38rem] leading-7 text-[var(--hui-color-foreground-base-secondary)]">
            Check the component source, installation model, and current collections in the documentation.
          </p>
          <Button
            className="mt-6"
            render={<Link href="/docs/component-guide" />}
            size="lg"
          >
            Explore HonestUI components
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </footer>
      </article>
    </main>
  );
}

export const dynamic = "force-static";
export const revalidate = false;
