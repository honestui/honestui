"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Average satisfaction score out of 5 from a weekly survey (sample
// data). Holiday weeks drew few responses, so their averages are shakier.
const data = [
  { week: "Oct 6", score: 4.1, responses: 212 },
  { week: "Oct 13", score: 4.2, responses: 198 },
  { week: "Oct 20", score: 4.0, responses: 224 },
  { week: "Oct 27", score: 4.6, responses: 18 },
  { week: "Nov 3", score: 4.1, responses: 187 },
  { week: "Nov 10", score: 4.2, responses: 205 },
  { week: "Nov 17", score: 3.5, responses: 22 },
  { week: "Nov 24", score: 4.1, responses: 176 },
];

const chartConfig = {
  score: {
    label: "Satisfaction",
    colors: { light: ["#be185d"], dark: ["#f472b6"] },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4" xDataKey="week">
      <LineChart.Grid />
      <LineChart.XAxis dataKey="week" />
      <LineChart.YAxis />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="score" sampleSizeKey="responses" minSampleSize={30}>
        <LineChart.Dot variant="border" />
      </LineChart.Line>
    </LineChart>
  );
}
