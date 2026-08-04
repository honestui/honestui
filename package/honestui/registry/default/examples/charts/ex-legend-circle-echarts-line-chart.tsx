"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Battery testing
const data = [
  { month: "January", charge: 408, discharge: 116 },
  { month: "February", charge: 990, discharge: 271 },
  { month: "March", charge: 612, discharge: 181 },
  { month: "April", charge: 748, discharge: 237 },
  { month: "May", charge: 532, discharge: 204 },
  { month: "June", charge: 889, discharge: 244 },
  { month: "July", charge: 486, discharge: 147 },
  { month: "August", charge: 1065, discharge: 309 },
  { month: "September", charge: 734, discharge: 225 },
  { month: "October", charge: 622, discharge: 227 },
  { month: "November", charge: 923, discharge: 275 },
  { month: "December", charge: 365, discharge: 107 },
];

const chartConfig = {
  charge: {
    label: "Charge",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  discharge: {
    label: "Discharge",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendCircleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="circle" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="charge" />
      <LineChart.Line dataKey="discharge" />
    </LineChart>
  );
}
