"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Public transit
const data = [
  { month: "January", rides: 3012, delayMinutes: 1316 },
  { month: "February", rides: 4159, delayMinutes: 1755 },
  { month: "March", rides: 2963, delayMinutes: 1186 },
  { month: "April", rides: 4465, delayMinutes: 2057 },
  { month: "May", rides: 3864, delayMinutes: 1632 },
  { month: "June", rides: 5579, delayMinutes: 2468 },
  { month: "July", rides: 4383, delayMinutes: 1899 },
  { month: "August", rides: 5885, delayMinutes: 2770 },
  { month: "September", rides: 4219, delayMinutes: 1841 },
  { month: "October", rides: 4869, delayMinutes: 2208 },
  { month: "November", rides: 5164, delayMinutes: 2324 },
  { month: "December", rides: 6524, delayMinutes: 3051 },
];

const chartConfig = {
  rides: {
    label: "Rides",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  delayMinutes: {
    label: "Delay minutes",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleComposedChart() {
  return (
    <ComposedChart
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      config={chartConfig}
    >
      <ComposedChart.Grid />
      <ComposedChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <ComposedChart.Legend isClickable />
      <ComposedChart.Tooltip />
      <ComposedChart.Bar
        dataKey="rides"
        enableHoverHighlight // [!code highlight]
        isClickable
      />
      <ComposedChart.Line dataKey="delayMinutes" isClickable />
    </ComposedChart>
  );
}
