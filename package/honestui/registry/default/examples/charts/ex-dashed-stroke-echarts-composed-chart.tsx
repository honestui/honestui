"use client";

import { ComposedChart, type ChartConfig } from "@/registry/default/charts/composed-chart";

// Scenario: SaaS acquisition
const data = [
  { month: "January", trials: 3366, activationRate: 1156 },
  { month: "February", trials: 4657, activationRate: 1547 },
  { month: "March", trials: 3308, activationRate: 1042 },
  { month: "April", trials: 4999, activationRate: 1817 },
  { month: "May", trials: 4326, activationRate: 1440 },
  { month: "June", trials: 6257, activationRate: 2180 },
  { month: "July", trials: 4908, activationRate: 1675 },
  { month: "August", trials: 6599, activationRate: 2450 },
  { month: "September", trials: 4726, activationRate: 1625 },
  { month: "October", trials: 5457, activationRate: 1952 },
  { month: "November", trials: 5788, activationRate: 2052 },
  { month: "December", trials: 7319, activationRate: 2699 },
];

const chartConfig = {
  trials: {
    label: "Trials",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  activationRate: {
    label: "Activation rate",
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
      <ComposedChart.Bar dataKey="trials" isClickable />
      <ComposedChart.Line
        dataKey="activationRate"
        strokeVariant="dashed" // [!code highlight]
        isClickable
      />
    </ComposedChart>
  );
}
