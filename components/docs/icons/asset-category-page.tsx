import {
  IconCategoryBrowser,
  type IconCatalogItem,
} from "@/components/docs/icons/icon-category-browser";
import { CommandBlock } from "@/components/docs/mdx/components/command-block";
import type { AssetCollection } from "@/globals/constants/icon-categories";
import { getAssetCategory } from "@/lib/icon-library";
import Link from "next/link";
import { notFound } from "next/navigation";

const collectionLabels: Record<AssetCollection, string> = {
  icons: "Icons",
  logos: "Logos",
  vectors: "Vectors",
};

export function AssetCategoryPage({
  collection,
  slug,
}: {
  collection: AssetCollection;
  slug: string;
}) {
  const category = getAssetCategory(collection, slug);
  if (!category) notFound();

  const importPath = `honestui/${collection}`;
  const items: IconCatalogItem[] = Object.entries(category.icons)
    .map(([exportName, entry]) => {
      const Asset = entry.Component;
      const preview =
        collection === "icons" ? (
          <Asset aria-hidden="true" size={28} strokeWidth={1.6} />
        ) : (
          <Asset aria-hidden="true" size={56} />
        );

      return {
        exportName,
        id: entry.metadata.id,
        name: entry.metadata.name,
        variant: entry.metadata.variant,
        tags: [...(entry.metadata.tags ?? [])],
        preview,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 pb-32">
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">
          {collectionLabels[collection]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">
          {category.name} {collectionLabels[collection]}
        </h1>
        <p className="text-muted-foreground mt-1 text-[15px]">
          Browse {items.length.toLocaleString()} assets in the {category.name} collection. Select
          one to copy its import or React usage.
        </p>
      </div>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-lg font-medium">Install once</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Install `honestui`, then import any {collection.slice(0, -1)} by name from{" "}
          <code>{importPath}</code>. See the <Link href="/docs/icons/installation">installation guide</Link>{" "}
          for requirements and entry points.
        </p>
        <CommandBlock commands={["honestui"]} />
      </section>

      <IconCategoryBrowser
        categoryName={category.name}
        icons={items}
        collection={collection}
        importPath={importPath}
      />
    </div>
  );
}
