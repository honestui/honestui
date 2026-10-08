import "server-only";

import { allIcons } from "honestui/icons";
import { allLogos } from "honestui/logos";
import { allVectors } from "honestui/vectors";
import {
  ASSET_CATEGORIES,
  getAssetCategorySummary,
  type AssetCollection,
} from "@/globals/constants/icon-categories";
import type { AssetGroup } from "@/lib/asset-catalog";
import type { ComponentType, SVGProps } from "react";

interface AssetEntry {
  Component: ComponentType<
    SVGProps<SVGSVGElement> & {
      size?: number | string;
      strokeWidth?: number;
    }
  >;
  metadata: {
    id: string;
    baseId: string;
    name: string;
    variant: string;
    tags: readonly string[];
  };
}

type AssetCatalog = Record<string, Record<string, AssetEntry>>;

const catalogs: Record<AssetCollection, AssetCatalog> = {
  icons: allIcons as unknown as AssetCatalog,
  logos: allLogos as unknown as AssetCatalog,
  vectors: allVectors as unknown as AssetCatalog,
};

export function getAssetCategory(collection: AssetCollection, slug: string) {
  const category = getAssetCategorySummary(collection, slug);
  if (!category) return null;

  const icons = catalogs[collection][category.sourceKey];
  if (!icons) return null;

  const count = Object.keys(icons).length;
  if (count !== category.count) {
    throw new Error(
      `Asset count mismatch for ${collection}/${category.slug}: expected ${category.count}, received ${count}. Update globals/constants/icon-categories.ts.`,
    );
  }

  return { ...category, count, icons };
}

function toAssetGroup(collection: AssetCollection, slug: string): AssetGroup | null {
  const category = getAssetCategory(collection, slug);
  if (!category) return null;

  return {
    slug: category.slug,
    sourceKey: category.sourceKey,
    name: category.name,
    assets: Object.entries(category.icons)
      .map(([exportName, { metadata }]) => ({
        exportName,
        name: metadata.name,
        variant: metadata.variant,
        baseId: metadata.baseId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name) || a.variant.localeCompare(b.variant)),
  };
}

/** The serializable index the asset browser searches; SVG components load separately. */
export function getAssetGroups(collection: AssetCollection, slug?: string): AssetGroup[] {
  const slugs = slug ? [slug] : ASSET_CATEGORIES[collection].map((category) => category.slug);

  return slugs.flatMap((categorySlug) => toAssetGroup(collection, categorySlug) ?? []);
}
