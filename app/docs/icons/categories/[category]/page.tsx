import { AssetCategoryPage } from "@/components/docs/icons/asset-category-page";
import { ICON_CATEGORIES, getIconCategorySummary } from "@/globals/constants/icon-categories";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
  return ICON_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getIconCategorySummary(slug);
  if (!category) return {};

  const title = `${category.name} Icons`;
  const description = `Browse all ${category.count} ${category.name.toLowerCase()} icons and copy their React imports.`;
  const url = absoluteUrl(`/docs/icons/categories/${category.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function IconCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  return <AssetCategoryPage collection="icons" slug={slug} />;
}
