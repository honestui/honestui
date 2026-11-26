"use client";

import { CategoryBar, type ChartConfig } from "@/registry/default/charts/category-bar";

const chartConfig = {
  used: { label: "Used", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

export function ExampleCategoryBarLoading() {
  return (
    <CategoryBar
      data={[]}
      config={chartConfig}
      nameKey="type"
      valueKey="value"
      isLoading
      className="w-full max-w-md py-4"
    />
  );
}
