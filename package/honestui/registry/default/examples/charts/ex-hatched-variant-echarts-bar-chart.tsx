"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Mobile release quality
const data = [
  { month: "January", passedChecks: 374, failedChecks: 203 },
  { month: "February", passedChecks: 908, failedChecks: 504 },
  { month: "March", passedChecks: 563, failedChecks: 318 },
  { month: "April", passedChecks: 688, failedChecks: 422 },
  { month: "May", passedChecks: 488, failedChecks: 351 },
  { month: "June", passedChecks: 815, failedChecks: 457 },
  { month: "July", passedChecks: 447, failedChecks: 258 },
  { month: "August", passedChecks: 979, failedChecks: 575 },
  { month: "September", passedChecks: 673, failedChecks: 399 },
  { month: "October", passedChecks: 571, failedChecks: 397 },
  { month: "November", passedChecks: 848, failedChecks: 520 },
  { month: "December", passedChecks: 338, failedChecks: 176 },
];

const chartConfig = {
  passedChecks: {
    label: "Passed checks",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  failedChecks: {
    label: "Failed checks",
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
        dataKey="passedChecks"
        variant="hatched" // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="failedChecks"
        variant="hatched" // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
