"use client";

import { GaugeChart, type ChartConfig } from "@/registry/default/charts/gauge-chart";

// Scenario: Share of the monthly sales target reached
const chartConfig = {
  target: {
    label: "of monthly target",
    colors: { light: ["#3b82f6"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function ExampleGaugeChart() {
  return (
    <GaugeChart className="h-full w-full p-4" value={72} max={100} dataKey="target" config={chartConfig}>
      <GaugeChart.Arc type="semi" thickness={16} />
      <GaugeChart.Center valueFormatter={(value) => `${value}%`} />
    </GaugeChart>
  );
}
