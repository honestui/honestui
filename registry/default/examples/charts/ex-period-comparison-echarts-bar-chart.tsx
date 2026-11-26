"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Revenue by region this quarter, marked with last quarter's figure
const data = [
  { region: "North", revenue: 184, lastQuarter: 162 },
  { region: "South", revenue: 141, lastQuarter: 156 },
  { region: "East", revenue: 212, lastQuarter: 175 },
  { region: "West", revenue: 168, lastQuarter: 171 },
  { region: "Central", revenue: 126, lastQuarter: 98 },
];

const chartConfig = {
  revenue: {
    label: "Revenue ($k)",
    colors: { light: ["#0d9488"], dark: ["#14b8a6"] },
  },
  lastQuarter: { label: "Last quarter" },
} satisfies ChartConfig;

export function ExamplePeriodComparisonBarChart() {
  return (
    <BarChart data={data} config={chartConfig} xDataKey="region" className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="revenue" compareDataKey="lastQuarter" /> {/* [!code highlight] */}
    </BarChart>
  );
}
