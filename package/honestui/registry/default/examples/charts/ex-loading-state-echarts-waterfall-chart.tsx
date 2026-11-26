"use client";

import { WaterfallChart, type ChartConfig } from "@/registry/default/charts/waterfall-chart";

const chartConfig = {
  increase: { label: "Increase", colors: { light: ["#16a34a"], dark: ["#22c55e"] } },
  decrease: { label: "Decrease", colors: { light: ["#dc2626"], dark: ["#f87171"] } },
  total: { label: "Total", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

export function ExampleLoadingWaterfallChart() {
  return (
    <WaterfallChart
      data={[]}
      config={chartConfig}
      xDataKey="step"
      valueDataKey="amount"
      isLoading
      className="h-full w-full p-4"
    >
      <WaterfallChart.Grid />
      <WaterfallChart.Bars />
    </WaterfallChart>
  );
}
