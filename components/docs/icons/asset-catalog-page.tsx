import { AssetBrowser } from "@/components/docs/icons/asset-browser";
import type { AssetCollection } from "@/globals/constants/icon-categories";
import { ASSET_COLLECTION_LABELS, getAssetCollectionHref } from "@/lib/asset-catalog";
import { getAssetGroups } from "@/lib/icon-library";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const collectionSummaries: Record<AssetCollection, string> = {
  icons: "Interface symbols for actions, navigation, status, content types, and product concepts.",
  logos: "Brand marks, wordmarks, flags, payment symbols, and technology identities.",
  vectors: "Abstract shapes, hand-drawn accents, people, patterns, and decorative illustrations.",
};

const linkClassName =
  "text-foreground underline underline-offset-2 outline-none focus-visible:[outline:var(--hui-focus-ring)]";

export function AssetCatalogPage({
  collection,
  categorySlug,
}: {
  collection: AssetCollection;
  /** Omit to browse the whole collection. */
  categorySlug?: string;
}) {
  const groups = getAssetGroups(collection, categorySlug);
  if (groups.length === 0) notFound();

  const labels = ASSET_COLLECTION_LABELS[collection];
  const importPath = `honestui/${collection}`;
  const category = categorySlug ? groups[0] : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 pb-32">
      <div className="max-w-2xl">
        {category ? (
          <p className="mb-2 text-sm font-medium">
            <Link href={getAssetCollectionHref(collection)} className={linkClassName}>
              All {labels.plural}
            </Link>
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">
          {category ? `${category.name} ${labels.title}` : labels.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-[15px]">
          {category
            ? `${category.assets.length.toLocaleString()} ${labels.plural} in the ${category.name} category.`
            : collectionSummaries[collection]}{" "}
          Select one to preview it and copy its import from <code>{importPath}</code>.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          New to these assets? Read{" "}
          <Link href="/docs/icons/installation" className={linkClassName}>
            Installation
          </Link>
          ,{" "}
          <Link href="/docs/icons/usage" className={linkClassName}>
            Usage
          </Link>
          , and{" "}
          <Link href="/docs/icons/accessibility" className={linkClassName}>
            Accessibility
          </Link>
          .
        </p>
      </div>

      {/* The browser reads its search from the URL, which only exists in the browser. */}
      <Suspense
        fallback={
          <p className="text-muted-foreground mt-8 text-sm" role="status">
            Loading {labels.plural}…
          </p>
        }
      >
        <AssetBrowser collection={collection} groups={groups} categorySlug={categorySlug} />
      </Suspense>
    </div>
  );
}
