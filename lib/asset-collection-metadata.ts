import type { AssetCollection } from "@/globals/constants/icon-categories";
import { getAssetCollectionHref } from "@/lib/asset-catalog";
import { source } from "@/lib/source";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";

/**
 * The collection browsers replace the rendered MDX pages at these URLs, but the
 * MDX files remain the source of each page's title, description, and Markdown
 * alternate, so search metadata and the `.md` routes stay in agreement.
 */
export function getAssetCollectionMetadata(collection: AssetCollection): Metadata {
  const page = source.getPage(collection === "icons" ? ["icons"] : ["icons", collection]);
  if (!page) return {};

  const title = page.data.metaTitle ?? page.data.title;
  const description = page.data.metaDescription ?? page.data.description;
  const path = getAssetCollectionHref(collection);
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url, types: { "text/markdown": `${path}.md` } },
    openGraph: { title, description, url, type: "article" },
  };
}
