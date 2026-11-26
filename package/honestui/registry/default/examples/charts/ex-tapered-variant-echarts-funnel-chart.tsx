"use client";

import { FunnelChart, type ChartConfig } from "@/registry/default/charts/funnel-chart";

// Scenario: Hiring pipeline
const data = [
  { stage: "Applied", candidates: 640 },
  { stage: "Screened", candidates: 212 },
  { stage: "Interviewed", candidates: 84 },
  { stage: "Offered", candidates: 19 },
  { stage: "Hired", candidates: 14 },
];

const chartConfig = {
  candidates: {
    label: "Candidates",
    colors: {
      light: ["#7c3aed"],
      dark: ["#8b5cf6"],
    },
  },
} satisfies ChartConfig;

export function ExampleFunnelChart() {
  return (
    <FunnelChart
      data={data}
      config={chartConfig}
      nameKey="stage"
      dataKey="candidates"
      className="h-full w-full p-4"
    >
      <FunnelChart.Labels />
      <FunnelChart.Tooltip />
      <FunnelChart.Funnel variant="tapered" />
    </FunnelChart>
  );
}
