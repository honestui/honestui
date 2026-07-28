import "server-only";

import { allIcons } from "honestui/icons";
import { getIconCategorySummary } from "@/globals/constants/icon-categories";

export function getIconCategory(slug: string) {
  const category = getIconCategorySummary(slug);
  if (!category) return null;

  const icons = allIcons[category.sourceKey];
  if (!icons) return null;

  return { ...category, icons };
}
