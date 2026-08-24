import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";
import {
  ICON_CATEGORIES,
  LOGO_CATEGORIES,
  VECTOR_CATEGORIES,
} from "@/globals/constants/icon-categories";
import { getPublishedComparisons } from "@/lib/comparisons";
import { HONEST_UI_EXAMPLES } from "@/lib/examples";

export const dynamic = "force-static";
export const revalidate = false;

function comparisonLastModified(updatedAt: string) {
  return new Date(`${updatedAt}T00:00:00Z`);
}

function contentLastmod(file: string | undefined): Date | undefined {
  if (!file) return undefined;
  const filePath = path.join(process.cwd(), "content", "docs", file);
  if (!existsSync(filePath)) return undefined;
  try {
    const committedAt = execFileSync(
      "git",
      ["log", "-1", "--format=%aI", "--", path.join("content", "docs", file)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (committedAt) return new Date(committedAt);
  } catch {
    // Git history unavailable; fall through to the file mtime.
  }
  return statSync(filePath).mtime;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const publishedComparisons = getPublishedComparisons();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(""),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/docs"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/developers"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/contact"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/privacy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const docsEntries: MetadataRoute.Sitemap = source.getPages().map((page) => {
    const segments = page.slugs.length;
    const priority = segments === 0 ? 0.9 : segments === 1 ? 0.8 : 0.7;

    return {
      url: absoluteUrl(page.url),
      lastModified: contentLastmod(page.path),
      changeFrequency: "weekly",
      priority,
    };
  });

  const exampleEntries: MetadataRoute.Sitemap = HONEST_UI_EXAMPLES.map((example) => ({
    url: absoluteUrl(example.previewHref),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const iconCategoryEntries: MetadataRoute.Sitemap = ICON_CATEGORIES.map((category) => ({
    url: absoluteUrl(`/docs/icons/categories/${category.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const assetCollectionEntries: MetadataRoute.Sitemap = ["logos", "vectors"].flatMap(
    (collection) => {
      const categories = collection === "logos" ? LOGO_CATEGORIES : VECTOR_CATEGORIES;

      return [
        {
          url: absoluteUrl(`/docs/icons/${collection}`),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
        ...categories.map((category) => ({
          url: absoluteUrl(`/docs/icons/${collection}/categories/${category.slug}`),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ];
    },
  );

  const comparisonEntries: MetadataRoute.Sitemap =
    publishedComparisons.length === 0
      ? []
      : [
          {
            url: absoluteUrl("/compare"),
            lastModified: publishedComparisons
              .map((page) => comparisonLastModified(page.data.updatedAt))
              .sort((a, b) => b.getTime() - a.getTime())[0],
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
          ...publishedComparisons.map((page) => ({
            url: absoluteUrl(page.url),
            lastModified: comparisonLastModified(page.data.updatedAt),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          })),
        ];

  const seen = new Set<string>();
  return [
    ...staticEntries,
    ...docsEntries,
    ...exampleEntries,
    ...iconCategoryEntries,
    ...assetCollectionEntries,
    ...comparisonEntries,
  ].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
