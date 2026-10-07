"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Building energy use against floor area (sample data).
// Two buildings have modelled readings with bounds, one has a partial year,
// one is a projection for a building that opens next year, and one meter failed.
const data = [
  { building: "Harbor Tower", type: "office", floorArea: 96, energyUse: 103, status: "measured" },
  { building: "Maple Center", type: "office", floorArea: 80, energyUse: 87, status: "measured" },
  { building: "Civic Hall", type: "office", floorArea: 106, energyUse: 95, status: "estimated", low: 88, high: 104 },
  { building: "Union House", type: "office", floorArea: 87, energyUse: 108, status: "provisional" },
  { building: "Market Annex", type: "office", floorArea: 69, energyUse: 81, status: "measured" },
  { building: "Quay Building", type: "office", floorArea: 118, energyUse: 112, status: "forecast", low: 101, high: 124 },
  { building: "Roosevelt School", type: "school", floorArea: 40, energyUse: 106, status: "measured" },
  { building: "Lincoln School", type: "school", floorArea: 55, energyUse: 101, status: "estimated", low: 94, high: 109 },
  { building: "Adams School", type: "school", floorArea: 26, energyUse: 92, status: "measured" },
  { building: "Franklin School", type: "school", floorArea: 34, energyUse: null, status: "missing" },
  { building: "Jefferson School", type: "school", floorArea: 48, energyUse: 84, status: "provisional" },
];

const chartConfig = {
  floorArea: { label: "Floor area" },
  energyUse: { label: "Energy use" },
  office: { label: "Office", colors: { light: ["#1d4ed8"], dark: ["#60a5fa"] } },
  school: { label: "School", colors: { light: ["#b45309"], dark: ["#fbbf24"] } },
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
      statusKey="status" // [!code highlight]
      yLowerKey="low" // [!code highlight]
      yUpperKey="high" // [!code highlight]
      className="h-full w-full p-4"
      ariaLabel="Sample energy use against floor area for offices and schools. Most readings are measured; some are estimated, provisional, or forecast, and one school has no reading."
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Floor area (thousand sq ft)" hideDots />
      <ScatterChart.YAxis label="Energy use (kBtu per sq ft)" hideDots />
      <ScatterChart.Legend />
      <ScatterChart.Tooltip />
      <ScatterChart.Scatter dataKey="office" symbolSize={12} />
      <ScatterChart.Scatter dataKey="school" symbolSize={12} />
    </ScatterChart>
  );
}
