"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Food waste audit
const data = [
  { month: "January", prepared: 415, discarded: 189 },
  { month: "February", prepared: 1045, discarded: 490 },
  { month: "March", prepared: 634, discarded: 304 },
  { month: "April", prepared: 781, discarded: 408 },
  { month: "May", prepared: 549, discarded: 337 },
  { month: "June", prepared: 935, discarded: 443 },
  { month: "July", prepared: 497, discarded: 244 },
  { month: "August", prepared: 1124, discarded: 561 },
  { month: "September", prepared: 769, discarded: 385 },
  { month: "October", prepared: 646, discarded: 383 },
  { month: "November", prepared: 971, discarded: 506 },
  { month: "December", prepared: 365, discarded: 162 },
];

const chartConfig = {
  prepared: {
    label: "Prepared",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  discarded: {
    label: "Discarded",
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
        dataKey="prepared"
        variant="duotone" // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="discarded"
        variant="duotone" // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
