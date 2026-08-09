"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Building energy performance
const data = [
  { building: "Harbor Tower", type: "office", floorArea: 96, energyUse: 103 },
  { building: "Maple Center", type: "office", floorArea: 80, energyUse: 87 },
  { building: "Civic Hall", type: "office", floorArea: 106, energyUse: 95 },
  { building: "Union House", type: "office", floorArea: 87, energyUse: 108 },
  { building: "Market Annex", type: "office", floorArea: 69, energyUse: 81 },
  { building: "Roosevelt School", type: "school", floorArea: 40, energyUse: 106 },
  { building: "Lincoln School", type: "school", floorArea: 55, energyUse: 101 },
  { building: "Adams School", type: "school", floorArea: 26, energyUse: 92 },
  { building: "Franklin School", type: "school", floorArea: 34, energyUse: 98 },
  { building: "Jefferson School", type: "school", floorArea: 48, energyUse: 84 },
];

const chartConfig = {
  floorArea: { label: "Licensed floorArea" },
  energyUse: { label: "Energy use" },
  office: {
    label: "Office",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  school: {
    label: "School",
    colors: { light: ["#059669"], dark: ["#34d399"] },
  },
} satisfies ChartConfig;

export function ExampleScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="floorArea"
      yDataKey="energyUse"
      groupDataKey="type"
      pointNameDataKey="building"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Licensed floorArea" hideDots />
      <ScatterChart.YAxis label="Adoption" hideDots tickFormatter={(value) => `${value}%`} />
      <ScatterChart.Legend isClickable />
      <ScatterChart.Tooltip yValueFormatter={(value) => `${value}%`} />
      <ScatterChart.Scatter dataKey="office" isClickable />
      <ScatterChart.Scatter dataKey="school" isClickable />
    </ScatterChart>
  );
}
