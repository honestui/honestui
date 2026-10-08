import type { AssetCollection } from "@/globals/constants/icon-categories";

export interface AssetSummary {
  exportName: string;
  name: string;
  variant: string;
  baseId: string;
}

export interface AssetGroup {
  slug: string;
  sourceKey: string;
  name: string;
  assets: AssetSummary[];
}

export interface AssetMatch {
  asset: AssetSummary;
  group: AssetGroup;
}

export const ALL_VARIANTS = "all";

export const ASSET_COLLECTION_LABELS: Record<
  AssetCollection,
  { title: string; plural: string; singular: string }
> = {
  icons: { title: "Icons", plural: "icons", singular: "icon" },
  logos: { title: "Logos", plural: "logos", singular: "logo" },
  vectors: { title: "Vectors", plural: "vectors", singular: "vector" },
};

const variantLabels: Record<string, string> = {
  default: "Default",
  doodle: "Doodle",
  filled: "Filled",
  rounded: "Rounded",
  shapes: "Shapes",
  sketch: "Sketch",
  pattern: "Pattern",
  texture: "Texture",
  character: "Character",
  symbols: "Symbol",
  wordmark: "Wordmark",
};

export function formatVariant(variant: string) {
  return (
    variantLabels[variant] ??
    variant.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase())
  );
}

export function getAssetCollectionHref(collection: AssetCollection) {
  return collection === "icons" ? "/docs/icons" : `/docs/icons/${collection}`;
}

export function getAssetCategoryHref(collection: AssetCollection, slug: string) {
  return `${getAssetCollectionHref(collection)}/categories/${slug}`;
}

export function getAssetImportCode(exportName: string, importPath: string) {
  return `import { ${exportName} } from "${importPath}";`;
}

export function getAssetJsxCode(exportName: string) {
  return `<${exportName} size={24} aria-hidden="true" />`;
}

export function listVariants(groups: AssetGroup[]) {
  return [...new Set(groups.flatMap((group) => group.assets.map((asset) => asset.variant)))].sort();
}

export function filterGroupsByVariant(groups: AssetGroup[], variant: string): AssetGroup[] {
  if (variant === ALL_VARIANTS) return groups;

  return groups
    .map((group) => ({
      ...group,
      assets: group.assets.filter((asset) => asset.variant === variant),
    }))
    .filter((group) => group.assets.length > 0);
}

// Lower is better. A term that only matches the category or style ranks last,
// so "arrow" lists assets named Arrow before everything else in Arrows.
function rankTerm(term: string, name: string, exportName: string, context: string) {
  if (name === term) return 0;
  if (name.startsWith(term)) return 1;
  if (name.includes(` ${term}`)) return 2;
  if (name.includes(term) || exportName.includes(term)) return 3;
  if (context.includes(term)) return 4;
  return null;
}

export function searchAssets(groups: AssetGroup[], query: string, variant: string): AssetMatch[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const ranked: Array<AssetMatch & { rank: number }> = [];

  for (const group of filterGroupsByVariant(groups, variant)) {
    for (const asset of group.assets) {
      const name = asset.name.toLowerCase();
      const exportName = asset.exportName.toLowerCase();
      const context = `${group.name} ${formatVariant(asset.variant)}`.toLowerCase();
      let rank = 0;

      for (const term of terms) {
        const termRank = rankTerm(term, name, exportName, context);
        if (termRank === null) {
          rank = -1;
          break;
        }
        rank += termRank;
      }

      if (rank >= 0) ranked.push({ asset, group, rank });
    }
  }

  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.asset.name.length - b.asset.name.length ||
        a.asset.name.localeCompare(b.asset.name) ||
        a.asset.exportName.localeCompare(b.asset.exportName),
    )
    .map(({ asset, group }) => ({ asset, group }));
}
