"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Monthly sign-ups by channel (sample data).
// November is 26 days in, so its bars are still filling up.
const data = [
  { month: "Jun", web: 1840, app: 1260 },
  { month: "Jul", web: 1910, app: 1340 },
  { month: "Aug", web: 1875, app: 1420 },
  { month: "Sep", web: 2030, app: 1490 },
  { month: "Oct", web: 2120, app: 1580 },
  { month: "Nov", web: 1790, app: 1365 },
];

const chartConfig = {
  web: {
    label: "Web",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  app: {
    label: "App",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="month">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" />
      <BarChart.YAxis tickFormatter={(value) => Number(value).toLocaleString()} />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.PartialPeriod x="Nov" label="Month to date" progress={26 / 30} /> {/* [!code highlight] */}
      <BarChart.Bar dataKey="web" />
      <BarChart.Bar dataKey="app" />
    </BarChart>
  );
}
