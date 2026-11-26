"use client";

import { FunnelChart, type ChartConfig } from "@/registry/default/charts/funnel-chart";

// Scenario: Trial signup funnel
const data = [
  { stage: "Visited pricing", people: 12480 },
  { stage: "Started trial", people: 4620 },
  { stage: "Invited a teammate", people: 2310 },
  { stage: "Connected data", people: 1585 },
  { stage: "Upgraded", people: 742 },
];

const chartConfig = {
  people: {
    label: "People",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
} satisfies ChartConfig;

export function ExampleFunnelChart() {
  return (
    <FunnelChart
      data={data}
      config={chartConfig}
      nameKey="stage"
      dataKey="people"
      className="h-full w-full p-4"
    >
      <FunnelChart.Grid />
      <FunnelChart.Axis />
      <FunnelChart.Labels />
      <FunnelChart.Tooltip />
      <FunnelChart.Funnel />
    </FunnelChart>
  );
}
