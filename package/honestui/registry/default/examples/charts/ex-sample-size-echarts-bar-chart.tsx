"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Average satisfaction score by region, out of 10 (sample data).
// Each score comes with the number of survey responses behind it; Oceania
// has too few to lean on.
const data = [
  { region: "North America", score: 8.1, responses: 1204 },
  { region: "Europe", score: 7.8, responses: 862 },
  { region: "Asia Pacific", score: 7.4, responses: 431 },
  { region: "Latin America", score: 8.3, responses: 158 },
  { region: "Oceania", score: 9.2, responses: 14 },
];

const chartConfig = {
  score: {
    label: "Satisfaction",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="region"
      layout="horizontal"
    >
      <BarChart.Grid />
      <BarChart.XAxis tickFormatter={(value) => Number(value).toFixed(0)} />
      <BarChart.YAxis dataKey="region" />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="score"
        sampleSizeKey="responses" // [!code highlight]
        minSampleSize={30} // [!code highlight]
      />
    </BarChart>
  );
}
