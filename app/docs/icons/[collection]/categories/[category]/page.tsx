import { AssetCategoryPage } from "@/components/docs/icons/asset-category-page";
import {
  ASSET_CATEGORIES,
  getAssetCategorySummary,
  type AssetCollection,
} from "@/globals/constants/icon-categories";
import { absoluteUrl } from "@/lib/utils";
import { getAssetCategory } from "@/lib/icon-library";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const supportedCollections = ["logos", "vectors"] as const;

function isSupportedCollection(value: string): value is (typeof supportedCollections)[number] {
  return supportedCollections.includes(value as (typeof supportedCollections)[number]);
}

export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return supportedCollections.flatMap((collection) =>
    ASSET_CATEGORIES[collection].map((category) => ({ collection, category: category.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; category: string }>;
}): Promise<Metadata> {
  const { collection, category: slug } = await params;
  if (!isSupportedCollection(collection)) return {};

  const categorySummary = getAssetCategorySummary(collection, slug);
  const category = getAssetCategory(collection, slug);
  if (!categorySummary || !category) return {};

  const title = `${categorySummary.name} ${collection === "logos" ? "Logos" : "Vectors"}`;
  const description = `Browse ${category.count} assets in the ${categorySummary.name} ${collection} collection and copy their React imports.`;
  const url = absoluteUrl(`/docs/icons/${collection}/categories/${categorySummary.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function CollectionCategoryPage({
  params,
}: {
  params: Promise<{ collection: string; category: string }>;
}) {
  const { collection, category } = await params;
  if (!isSupportedCollection(collection)) notFound();

  return <AssetCategoryPage collection={collection as AssetCollection} slug={category} />;
}
