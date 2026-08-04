"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Rail freight
const data = [
  { month: "January", loaded: 367, unloaded: 130 },
  { month: "February", loaded: 854, unloaded: 285 },
  { month: "March", loaded: 541, unloaded: 195 },
  { month: "April", loaded: 656, unloaded: 251 },
  { month: "May", loaded: 471, unloaded: 218 },
  { month: "June", loaded: 769, unloaded: 258 },
  { month: "July", loaded: 436, unloaded: 161 },
  { month: "August", loaded: 919, unloaded: 323 },
  { month: "September", loaded: 639, unloaded: 239 },
  { month: "October", loaded: 547, unloaded: 241 },
  { month: "November", loaded: 800, unloaded: 289 },
  { month: "December", loaded: 337, unloaded: 121 },
];

const chartConfig = {
  loaded: {
    label: "Loaded",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  unloaded: {
    label: "Unloaded",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value: string) => value.substring(0, 3)} />
      <BarChart.Legend />
      <BarChart.Tooltip
        variant="default" // [!code highlight]
        defaultIndex={4}
      />
      <BarChart.Bar dataKey="loaded" variant="default" />
      <BarChart.Bar dataKey="unloaded" variant="default" />
    </BarChart>
  );
}
