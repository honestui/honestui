"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Water demand
const data = [
  { month: "January", residential: 280, commercial: 122 },
  { month: "February", residential: 718, commercial: 325 },
  { month: "March", residential: 438, commercial: 204 },
  { month: "April", residential: 542, commercial: 275 },
  { month: "May", residential: 372, commercial: 230 },
  { month: "June", residential: 642, commercial: 291 },
  { month: "July", residential: 343, commercial: 161 },
  { month: "August", residential: 779, commercial: 374 },
  { month: "September", residential: 524, commercial: 260 },
  { month: "October", residential: 443, commercial: 260 },
  { month: "November", residential: 670, commercial: 334 },
  { month: "December", residential: 256, commercial: 106 },
];

const chartConfig = {
  residential: {
    label: "Residential",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  commercial: {
    label: "Commercial",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
      stackType="stacked"
    >
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.Brush />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="residential"
        variant="gradient"
        strokeVariant="solid"
        enableBufferLine // [!code highlight]
        isClickable
      >
        <AreaChart.Dot variant="border" />
        <AreaChart.ActiveDot variant="colored-border" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="commercial"
        variant="gradient"
        strokeVariant="solid"
        enableBufferLine // [!code highlight]
        isClickable
      >
        <AreaChart.Dot variant="border" />
        <AreaChart.ActiveDot variant="colored-border" />
      </AreaChart.Area>
    </AreaChart>
  );
}
