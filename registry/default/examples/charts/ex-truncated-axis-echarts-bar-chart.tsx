"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Weekly checkout success rate, in percent (sample data).
// The axis is asked to start at 80%, so the chart keeps that range and flags
// that the bars no longer start at zero.
const data = [
  { week: "W40", success: 96.2 },
  { week: "W41", success: 95.8 },
  { week: "W42", success: 97.1 },
  { week: "W43", success: 93.4 },
  { week: "W44", success: 96.6 },
  { week: "W45", success: 97.4 },
];

const chartConfig = {
  success: {
    label: "Success rate",
    colors: { light: ["#059669"], dark: ["#34d399"] },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="week">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="week" />
      <BarChart.YAxis min={80} tickFormatter={(value) => `${value}%`} /> {/* [!code highlight] */}
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="success" />
    </BarChart>
  );
}
