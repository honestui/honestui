"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Support agents by tickets closed and satisfaction, split at the team averages
const data = [
  { agent: "Ana", tickets: 142, csat: 4.6 },
  { agent: "Ben", tickets: 118, csat: 4.1 },
  { agent: "Chloe", tickets: 165, csat: 4.3 },
  { agent: "Dev", tickets: 97, csat: 4.7 },
  { agent: "Emil", tickets: 131, csat: 3.8 },
  { agent: "Fay", tickets: 154, csat: 4.8 },
  { agent: "Gus", tickets: 88, csat: 3.9 },
  { agent: "Hana", tickets: 176, csat: 4.0 },
  { agent: "Ivo", tickets: 109, csat: 4.4 },
  { agent: "Jun", tickets: 126, csat: 4.5 },
  { agent: "Kai", tickets: 148, csat: 3.7 },
  { agent: "Lea", tickets: 103, csat: 4.2 },
];

const chartConfig = {
  agents: {
    label: "Agents",
    colors: { light: ["#4f46e5"], dark: ["#818cf8"] },
  },
} satisfies ChartConfig;

export function ExampleReferenceLinesScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="tickets"
      yDataKey="csat"
      pointNameDataKey="agent"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Tickets closed" min={80} max={180} />
      <ScatterChart.YAxis label="Satisfaction" min={3.6} max={5} />
      <ScatterChart.Tooltip />
      <ScatterChart.ReferenceLine x={130} label="Avg 130" /> {/* [!code highlight] */}
      <ScatterChart.ReferenceLine y={4.25} label="Avg 4.25" /> {/* [!code highlight] */}
      <ScatterChart.ReferenceDot x={154} y={4.8} label="Top agent" labelPosition="right" color="agents" /> {/* [!code highlight] */}
      <ScatterChart.Scatter dataKey="agents" />
    </ScatterChart>
  );
}
