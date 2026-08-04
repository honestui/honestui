"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Café demand
const data = [
  { month: "January", coffee: 476, tea: 150 },
  { month: "February", coffee: 1154, tea: 353 },
  { month: "March", coffee: 710, tea: 232 },
  { month: "April", coffee: 867, tea: 303 },
  { month: "May", coffee: 621, tea: 258 },
  { month: "June", coffee: 1035, tea: 319 },
  { month: "July", coffee: 563, tea: 189 },
  { month: "August", coffee: 1237, tea: 402 },
  { month: "September", coffee: 857, tea: 288 },
  { month: "October", coffee: 724, tea: 288 },
  { month: "November", coffee: 1074, tea: 362 },
  { month: "December", coffee: 420, tea: 134 },
];

const chartConfig = {
  coffee: {
    label: "Coffee",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  tea: {
    label: "Tea",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function LegendHorizontalBarLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend variant="horizontal-bar" />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="coffee" />
      <LineChart.Line dataKey="tea" />
    </LineChart>
  );
}
