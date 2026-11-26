"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

const chartConfig = {
  revenue: { label: "Revenue", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  conversion: { label: "Conversion rate", colors: { light: ["#ea580c"], dark: ["#f97316"] } },
} satisfies ChartConfig;

export function ExampleLoadingComboChart() {
  return (
    <ComboChart data={[]} config={chartConfig} isLoading className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis />
      <ComboChart.Bar dataKey="revenue" />
      <ComboChart.Line dataKey="conversion" />
    </ComboChart>
  );
}
