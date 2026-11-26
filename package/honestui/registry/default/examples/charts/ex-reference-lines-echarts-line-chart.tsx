"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: API latency against its objective, with an incident window
const data = [
  { day: "Jun 2", p95: 182 },
  { day: "Jun 3", p95: 176 },
  { day: "Jun 4", p95: 191 },
  { day: "Jun 5", p95: 248 },
  { day: "Jun 6", p95: 236 },
  { day: "Jun 7", p95: 171 },
  { day: "Jun 8", p95: 164 },
  { day: "Jun 9", p95: 169 },
  { day: "Jun 10", p95: 158 },
  { day: "Jun 11", p95: 162 },
];

const chartConfig = {
  p95: {
    label: "p95 latency",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
} satisfies ChartConfig;

export function ExampleReferenceLinesLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      xDataKey="day"
      curveType="monotone"
      className="h-full w-full p-4"
    >
      <LineChart.Grid />
      <LineChart.XAxis />
      <LineChart.YAxis tickFormatter={(value) => `${value}ms`} />
      <LineChart.Tooltip />
      <LineChart.ReferenceArea x1="Jun 5" x2="Jun 6" label="Incident" /> {/* [!code highlight] */}
      <LineChart.ReferenceLine y={200} label="SLO 200ms" /> {/* [!code highlight] */}
      <LineChart.ReferenceDot x="Jun 5" y={248} label="Peak" labelPosition="right" color="p95" /> {/* [!code highlight] */}
      <LineChart.Line dataKey="p95" />
    </LineChart>
  );
}
