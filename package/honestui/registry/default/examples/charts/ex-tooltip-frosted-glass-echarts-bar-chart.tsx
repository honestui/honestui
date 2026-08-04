"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Bakery production
const data = [
  { month: "January", sold: 401, donated: 147 },
  { month: "February", sold: 935, donated: 326 },
  { month: "March", sold: 590, donated: 220 },
  { month: "April", sold: 715, donated: 284 },
  { month: "May", sold: 515, donated: 245 },
  { month: "June", sold: 842, donated: 295 },
  { month: "July", sold: 474, donated: 182 },
  { month: "August", sold: 1006, donated: 370 },
  { month: "September", sold: 700, donated: 271 },
  { month: "October", sold: 598, donated: 272 },
  { month: "November", sold: 875, donated: 332 },
  { month: "December", sold: 365, donated: 134 },
];

const chartConfig = {
  sold: {
    label: "Sold",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  donated: {
    label: "Donated",
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
      <BarChart.XAxis dataKey="month" tickFormatter={(value: string) => value.substring(0, 3)} />
      <BarChart.Legend />
      <BarChart.Tooltip
        variant="frosted-glass" // [!code highlight]
        defaultIndex={4}
      />
      <BarChart.Bar dataKey="sold" variant="default" />
      <BarChart.Bar dataKey="donated" variant="default" />
    </BarChart>
  );
}
