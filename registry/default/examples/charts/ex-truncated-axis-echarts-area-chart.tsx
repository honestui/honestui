"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Median page load time in milliseconds (sample data). Fitting the
// axis to the data shows the change, and the chart says it does not start at zero,
// so the filled area is not read as the whole value.
const data = [
  { week: "Oct 6", load: 1284 },
  { week: "Oct 13", load: 1302 },
  { week: "Oct 20", load: 1271 },
  { week: "Oct 27", load: 1348 },
  { week: "Nov 3", load: 1326 },
  { week: "Nov 10", load: 1259 },
  { week: "Nov 17", load: 1236 },
  { week: "Nov 24", load: 1218 },
];

const chartConfig = {
  load: {
    label: "Median load",
    colors: { light: ["#0369a1"], dark: ["#38bdf8"] },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="week">
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="week" />
      <AreaChart.YAxis min="auto" tickFormatter={(value) => `${value.toLocaleString()} ms`} />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="load" strokeVariant="solid" />
    </AreaChart>
  );
}
