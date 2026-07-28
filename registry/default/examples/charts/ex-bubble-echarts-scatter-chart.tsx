"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

const data = [
  { company: "Northstar", revenue: 18, growth: 72, employees: 120 },
  { company: "Arc", revenue: 31, growth: 54, employees: 240 },
  { company: "Atlas", revenue: 46, growth: 63, employees: 410 },
  { company: "Relay", revenue: 57, growth: 41, employees: 520 },
  { company: "Orbit", revenue: 68, growth: 48, employees: 760 },
  { company: "Beacon", revenue: 79, growth: 32, employees: 980 },
  { company: "Summit", revenue: 88, growth: 26, employees: 1350 },
  { company: "Tempo", revenue: 38, growth: 81, employees: 330 },
];

const chartConfig = {
  revenue: { label: "Revenue" },
  growth: { label: "Growth" },
  employees: { label: "Employees" },
  companies: {
    label: "Companies",
    colors: {
      light: ["#dbeafe", "#2563eb"],
      dark: ["#1e3a8a", "#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function BubbleScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="revenue"
      yDataKey="growth"
      pointNameDataKey="company"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Revenue" hideDots tickFormatter={(value) => `$${value}m`} />
      <ScatterChart.YAxis label="Growth" hideDots tickFormatter={(value) => `${value}%`} />
      <ScatterChart.Tooltip
        xValueFormatter={(value) => `$${value}m`}
        yValueFormatter={(value) => `${value}%`}
        sizeValueFormatter={(value) => value.toLocaleString()}
      />
      <ScatterChart.Scatter
        dataKey="companies"
        variant="bubble"
        sizeDataKey="employees"
        minSize={12}
        maxSize={52}
        isClickable
      />
    </ScatterChart>
  );
}
