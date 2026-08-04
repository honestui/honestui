"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Factory output
const data = [
  { month: "January", finished: 449, scrap: 132 },
  { month: "February", finished: 1127, scrap: 335 },
  { month: "March", finished: 683, scrap: 214 },
  { month: "April", finished: 840, scrap: 285 },
  { month: "May", finished: 594, scrap: 240 },
  { month: "June", finished: 1008, scrap: 301 },
  { month: "July", finished: 536, scrap: 171 },
  { month: "August", finished: 1210, scrap: 385 },
  { month: "September", finished: 830, scrap: 270 },
  { month: "October", finished: 697, scrap: 270 },
  { month: "November", finished: 1047, scrap: 344 },
  { month: "December", finished: 393, scrap: 116 },
];

const chartConfig = {
  finished: {
    label: "Finished units",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  scrap: {
    label: "Scrap units",
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
      stackType="stacked"
      xDataKey="month"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.Brush formatLabel={(value) => String(value).substring(0, 3)} />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="finished" variant="gradient" isClickable>
        <AreaChart.Dot variant="border" />
        <AreaChart.ActiveDot variant="colored-border" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="scrap" variant="gradient" isClickable>
        <AreaChart.Dot variant="border" />
        <AreaChart.ActiveDot variant="colored-border" />
      </AreaChart.Area>
    </AreaChart>
  );
}
