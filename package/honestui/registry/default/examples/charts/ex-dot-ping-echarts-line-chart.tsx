"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Crop moisture
const data = [
  { month: "January", topsoil: 449, subsoil: 102 },
  { month: "February", topsoil: 1127, subsoil: 257 },
  { month: "March", topsoil: 683, subsoil: 167 },
  { month: "April", topsoil: 840, subsoil: 223 },
  { month: "May", topsoil: 594, subsoil: 190 },
  { month: "June", topsoil: 1008, subsoil: 230 },
  { month: "July", topsoil: 536, subsoil: 133 },
  { month: "August", topsoil: 1210, subsoil: 295 },
  { month: "September", topsoil: 830, subsoil: 211 },
  { month: "October", topsoil: 697, subsoil: 213 },
  { month: "November", topsoil: 1047, subsoil: 261 },
  { month: "December", topsoil: 393, subsoil: 93 },
];

const chartConfig = {
  topsoil: {
    label: "Topsoil",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  subsoil: {
    label: "Subsoil",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function DotPingLineChart() {
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
      <LineChart.Line dataKey="topsoil">
        <LineChart.Dot variant="ping" />
      </LineChart.Line>
      <LineChart.Line dataKey="subsoil">
        <LineChart.Dot variant="ping" />
      </LineChart.Line>
    </LineChart>
  );
}
