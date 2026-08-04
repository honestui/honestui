"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Manufacturing defects
const data = [
  { month: "January", accepted: 509, reworked: 166 },
  { month: "February", accepted: 1236, reworked: 395 },
  { month: "March", accepted: 759, reworked: 257 },
  { month: "April", accepted: 927, reworked: 337 },
  { month: "May", accepted: 665, reworked: 284 },
  { month: "June", accepted: 1109, reworked: 357 },
  { month: "July", accepted: 601, reworked: 209 },
  { month: "August", accepted: 1323, reworked: 449 },
  { month: "September", accepted: 918, reworked: 319 },
  { month: "October", accepted: 775, reworked: 319 },
  { month: "November", accepted: 1149, reworked: 405 },
  { month: "December", accepted: 447, reworked: 148 },
];

const chartConfig = {
  accepted: {
    label: "Accepted",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  reworked: {
    label: "Reworked",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      enableMaxValueHighlight // [!code highlight]
    >
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="accepted" />
      <BarChart.Bar dataKey="reworked" />
    </BarChart>
  );
}
