"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Clinical intake
const data = [
  { month: "January", screened: 273, referred: 152 },
  { month: "February", screened: 663, referred: 381 },
  { month: "March", screened: 416, referred: 243 },
  { month: "April", screened: 510, referred: 323 },
  { month: "May", screened: 355, referred: 270 },
  { month: "June", screened: 596, referred: 343 },
  { month: "July", screened: 332, referred: 195 },
  { month: "August", screened: 720, referred: 435 },
  { month: "September", screened: 489, referred: 305 },
  { month: "October", screened: 419, referred: 305 },
  { month: "November", screened: 622, referred: 391 },
  { month: "December", screened: 255, referred: 134 },
];

const chartConfig = {
  screened: {
    label: "Screened",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  referred: {
    label: "Referred",
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
      <BarChart.Bar dataKey="screened" variant="default" isClickable />
      <BarChart.Bar
        dataKey="referred"
        variant="default"
        glowing // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
