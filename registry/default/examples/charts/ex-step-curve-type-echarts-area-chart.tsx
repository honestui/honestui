"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Subscription health
const data = [
  { month: "January", activated: 401, retained: 181 },
  { month: "February", activated: 935, retained: 417 },
  { month: "March", activated: 590, retained: 275 },
  { month: "April", activated: 715, retained: 357 },
  { month: "May", activated: 515, retained: 303 },
  { month: "June", activated: 842, retained: 379 },
  { month: "July", activated: 474, retained: 226 },
  { month: "August", activated: 1006, retained: 474 },
  { month: "September", activated: 700, retained: 339 },
  { month: "October", activated: 598, retained: 339 },
  { month: "November", activated: 875, retained: 429 },
  { month: "December", activated: 365, retained: 162 },
];

const chartConfig = {
  activated: {
    label: "Activated",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  retained: {
    label: "Retained",
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
      curveType="step" // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="activated" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="activated" variant="gradient" isClickable>
        <AreaChart.Dot variant="default" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="retained" variant="gradient" isClickable>
        <AreaChart.Dot variant="default" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
