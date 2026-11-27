"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Monthly orders by channel, stacked (sample data). November is 26
// days in, so its totals are still coming in and are drawn as unfinished.
const data = [
  { month: "Jun", web: 1840, retail: 920 },
  { month: "Jul", web: 1912, retail: 948 },
  { month: "Aug", web: 1876, retail: 1003 },
  { month: "Sep", web: 2034, retail: 987 },
  { month: "Oct", web: 2118, retail: 1046 },
  { month: "Nov", web: 1795, retail: 884 },
];

const chartConfig = {
  web: {
    label: "Web",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  retail: {
    label: "Retail",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="stacked"
      xDataKey="month"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" />
      <AreaChart.YAxis tickFormatter={(value) => value.toLocaleString()} />
      <AreaChart.Tooltip />
      <AreaChart.Legend />
      <AreaChart.PartialPeriod x="Nov" label="Month to date" progress={26 / 30} />
      <AreaChart.Area dataKey="retail" />
      <AreaChart.Area dataKey="web" />
    </AreaChart>
  );
}
