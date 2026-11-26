"use client";

import { SankeyChart, type ChartConfig } from "@/registry/default/charts/sankey-chart";

const chartConfig = {
  Search: { label: "Search", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

export function LoadingSankeyChart() {
  return (
    <SankeyChart
      data={[]}
      config={chartConfig}
      sourceKey="from"
      targetKey="to"
      valueKey="visitors"
      isLoading
      className="h-full w-full p-4"
    >
      <SankeyChart.Labels />
      <SankeyChart.Tooltip />
      <SankeyChart.Nodes />
    </SankeyChart>
  );
}
