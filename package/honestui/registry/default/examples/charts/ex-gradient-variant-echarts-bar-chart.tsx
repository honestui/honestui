"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Restaurant covers
const data = [
  { month: "January", reservations: 340, walkIns: 186 },
  { month: "February", reservations: 827, walkIns: 463 },
  { month: "March", reservations: 514, walkIns: 293 },
  { month: "April", reservations: 629, walkIns: 389 },
  { month: "May", reservations: 444, walkIns: 324 },
  { month: "June", reservations: 742, walkIns: 419 },
  { month: "July", reservations: 409, walkIns: 237 },
  { month: "August", reservations: 892, walkIns: 528 },
  { month: "September", reservations: 612, walkIns: 368 },
  { month: "October", reservations: 520, walkIns: 366 },
  { month: "November", reservations: 773, walkIns: 477 },
  { month: "December", reservations: 310, walkIns: 162 },
];

const chartConfig = {
  reservations: {
    label: "Reservations",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  walkIns: {
    label: "Walk-ins",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="reservations"
        variant="gradient" // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="walkIns"
        variant="gradient" // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
