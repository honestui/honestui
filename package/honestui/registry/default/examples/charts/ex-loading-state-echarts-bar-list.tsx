"use client";

import { BarList, type ChartConfig } from "@/registry/default/charts/bar-list";

const chartConfig = {
  visitors: {
    label: "Visitors",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarListLoading() {
  return (
    <BarList
      data={[]}
      config={chartConfig}
      nameKey="visitors"
      valueKey="visitors"
      nameLabel="Page"
      valueLabel="Visitors"
      isLoading
      className="w-full max-w-md"
    />
  );
}
