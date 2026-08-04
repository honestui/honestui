"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: Cloud platform
const data = [
  { month: "January", requests: 3774, errorRate: 1608 },
  { month: "February", requests: 5209, errorRate: 2143 },
  { month: "March", requests: 3707, errorRate: 1446 },
  { month: "April", requests: 5587, errorRate: 2509 },
  { month: "May", requests: 4842, errorRate: 1988 },
  { month: "June", requests: 6989, errorRate: 3016 },
  { month: "July", requests: 5487, errorRate: 2319 },
  { month: "August", requests: 7367, errorRate: 3382 },
  { month: "September", requests: 5287, errorRate: 2245 },
  { month: "October", requests: 6099, errorRate: 2692 },
  { month: "November", requests: 6466, errorRate: 2840 },
  { month: "December", requests: 8168, errorRate: 3727 },
];

const chartConfig = {
  requests: {
    label: "Requests",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  errorRate: {
    label: "Error rate",
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
        dataKey="requests"
        variant="stripped" // [!code highlight]
        isClickable
      />
      <ComposedChart.Line dataKey="errorRate" isClickable />
    </ComposedChart>
  );
}
