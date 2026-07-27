import {
  IconCategoryBrowser,
  type IconCatalogItem,
} from "@/components/docs/icons/icon-category-browser";
import { ICON_CATEGORIES, getIconCategorySummary } from "@/globals/constants/icon-categories";
import { getIconCategory } from "@/lib/icon-library";
import { absoluteUrl } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommandBlock } from "@/components/docs/mdx/components/command-block";

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
  const category = getIconCategory(slug);
  if (!category) notFound();

  const icons: IconCatalogItem[] = Object.entries(category.icons)
    .map(([exportName, entry]) => {
      const Icon = entry.Component;
      return {
        exportName,
        id: entry.metadata.id,
        name: entry.metadata.name,
        variant: entry.metadata.variant,
        tags: [...(entry.metadata.tags ?? [])],
        preview: <Icon aria-hidden="true" size={28} strokeWidth={1.6} />,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 pb-32">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">
          {category.name} Icons
        </h1>
        <p className="text-muted-foreground mt-1 text-[15px]">
          Browse every {category.name.toLowerCase()} icon, then copy its install, import, or usage
          command.
        </p>
      </div>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-lg font-medium">Installation</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Install the package once, then import any icon by name from{" "}
          <code>honestui/icons</code>.
        </p>
        <CommandBlock commands={["honestui"]} />
      </section>

      <IconCategoryBrowser categoryName={category.name} icons={icons} />
    </main>
  );
}
