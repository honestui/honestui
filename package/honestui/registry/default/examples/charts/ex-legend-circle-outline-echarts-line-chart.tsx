"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: App performance
const data = [
  { month: "January", coldStart: 442, warmStart: 133 },
  { month: "February", coldStart: 1072, warmStart: 312 },
  { month: "March", coldStart: 661, warmStart: 206 },
  { month: "April", coldStart: 808, warmStart: 270 },
  { month: "May", coldStart: 576, warmStart: 231 },
  { month: "June", coldStart: 962, warmStart: 281 },
  { month: "July", coldStart: 524, warmStart: 168 },
  { month: "August", coldStart: 1151, warmStart: 356 },
  { month: "September", coldStart: 796, warmStart: 257 },
  { month: "October", coldStart: 673, warmStart: 258 },
  { month: "November", coldStart: 998, warmStart: 318 },
  { month: "December", coldStart: 392, warmStart: 120 },
];

const chartConfig = {
  coldStart: {
    label: "Cold start",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  warmStart: {
    label: "Warm start",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendCircleOutlineLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="circle-outline" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="coldStart" />
      <LineChart.Line dataKey="warmStart" />
    </LineChart>
  );
}
