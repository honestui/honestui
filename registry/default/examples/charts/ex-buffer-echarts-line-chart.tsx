"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Active subscriptions
const data = [
  { month: "January", active: 246, churned: 105 },
  { month: "February", active: 636, churned: 284 },
  { month: "March", active: 389, churned: 178 },
  { month: "April", active: 483, churned: 242 },
  { month: "May", active: 328, churned: 203 },
  { month: "June", active: 569, churned: 253 },
  { month: "July", active: 305, churned: 140 },
  { month: "August", active: 693, churned: 328 },
  { month: "September", active: 462, churned: 229 },
  { month: "October", active: 392, churned: 230 },
  { month: "November", active: 595, churned: 290 },
  { month: "December", active: 228, churned: 92 },
];

const chartConfig = {
  active: {
    label: "Active",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  churned: {
    label: "Churned",
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
      xDataKey="month"
    >
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Brush />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="active"
        strokeVariant="solid"
        enableBufferLine // [!code highlight]
        isClickable
      >
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
      <LineChart.Line
        dataKey="churned"
        strokeVariant="solid"
        enableBufferLine // [!code highlight]
        isClickable
      >
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
