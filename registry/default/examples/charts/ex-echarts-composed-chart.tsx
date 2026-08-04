"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Hospital operations
const data = [
  { month: "January", procedures: 4509, waitTime: 1594 },
  { month: "February", procedures: 6232, waitTime: 2129 },
  { month: "March", procedures: 4424, waitTime: 1432 },
  { month: "April", procedures: 6682, waitTime: 2495 },
  { month: "May", procedures: 5793, waitTime: 1974 },
  { month: "June", procedures: 8372, waitTime: 3002 },
  { month: "July", procedures: 6564, waitTime: 2305 },
  { month: "August", procedures: 8822, waitTime: 3368 },
  { month: "September", procedures: 6328, waitTime: 2231 },
  { month: "October", procedures: 7302, waitTime: 2678 },
  { month: "November", procedures: 7741, waitTime: 2826 },
  { month: "December", procedures: 9785, waitTime: 3713 },
];

const chartConfig = {
  procedures: {
    label: "Procedures",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  waitTime: {
    label: "Wait time",
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
      <ComposedChart.Brush formatLabel={(value) => String(value).substring(0, 3)} />
      <ComposedChart.Legend isClickable />
      <ComposedChart.Tooltip />
      <ComposedChart.Bar dataKey="procedures" isClickable />
      <ComposedChart.Line dataKey="waitTime" isClickable>
        <ComposedChart.ActiveDot variant="colored-border" />
        <ComposedChart.Dot variant="default" />
      </ComposedChart.Line>
    </ComposedChart>
  );
}
