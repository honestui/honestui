"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Weekly training distance and marathon finish time for a running
// club (sample data). Both axes fit the data, and the key says neither starts at zero.
const data = [
  { runner: "Ana", distance: 42, finish: 252 },
  { runner: "Ben", distance: 48, finish: 241 },
  { runner: "Chloe", distance: 55, finish: 233 },
  { runner: "Dev", distance: 58, finish: 236 },
  { runner: "Emi", distance: 61, finish: 224 },
  { runner: "Farid", distance: 64, finish: 219 },
  { runner: "Grace", distance: 68, finish: 221 },
  { runner: "Hugo", distance: 72, finish: 209 },
  { runner: "Ines", distance: 75, finish: 206 },
  { runner: "Jon", distance: 79, finish: 212 },
  { runner: "Kai", distance: 83, finish: 198 },
  { runner: "Lena", distance: 88, finish: 194 },
];

const chartConfig = {
  distance: { label: "Weekly distance" },
  finish: { label: "Finish time" },
  runners: {
    label: "Runners",
    colors: { light: ["#0f766e"], dark: ["#2dd4bf"] },
  },
} satisfies ChartConfig;

function formatMinutes(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")}`;
}

export function ExampleScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="distance"
      yDataKey="finish"
      pointNameDataKey="runner"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis min="auto" hideDots tickFormatter={(value) => `${value} km`} />
      <ScatterChart.YAxis min="auto" hideDots tickFormatter={formatMinutes} />
      <ScatterChart.Tooltip
        xValueFormatter={(value) => `${value} km`}
        yValueFormatter={formatMinutes}
      />
      <ScatterChart.Scatter dataKey="runners" />
    </ScatterChart>
  );
}
