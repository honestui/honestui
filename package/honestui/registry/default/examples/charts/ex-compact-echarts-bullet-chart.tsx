"use client";

import { BulletChart, type ChartConfig } from "@/registry/default/charts/bullet-chart";

// Scenario: Service latency budgets, with no axis for a dense dashboard tile
const data = [
  { service: "Checkout API", p95: 184, budget: 250, ranges: [200, 300, 400] },
  { service: "Search", p95: 342, budget: 300, ranges: [200, 300, 400] },
  { service: "Auth", p95: 96, budget: 150, ranges: [200, 300, 400] },
  { service: "Recommendations", p95: 268, budget: 250, ranges: [200, 300, 400] },
];

const chartConfig = {
  p95: { label: "p95 latency", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
  budget: { label: "Budget", colors: { light: ["#ea580c"], dark: ["#fb923c"] } },
} satisfies ChartConfig;

export function ExampleCompactBulletChart() {
  return (
    <BulletChart
      data={data}
      config={chartConfig}
      labelDataKey="service"
      valueDataKey="p95"
      targetDataKey="budget"
      rangesDataKey="ranges"
      rangeLabels={["Fast", "Acceptable", "Slow"]}
      labelWidth={136}
      className="h-full w-full p-4"
    >
      <BulletChart.Tooltip valueFormatter={(value) => `${value} ms`} />
      <BulletChart.Ranges />
      <BulletChart.Measure thickness={0.5} radius={2} />
      <BulletChart.Target length={0.9} />
    </BulletChart>
  );
}
