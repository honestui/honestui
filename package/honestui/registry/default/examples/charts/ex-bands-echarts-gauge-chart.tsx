"use client";

import { GaugeChart, type ChartConfig } from "@/registry/default/charts/gauge-chart";

// Scenario: Service health score with poor, fair, and good ranges
const chartConfig = {
  health: { label: "Health score" },
  poor: { label: "Poor", colors: { light: ["#ef4444"], dark: ["#f87171"] } },
  fair: { label: "Fair", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  good: { label: "Good", colors: { light: ["#10b981"], dark: ["#34d399"] } },
} satisfies ChartConfig;

export function ExampleGaugeChart() {
  return (
    <GaugeChart className="h-full w-full p-4" value={84} dataKey="health" config={chartConfig}>
      <GaugeChart.Arc type="arc" thickness={12} />
      <GaugeChart.Bands
        bands={[
          { to: 50, dataKey: "poor" },
          { to: 80, dataKey: "fair" },
          { to: 100, dataKey: "good" },
        ]}
      />
      <GaugeChart.Ticks count={5} />
      <GaugeChart.Center />
      <GaugeChart.Legend />
    </GaugeChart>
  );
}
