"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Airport operations
const data = [
  { month: "January", onTime: 246, delayed: 105 },
  { month: "February", onTime: 636, delayed: 284 },
  { month: "March", onTime: 389, delayed: 178 },
  { month: "April", onTime: 483, delayed: 242 },
  { month: "May", onTime: 328, delayed: 203 },
  { month: "June", onTime: 569, delayed: 253 },
  { month: "July", onTime: 305, delayed: 140 },
  { month: "August", onTime: 693, delayed: 328 },
  { month: "September", onTime: 462, delayed: 229 },
  { month: "October", onTime: 392, delayed: 230 },
  { month: "November", onTime: 382, delayed: 122 },
  { month: "December", onTime: 725, delayed: 428 },
];

const chartConfig = {
  onTime: {
    label: "On time",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  delayed: {
    label: "Delayed",
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
        dataKey="onTime"
        variant="default"
        bufferBar // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="delayed"
        variant="default"
        bufferBar // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
