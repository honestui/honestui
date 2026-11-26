"use client";

import { GaugeChart, type ChartConfig } from "@/registry/default/charts/gauge-chart";

const chartConfig = {
  uptime: { label: "Uptime", colors: { light: ["#3b82f6"], dark: ["#60a5fa"] } },
} satisfies ChartConfig;

export function ExampleGaugeChart() {
  return (
    <GaugeChart
      className="h-full w-full p-4"
      value={null}
      dataKey="uptime"
      config={chartConfig}
      isLoading // [!code highlight]
    >
      <GaugeChart.Arc type="semi" thickness={16} />
      <GaugeChart.Center />
    </GaugeChart>
  );
}
