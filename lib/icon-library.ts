import "server-only";

import { allIcons } from "honestui/icons";
import { allLogos } from "honestui/logos";
import { allVectors } from "honestui/vectors";
import {
  getAssetCategorySummary,
  type AssetCollection,
} from "@/globals/constants/icon-categories";
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

export function getIconCategory(slug: string) {
  return getAssetCategory("icons", slug);
}

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
