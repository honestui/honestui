"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Ad campaign
const data = [
  { month: "January", impressions: 5271, clickRate: 878 },
  { month: "February", impressions: 7282, clickRate: 1173 },
  { month: "March", impressions: 5168, clickRate: 796 },
  { month: "April", impressions: 7804, clickRate: 1379 },
  { month: "May", impressions: 6771, clickRate: 1098 },
  { month: "June", impressions: 9782, clickRate: 1646 },
  { month: "July", impressions: 7668, clickRate: 1269 },
  { month: "August", impressions: 10304, clickRate: 1852 },
  { month: "September", impressions: 7396, clickRate: 1235 },
  { month: "October", impressions: 8532, clickRate: 1482 },
  { month: "November", impressions: 9043, clickRate: 1550 },
  { month: "December", impressions: 11429, clickRate: 2037 },
];

const chartConfig = {
  impressions: {
    label: "Impressions",
    colors: {
      light: ["#f43f5e", "#ec4899", "#a855f7", "#6366f1", "#3b82f6"], // [!code highlight]
      dark: ["#f43f5e", "#ec4899", "#a855f7", "#6366f1", "#3b82f6"], // [!code highlight]
    },
  },
  clickRate: {
    label: "Click rate",
    colors: {
      light: ["#10b981", "#14b8a6", "#06b6d4"], // [!code highlight]
      dark: ["#10b981", "#14b8a6", "#06b6d4"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function ExampleComposedChart() {
  return (
    <ComposedChart
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      config={chartConfig}
    >
      <ComposedChart.Grid />
      <ComposedChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <ComposedChart.Legend isClickable />
      <ComposedChart.Tooltip />
      <ComposedChart.Bar dataKey="impressions" isClickable />
      <ComposedChart.Line dataKey="clickRate" isClickable />
    </ComposedChart>
  );
}
