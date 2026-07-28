"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

const data = [
  { account: "Acme", segment: "enterprise", seats: 82, adoption: 88 },
  { account: "Globex", segment: "enterprise", seats: 68, adoption: 74 },
  { account: "Initech", segment: "enterprise", seats: 91, adoption: 81 },
  { account: "Umbrella", segment: "enterprise", seats: 74, adoption: 92 },
  { account: "Hooli", segment: "enterprise", seats: 59, adoption: 69 },
  { account: "Linear", segment: "startup", seats: 34, adoption: 91 },
  { account: "Vercel", segment: "startup", seats: 47, adoption: 86 },
  { account: "Raycast", segment: "startup", seats: 22, adoption: 79 },
  { account: "Resend", segment: "startup", seats: 29, adoption: 84 },
  { account: "Cal", segment: "startup", seats: 41, adoption: 72 },
];

const chartConfig = {
  seats: { label: "Licensed seats" },
  adoption: { label: "Adoption" },
  enterprise: {
    label: "Enterprise",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  startup: {
    label: "Startup",
    colors: { light: ["#059669"], dark: ["#34d399"] },
  },
} satisfies ChartConfig;

export function ExampleScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="seats"
      yDataKey="adoption"
      groupDataKey="segment"
      pointNameDataKey="account"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Licensed seats" hideDots />
      <ScatterChart.YAxis label="Adoption" hideDots tickFormatter={(value) => `${value}%`} />
      <ScatterChart.Legend isClickable />
      <ScatterChart.Tooltip yValueFormatter={(value) => `${value}%`} />
      <ScatterChart.Scatter dataKey="enterprise" isClickable />
      <ScatterChart.Scatter dataKey="startup" isClickable />
    </ScatterChart>
  );
}
