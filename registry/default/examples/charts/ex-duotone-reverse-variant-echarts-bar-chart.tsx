"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Construction milestones
const data = [
  { month: "January", planned: 381, completed: 172 },
  { month: "February", planned: 963, completed: 449 },
  { month: "March", planned: 585, completed: 279 },
  { month: "April", planned: 721, completed: 375 },
  { month: "May", planned: 505, completed: 310 },
  { month: "June", planned: 862, completed: 405 },
  { month: "July", planned: 459, completed: 223 },
  { month: "August", planned: 1038, completed: 514 },
  { month: "September", planned: 707, completed: 354 },
  { month: "October", planned: 595, completed: 352 },
  { month: "November", planned: 896, completed: 463 },
  { month: "December", planned: 338, completed: 148 },
];

const chartConfig = {
  planned: {
    label: "Planned",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  completed: {
    label: "Completed",
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
        dataKey="planned"
        variant="duotone-reverse" // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="completed"
        variant="duotone-reverse" // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
