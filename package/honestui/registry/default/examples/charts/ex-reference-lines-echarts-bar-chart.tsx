"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Monthly deals closed by two sales teams against a shared quota
const data = [
  { month: "January", inbound: 42, outbound: 31 },
  { month: "February", inbound: 38, outbound: 35 },
  { month: "March", inbound: 51, outbound: 44 },
  { month: "April", inbound: 47, outbound: 52 },
  { month: "May", inbound: 58, outbound: 49 },
  { month: "June", inbound: 63, outbound: 57 },
];

const chartConfig = {
  inbound: {
    label: "Inbound",
    colors: { light: ["#2563eb"], dark: ["#3b82f6"] },
  },
  outbound: {
    label: "Outbound",
    colors: { light: ["#93c5fd"], dark: ["#1e40af"] },
  },
} satisfies ChartConfig;

export function ExampleReferenceLinesBarChart() {
  return (
    <BarChart data={data} config={chartConfig} xDataKey="month" className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis tickFormatter={(value) => value.slice(0, 3)} />
      <BarChart.YAxis />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.ReferenceLine y={50} label="Quota 50" labelPosition="start" /> {/* [!code highlight] */}
      <BarChart.Bar dataKey="inbound" />
      <BarChart.Bar dataKey="outbound" />
    </BarChart>
  );
}
