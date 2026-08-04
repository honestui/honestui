"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Power grid load
const data = [
  { month: "January", baseLoad: 300, peakLoad: 254 },
  { month: "February", baseLoad: 690, peakLoad: 621 },
  { month: "March", baseLoad: 443, peakLoad: 393 },
  { month: "April", baseLoad: 537, peakLoad: 517 },
  { month: "May", baseLoad: 382, peakLoad: 429 },
  { month: "June", baseLoad: 623, peakLoad: 564 },
  { month: "July", baseLoad: 359, peakLoad: 320 },
  { month: "August", baseLoad: 747, peakLoad: 706 },
  { month: "September", baseLoad: 516, peakLoad: 489 },
  { month: "October", baseLoad: 446, peakLoad: 485 },
  { month: "November", baseLoad: 649, peakLoad: 643 },
  { month: "December", baseLoad: 282, peakLoad: 219 },
];

const chartConfig = {
  baseLoad: {
    label: "Base load",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  peakLoad: {
    label: "Peak load",
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
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="baseLoad" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="baseLoad"
        variant="solid" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="peakLoad"
        variant="solid" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
