"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Wildlife field survey
const data = [
  { species: "Elk", mass: 21, speed: 84, population: 140 },
  { species: "Fox", mass: 36, speed: 63, population: 281 },
  { species: "Bison", mass: 54, speed: 74, population: 480 },
  { species: "Hare", mass: 67, speed: 48, population: 608 },
  { species: "Wolf", mass: 80, speed: 56, population: 889 },
  { species: "Lynx", mass: 92, speed: 37, population: 1147 },
  { species: "Bear", mass: 103, speed: 30, population: 1580 },
  { species: "Deer", mass: 44, speed: 95, population: 386 },
];

const chartConfig = {
  mass: { label: "Body mass" },
  speed: { label: "Top speed" },
  population: { label: "Population" },
  companies: {
    label: "Species",
    colors: {
      light: ["#dbeafe", "#2563eb"],
      dark: ["#1e3a8a", "#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function BubbleScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="mass"
      yDataKey="speed"
      pointNameDataKey="species"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Body mass" hideDots tickFormatter={(value) => `$${value}m`} />
      <ScatterChart.YAxis label="Top speed" hideDots tickFormatter={(value) => `${value}%`} />
      <ScatterChart.Tooltip
        xValueFormatter={(value) => `$${value}m`}
        yValueFormatter={(value) => `${value}%`}
        sizeValueFormatter={(value) => value.toLocaleString()}
      />
      <ScatterChart.Scatter
        dataKey="companies"
        variant="bubble"
        sizeDataKey="population"
        minSize={12}
        maxSize={52}
        isClickable
      />
    </ScatterChart>
  );
}
