"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Network traffic
const data = [
  { month: "January", cached: 442, origin: 133 },
  { month: "February", cached: 1072, origin: 312 },
  { month: "March", cached: 661, origin: 206 },
  { month: "April", cached: 808, origin: 270 },
  { month: "May", cached: 576, origin: 231 },
  { month: "June", cached: 962, origin: 281 },
  { month: "July", cached: 524, origin: 168 },
  { month: "August", cached: 1151, origin: 356 },
  { month: "September", cached: 796, origin: 257 },
  { month: "October", cached: 673, origin: 258 },
  { month: "November", cached: 998, origin: 318 },
  { month: "December", cached: 392, origin: 120 },
];

const chartConfig = {
  cached: {
    label: "Cached",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  origin: {
    label: "Origin",
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
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="cached"
        variant="default"
        enableHoverHighlight // [!code highlight]
      />
      <BarChart.Bar
        dataKey="origin"
        variant="default"
        enableHoverHighlight // [!code highlight]
      />
    </BarChart>
  );
}
