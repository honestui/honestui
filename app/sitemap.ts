import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";
import { ICON_CATEGORIES } from "@/globals/constants/icon-categories";

export const dynamic = "force-static";
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // "/" is absent on purpose: it redirects to /docs, and a sitemap should only
  // list canonical URLs that return 200.
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/docs"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
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

  const iconCategoryEntries: MetadataRoute.Sitemap = ICON_CATEGORIES.map((category) => ({
    url: absoluteUrl(`/docs/icons/categories/${category.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const seen = new Set<string>();
  return [...staticEntries, ...docsEntries, ...iconCategoryEntries].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
