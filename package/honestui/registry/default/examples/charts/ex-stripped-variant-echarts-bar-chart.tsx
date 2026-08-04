"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Grant decisions
const data = [
  { month: "January", awarded: 334, declined: 217 },
  { month: "February", awarded: 772, declined: 518 },
  { month: "March", awarded: 492, declined: 332 },
  { month: "April", awarded: 596, declined: 436 },
  { month: "May", awarded: 426, declined: 365 },
  { month: "June", awarded: 696, declined: 471 },
  { month: "July", awarded: 397, declined: 272 },
  { month: "August", awarded: 833, declined: 589 },
  { month: "September", awarded: 578, declined: 413 },
  { month: "October", awarded: 497, declined: 411 },
  { month: "November", awarded: 724, declined: 534 },
  { month: "December", awarded: 310, declined: 190 },
];

const chartConfig = {
  awarded: {
    label: "Awarded",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  declined: {
    label: "Declined",
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
        dataKey="awarded"
        variant="stripped" // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="declined"
        variant="stripped" // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
