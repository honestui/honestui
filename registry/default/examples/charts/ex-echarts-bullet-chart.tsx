"use client";

import { BulletChart, type ChartConfig } from "@/registry/default/charts/bullet-chart";

// Scenario: Quarterly sales performance against targets
const data = [
  { metric: "Revenue", unit: "USD, thousands", actual: 271, target: 250, ranges: [150, 225, 300] },
  { metric: "Profit", unit: "%", actual: 22.5, target: 26, ranges: [20, 25, 30] },
  { metric: "Avg. order", unit: "USD", actual: 318, target: 550, ranges: [350, 500, 600] },
  { metric: "New customers", unit: "Count", actual: 1640, target: 2100, ranges: [1400, 2000, 2500] },
  { metric: "Satisfaction", unit: "Out of 5", actual: 4.4, target: 4.2, ranges: [3.5, 4.25, 5] },
];

const chartConfig = {
  actual: { label: "Actual", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  target: { label: "Target", colors: { light: ["#0a0a0a"], dark: ["#fafafa"] } },
} satisfies ChartConfig;

export function ExampleBulletChart() {
  return (
    <BulletChart
      data={data}
      config={chartConfig}
      labelDataKey="metric"
      descriptionDataKey="unit"
      valueDataKey="actual"
      targetDataKey="target"
      rangesDataKey="ranges"
      rangeLabels={["Poor", "Satisfactory", "Good"]}
      className="h-full w-full p-4"
    >
      <BulletChart.Legend />
      <BulletChart.Tooltip />
      <BulletChart.Axis />
      <BulletChart.Ranges />
      <BulletChart.Measure />
      <BulletChart.Target />
    </BulletChart>
  );
}
