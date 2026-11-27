"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Monthly recurring revenue
const data = [
  { month: "January", revenue: 182 },
  { month: "February", revenue: 197 },
  { month: "March", revenue: 214 },
  { month: "April", revenue: 209 },
  { month: "May", revenue: 236 },
  { month: "June", revenue: 258 },
  { month: "July", revenue: 251 },
  { month: "August", revenue: 279 },
  { month: "September", revenue: 302 },
  { month: "October", revenue: 296 },
  { month: "November", revenue: 324 },
  { month: "December", revenue: 351 },
];

const chartConfig = {
  revenue: {
    label: "Revenue ($k)",
    colors: {
      light: ["#6d4aff"],
      dark: ["#8b74ff"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart data={data} config={chartConfig} className="h-full w-full p-4">
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="revenue" />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="revenue"
        variant="grainient" // [!code highlight]
        strokeVariant="solid"
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
