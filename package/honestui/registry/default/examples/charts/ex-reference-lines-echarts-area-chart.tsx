"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Greenhouse humidity against its healthy range
const data = [
  { hour: "6 AM", humidity: 58 },
  { hour: "8 AM", humidity: 61 },
  { hour: "10 AM", humidity: 66 },
  { hour: "12 PM", humidity: 74 },
  { hour: "2 PM", humidity: 79 },
  { hour: "4 PM", humidity: 76 },
  { hour: "6 PM", humidity: 69 },
  { hour: "8 PM", humidity: 63 },
  { hour: "10 PM", humidity: 60 },
];

const chartConfig = {
  humidity: {
    label: "Humidity %",
    colors: { light: ["#0891b2"], dark: ["#22d3ee"] },
  },
} satisfies ChartConfig;

export function ExampleReferenceLinesAreaChart() {
  return (
    <AreaChart data={data} config={chartConfig} xDataKey="hour" className="h-full w-full p-4">
      <AreaChart.Grid />
      <AreaChart.XAxis />
      <AreaChart.YAxis tickFormatter={(value) => `${value}%`} />
      <AreaChart.Tooltip />
      <AreaChart.ReferenceArea y1={55} y2={70} label="Healthy range" labelPosition="end" color="humidity" /> {/* [!code highlight] */}
      <AreaChart.ReferenceLine x="2 PM" label="Vents open" /> {/* [!code highlight] */}
      <AreaChart.Area dataKey="humidity" variant="gradient" />
    </AreaChart>
  );
}
