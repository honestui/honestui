"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: River levels
const data = [
  { month: "January", upstream: 280, downstream: 122 },
  { month: "February", upstream: 718, downstream: 325 },
  { month: "March", upstream: 438, downstream: 204 },
  { month: "April", upstream: 542, downstream: 275 },
  { month: "May", upstream: 372, downstream: 230 },
  { month: "June", upstream: 642, downstream: 291 },
  { month: "July", upstream: 343, downstream: 161 },
  { month: "August", upstream: 779, downstream: 374 },
  { month: "September", upstream: 524, downstream: 260 },
  { month: "October", upstream: 443, downstream: 260 },
  { month: "November", upstream: 670, downstream: 334 },
  { month: "December", upstream: 256, downstream: 106 },
];

const chartConfig = {
  upstream: {
    label: "Upstream",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  downstream: {
    label: "Downstream",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      curveType="bump" // [!code highlight]
    >
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis dataKey="upstream" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="upstream" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="default" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="downstream" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="default" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
