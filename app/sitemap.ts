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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publishedComparisons = getPublishedComparisons();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(""),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/docs"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const docsEntries: MetadataRoute.Sitemap = source.getPages().map((page) => {
    const segments = page.slugs.length;
    const priority = segments === 0 ? 0.9 : segments === 1 ? 0.8 : 0.7;

    return {
      url: absoluteUrl(page.url),
      lastModified: now,
      changeFrequency: "weekly",
      priority,
    };
  });

  const exampleEntries: MetadataRoute.Sitemap = HONEST_UI_EXAMPLES.map((example) => ({
    url: absoluteUrl(example.previewHref),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const iconCategoryEntries: MetadataRoute.Sitemap = ICON_CATEGORIES.map((category) => ({
    url: absoluteUrl(`/docs/icons/categories/${category.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const assetCollectionEntries: MetadataRoute.Sitemap = ["logos", "vectors"].flatMap(
    (collection) => {
      const categories = collection === "logos" ? LOGO_CATEGORIES : VECTOR_CATEGORIES;

      return [
        {
          url: absoluteUrl(`/docs/icons/${collection}`),
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
        ...categories.map((category) => ({
          url: absoluteUrl(`/docs/icons/${collection}/categories/${category.slug}`),
          lastModified: now,
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
