"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Transit ridership
const data = [
  { month: "January", entries: 408, exits: 146 },
  { month: "February", entries: 990, exits: 349 },
  { month: "March", entries: 612, exits: 228 },
  { month: "April", entries: 748, exits: 299 },
  { month: "May", entries: 532, exits: 254 },
  { month: "June", entries: 889, exits: 315 },
  { month: "July", entries: 486, exits: 185 },
  { month: "August", entries: 1065, exits: 399 },
  { month: "September", entries: 734, exits: 284 },
  { month: "October", entries: 622, exits: 284 },
  { month: "November", entries: 923, exits: 358 },
  { month: "December", entries: 365, exits: 130 },
];

const chartConfig = {
  entries: {
    label: "Entries",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  exits: {
    label: "Exits",
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
      enableHoverHighlight // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="entries" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="entries" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="exits" variant="gradient" isClickable>
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
