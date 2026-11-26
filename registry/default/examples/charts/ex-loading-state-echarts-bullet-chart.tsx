"use client";

import { BulletChart, type ChartConfig } from "@/registry/default/charts/bullet-chart";

const chartConfig = {
  actual: { label: "Actual", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  target: { label: "Target", colors: { light: ["#0a0a0a"], dark: ["#fafafa"] } },
} satisfies ChartConfig;

export function ExampleLoadingBulletChart() {
  return (
    <BulletChart
      data={[]}
      config={chartConfig}
      labelDataKey="metric"
      valueDataKey="actual"
      targetDataKey="target"
      isLoading
      className="h-full w-full p-4"
    >
      <BulletChart.Ranges />
      <BulletChart.Measure />
      <BulletChart.Target />
    </BulletChart>
  );
}
