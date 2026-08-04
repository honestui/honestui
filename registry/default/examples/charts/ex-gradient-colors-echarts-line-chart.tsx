"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Ocean conditions
const data = [
  { month: "January", waveHeight: 340, swellPeriod: 186 },
  { month: "February", waveHeight: 827, swellPeriod: 463 },
  { month: "March", waveHeight: 514, swellPeriod: 293 },
  { month: "April", waveHeight: 629, swellPeriod: 389 },
  { month: "May", waveHeight: 444, swellPeriod: 324 },
  { month: "June", waveHeight: 742, swellPeriod: 419 },
  { month: "July", waveHeight: 409, swellPeriod: 237 },
  { month: "August", waveHeight: 892, swellPeriod: 528 },
  { month: "September", waveHeight: 612, swellPeriod: 368 },
  { month: "October", waveHeight: 520, swellPeriod: 366 },
  { month: "November", waveHeight: 773, swellPeriod: 477 },
  { month: "December", waveHeight: 310, swellPeriod: 162 },
];

const chartConfig = {
  waveHeight: {
    label: "Wave height",
    colors: {
      light: ["red", "orange", "rosybrown", "purple", "blue"], // [!code highlight]
      dark: ["red", "orange", "rosybrown", "purple", "blue"], // [!code highlight]
    },
  },
  swellPeriod: {
    label: "Swell period",
    colors: {
      light: ["gray"],
      dark: ["gray"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4">
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="waveHeight" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="colored-border" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="swellPeriod" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="colored-border" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
