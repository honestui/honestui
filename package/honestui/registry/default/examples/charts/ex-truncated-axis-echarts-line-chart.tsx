"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Monthly API availability in percent (sample data). Fitting the
// axis to the data shows the dips, and the chart says it does not start at zero.
const data = [
  { month: "Jun", availability: 99.92 },
  { month: "Jul", availability: 99.87 },
  { month: "Aug", availability: 99.95 },
  { month: "Sep", availability: 99.61 },
  { month: "Oct", availability: 99.9 },
  { month: "Nov", availability: 99.94 },
];

const chartConfig = {
  availability: {
    label: "Availability",
    colors: { light: ["#0369a1"], dark: ["#38bdf8"] },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="month">
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" />
      <LineChart.YAxis min="auto" tickFormatter={(value) => `${value}%`} />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="availability">
        <LineChart.Dot variant="border" />
      </LineChart.Line>
    </LineChart>
  );
}
