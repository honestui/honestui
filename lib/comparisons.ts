import { loader } from "fumadocs-core/source";
import { comparisons } from "@/.source/server";

export const comparisonSource = loader({
  baseUrl: "/compare",
  source: comparisons.toFumadocsSource(),
});

export type ComparisonPage = ReturnType<
  typeof comparisonSource.getPages
>[number];

const publicationFields = [
  "author",
  "image",
  "publishedAt",
  "sources",
  "updatedAt",
] as const;

type PublicationField = (typeof publicationFields)[number];

type PublishedComparisonData = ComparisonPage["data"] & {
  draft: false;
} & Required<Pick<ComparisonPage["data"], PublicationField>>;

export type PublishedComparison = Omit<ComparisonPage, "data"> & {
  data: PublishedComparisonData;
};

function toPublishedComparison(
  page: ComparisonPage,
): PublishedComparison | undefined {
  if (page.data.draft !== false) return undefined;

  const missingFields = publicationFields.filter((field) => {
    const value = page.data[field];
    return value === undefined || value === "";
  });

  if (missingFields.length > 0) {
    throw new Error(
      `${page.path}: published comparison is missing ${missingFields.join(", ")}`,
    );
  }

  return page as PublishedComparison;
}

export function getPublishedComparisons(): PublishedComparison[] {
  return comparisonSource
    .getPages()
    .map(toPublishedComparison)
    .filter((page): page is PublishedComparison => page !== undefined)
    .sort((a, b) => a.data.competitor.localeCompare(b.data.competitor));
}

export function getPublishedComparison(
  slug: string,
): PublishedComparison | undefined {
  const page = comparisonSource.getPage([slug]);

  if (!page || page.slugs.length !== 1) {
    return undefined;
  }

  return toPublishedComparison(page);
}
