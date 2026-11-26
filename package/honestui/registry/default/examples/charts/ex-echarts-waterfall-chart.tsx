"use client";

import { WaterfallChart, type ChartConfig } from "@/registry/default/charts/waterfall-chart";

// Scenario: Quarterly operating income bridge, in thousands
const data = [
  { step: "Revenue", amount: 1840, isTotal: true },
  { step: "Cost of goods", amount: -612 },
  { step: "Gross profit", isTotal: true },
  { step: "Salaries", amount: -428 },
  { step: "Marketing", amount: -186 },
  { step: "Services", amount: 94 },
  { step: "Rent", amount: -72 },
  { step: "Operating income", isTotal: true },
];

const chartConfig = {
  increase: { label: "Increase", colors: { light: ["#16a34a"], dark: ["#22c55e"] } },
  decrease: { label: "Decrease", colors: { light: ["#dc2626"], dark: ["#f87171"] } },
  total: { label: "Total", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

export function ExampleWaterfallChart() {
  return (
    <WaterfallChart
      data={data}
      config={chartConfig}
      xDataKey="step"
      valueDataKey="amount"
      totalDataKey="isTotal"
      className="h-full w-full p-4"
    >
      <WaterfallChart.Grid />
      <WaterfallChart.XAxis />
      <WaterfallChart.YAxis tickFormatter={(value) => `$${value}k`} />
      <WaterfallChart.Legend />
      <WaterfallChart.Tooltip valueFormatter={(value) => `$${value.toLocaleString()}k`} />
      <WaterfallChart.Bars />
    </WaterfallChart>
  );
}
