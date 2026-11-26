"use client";

import { SankeyChart, type ChartConfig } from "@/registry/default/charts/sankey-chart";

// Scenario: Monthly household budget
const data = [
  { source: "Salary", target: "Income", amount: 6200 },
  { source: "Freelance", target: "Income", amount: 1400 },
  { source: "Income", target: "Housing", amount: 2400 },
  { source: "Income", target: "Living", amount: 2100 },
  { source: "Income", target: "Savings", amount: 1900 },
  { source: "Income", target: "Taxes", amount: 1200 },
  { source: "Living", target: "Groceries", amount: 900 },
  { source: "Living", target: "Transport", amount: 600 },
  { source: "Living", target: "Fun", amount: 600 },
];

const chartConfig = {
  Salary: { label: "Salary", colors: { light: ["#0d9488"], dark: ["#14b8a6"] } },
  Freelance: { label: "Freelance", colors: { light: ["#0891b2"], dark: ["#22d3ee"] } },
  Income: { label: "Income", colors: { light: ["#0f766e"], dark: ["#2dd4bf"] } },
  Housing: { label: "Housing", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  Living: { label: "Living", colors: { light: ["#ea580c"], dark: ["#fb923c"] } },
  Savings: { label: "Savings", colors: { light: ["#16a34a"], dark: ["#4ade80"] } },
  Taxes: { label: "Taxes", colors: { light: ["#71717a"], dark: ["#a1a1aa"] } },
} satisfies ChartConfig;

const usd = (value: number) => `$${value.toLocaleString()}`;

export function ExampleSankeyChart() {
  return (
    <SankeyChart
      data={data}
      config={chartConfig}
      sourceKey="source"
      targetKey="target"
      valueKey="amount"
      nodes={["Salary", "Freelance", "Income", "Housing", "Living", "Savings", "Taxes"]}
      className="h-full w-full p-4"
    >
      <SankeyChart.Labels showValues valueFormatter={usd} />
      <SankeyChart.Tooltip valueFormatter={usd} />
      <SankeyChart.Links color="gradient" opacity={0.28} />
      <SankeyChart.Nodes width={12} align="left" />
    </SankeyChart>
  );
}
