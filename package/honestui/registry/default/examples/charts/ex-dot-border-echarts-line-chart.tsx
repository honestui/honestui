"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Electricity price
const data = [
  { month: "January", dayAhead: 347, realTime: 155 },
  { month: "February", dayAhead: 881, realTime: 408 },
  { month: "March", dayAhead: 536, realTime: 254 },
  { month: "April", dayAhead: 661, realTime: 342 },
  { month: "May", dayAhead: 461, realTime: 283 },
  { month: "June", dayAhead: 788, realTime: 367 },
  { month: "July", dayAhead: 420, realTime: 202 },
  { month: "August", dayAhead: 952, realTime: 468 },
  { month: "September", dayAhead: 646, realTime: 323 },
  { month: "October", dayAhead: 544, realTime: 322 },
  { month: "November", dayAhead: 821, realTime: 420 },
  { month: "December", dayAhead: 311, realTime: 134 },
];

const chartConfig = {
  dayAhead: {
    label: "Day-ahead",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  realTime: {
    label: "Real-time",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function DotBorderLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="dayAhead">
        <LineChart.Dot variant="border" />
      </LineChart.Line>
      <LineChart.Line dataKey="realTime">
        <LineChart.Dot variant="border" />
      </LineChart.Line>
    </LineChart>
  );
}
