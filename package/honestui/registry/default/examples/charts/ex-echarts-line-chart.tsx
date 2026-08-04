"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Exchange volume
const data = [
  { month: "January", buys: 482, sells: 119 },
  { month: "February", buys: 1209, sells: 298 },
  { month: "March", buys: 732, sells: 192 },
  { month: "April", buys: 900, sells: 256 },
  { month: "May", buys: 638, sells: 217 },
  { month: "June", buys: 1082, sells: 267 },
  { month: "July", buys: 574, sells: 154 },
  { month: "August", buys: 1296, sells: 342 },
  { month: "September", buys: 891, sells: 243 },
  { month: "October", buys: 748, sells: 244 },
  { month: "November", buys: 1122, sells: 304 },
  { month: "December", buys: 420, sells: 106 },
];

const chartConfig = {
  buys: {
    label: "Buys",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  sells: {
    label: "Sells",
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
      <LineChart.Brush formatLabel={(value) => String(value).substring(0, 3)} />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="buys" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
      <LineChart.Line dataKey="sells" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
