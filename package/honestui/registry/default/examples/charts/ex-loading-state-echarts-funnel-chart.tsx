"use client";

import { FunnelChart, type ChartConfig } from "@/registry/default/charts/funnel-chart";

const chartConfig = {
  people: { label: "People", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

export function ExampleFunnelChart() {
  return (
    <FunnelChart
      data={[]}
      config={chartConfig}
      nameKey="stage"
      dataKey="people"
      isLoading
      className="h-full w-full p-4"
    >
      <FunnelChart.Axis />
      <FunnelChart.Labels />
      <FunnelChart.Funnel />
    </FunnelChart>
  );
}
