"use client";

import { SankeyChart, type ChartConfig } from "@/registry/default/charts/sankey-chart";

// Scenario: Where signups come from and where they end up
const data = [
  { from: "Search", to: "Docs", visitors: 4200 },
  { from: "Search", to: "Pricing", visitors: 1900 },
  { from: "Social", to: "Blog", visitors: 2600 },
  { from: "Social", to: "Pricing", visitors: 700 },
  { from: "Referral", to: "Pricing", visitors: 1500 },
  { from: "Referral", to: "Docs", visitors: 600 },
  { from: "Docs", to: "Signed up", visitors: 1700 },
  { from: "Docs", to: "Left", visitors: 3100 },
  { from: "Blog", to: "Signed up", visitors: 500 },
  { from: "Blog", to: "Left", visitors: 2100 },
  { from: "Pricing", to: "Signed up", visitors: 2300 },
  { from: "Pricing", to: "Left", visitors: 1800 },
];

const chartConfig = {
  Search: { label: "Search", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  Social: { label: "Social", colors: { light: ["#db2777"], dark: ["#ec4899"] } },
  Referral: { label: "Referral", colors: { light: ["#d97706"], dark: ["#f59e0b"] } },
  "Signed up": { label: "Signed up", colors: { light: ["#059669"], dark: ["#10b981"] } },
  Left: { label: "Left", colors: { light: ["#a1a1aa"], dark: ["#52525b"] } },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart
      data={data}
      config={chartConfig}
      sourceKey="from"
      targetKey="to"
      valueKey="visitors"
      className="h-full w-full p-4"
    >
      <SankeyChart.Labels />
      <SankeyChart.Tooltip />
      <SankeyChart.Links />
      <SankeyChart.Nodes />
    </SankeyChart>
  );
}
