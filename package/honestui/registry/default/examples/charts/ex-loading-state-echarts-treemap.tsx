"use client";

import { Treemap, type ChartConfig } from "@/registry/default/charts/treemap";

const chartConfig = {
  compute: { label: "Compute", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

export function LoadingTreemap() {
  return (
    <Treemap data={[]} config={chartConfig} isLoading className="h-full w-full p-4">
      <Treemap.Tooltip />
      <Treemap.Tiles />
    </Treemap>
  );
}
