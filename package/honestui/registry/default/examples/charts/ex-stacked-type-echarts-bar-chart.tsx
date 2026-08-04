"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Solar installation
const data = [
  { month: "January", installed: 300, permitted: 200 },
  { month: "February", installed: 690, permitted: 477 },
  { month: "March", installed: 443, permitted: 307 },
  { month: "April", installed: 537, permitted: 403 },
  { month: "May", installed: 382, permitted: 338 },
  { month: "June", installed: 623, permitted: 433 },
  { month: "July", installed: 359, permitted: 251 },
  { month: "August", installed: 747, permitted: 542 },
  { month: "September", installed: 516, permitted: 382 },
  { month: "October", installed: 446, permitted: 380 },
  { month: "November", installed: 649, permitted: 491 },
  { month: "December", installed: 282, permitted: 176 },
];

const chartConfig = {
  installed: {
    label: "Installed",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  permitted: {
    label: "Permitted",
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
      stackType="stacked" // [!code highlight]
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="installed" variant="default" isClickable />
      <BarChart.Bar dataKey="permitted" variant="default" isClickable />
    </BarChart>
  );
}
