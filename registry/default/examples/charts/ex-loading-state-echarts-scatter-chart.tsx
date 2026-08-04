"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Loan applications
const data = [{ x: 12, y: 23 }];
const chartConfig = {
  applications: { label: "Applications", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
} satisfies ChartConfig;

export function LoadingScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="x"
      yDataKey="y"
      className="h-full w-full p-4"
      isLoading
    >
      <ScatterChart.XAxis />
      <ScatterChart.YAxis />
      <ScatterChart.Scatter dataKey="applications" />
    </ScatterChart>
  );
}
