"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Treasury cash flow
const data = [
  { month: "January", inflow: 476, outflow: 189 },
  { month: "February", inflow: 1154, outflow: 458 },
  { month: "March", inflow: 710, outflow: 294 },
  { month: "April", inflow: 867, outflow: 386 },
  { month: "May", inflow: 621, outflow: 324 },
  { month: "June", inflow: 1035, outflow: 415 },
  { month: "July", inflow: 563, outflow: 239 },
  { month: "August", inflow: 1237, outflow: 522 },
  { month: "September", inflow: 857, outflow: 366 },
  { month: "October", inflow: 724, outflow: 365 },
  { month: "November", inflow: 1074, outflow: 472 },
  { month: "December", inflow: 420, outflow: 166 },
];

const chartConfig = {
  inflow: {
    label: "Cash in",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  outflow: {
    label: "Cash out",
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
      <AreaChart.YAxis dataKey="inflow" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area
        dataKey="inflow"
        variant="lines" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area
        dataKey="outflow"
        variant="lines" // [!code highlight]
        isClickable
      >
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
