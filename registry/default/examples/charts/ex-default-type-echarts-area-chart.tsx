"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Hotel occupancy
const data = [
  { month: "January", booked: 381, available: 226 },
  { month: "February", booked: 963, available: 593 },
  { month: "March", booked: 585, available: 365 },
  { month: "April", booked: 721, available: 489 },
  { month: "May", booked: 505, available: 401 },
  { month: "June", booked: 862, available: 536 },
  { month: "July", booked: 459, available: 292 },
  { month: "August", booked: 1038, available: 678 },
  { month: "September", booked: 707, available: 461 },
  { month: "October", booked: 595, available: 457 },
  { month: "November", booked: 896, available: 615 },
  { month: "December", booked: 338, available: 191 },
];

const chartConfig = {
  booked: {
    label: "Booked rooms",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  available: {
    label: "Available rooms",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="default" // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="booked" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="booked" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="available" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
