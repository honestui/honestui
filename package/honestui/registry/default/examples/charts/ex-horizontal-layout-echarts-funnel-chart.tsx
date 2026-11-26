"use client";

import { FunnelChart, type ChartConfig } from "@/registry/default/charts/funnel-chart";

// Scenario: Checkout steps, measured step to step
const data = [
  { step: "Viewed cart", sessions: 8920 },
  { step: "Entered email", sessions: 6105 },
  { step: "Added shipping", sessions: 4870 },
  { step: "Added payment", sessions: 3990 },
  { step: "Placed order", sessions: 3412 },
];

const chartConfig = {
  sessions: {
    label: "Sessions",
    colors: {
      light: ["#059669"],
      dark: ["#10b981"],
    },
  },
} satisfies ChartConfig;

export function ExampleFunnelChart() {
  return (
    <FunnelChart
      data={data}
      config={chartConfig}
      nameKey="step"
      dataKey="sessions"
      layout="horizontal"
      calculateFrom="previous"
      className="h-full w-full p-4"
    >
      <FunnelChart.Axis />
      <FunnelChart.Labels />
      <FunnelChart.Tooltip />
      <FunnelChart.Funnel />
    </FunnelChart>
  );
}
