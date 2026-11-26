"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Sprint tickets closed by team
const data = [
  { team: "platform", closed: 48 },
  { team: "payments", closed: 41 },
  { team: "growth", closed: 33 },
  { team: "mobile", closed: 26 },
  { team: "design", closed: 18 },
];

const chartConfig = {
  closed: { label: "Tickets closed" },
  platform: { label: "Platform", colors: { light: ["#1d4ed8"], dark: ["#93c5fd"] } },
  payments: { label: "Payments", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  growth: { label: "Growth", colors: { light: ["#3b82f6"], dark: ["#3b82f6"] } },
  mobile: { label: "Mobile", colors: { light: ["#60a5fa"], dark: ["#2563eb"] } },
  design: { label: "Design", colors: { light: ["#93c5fd"], dark: ["#1d4ed8"] } },
} satisfies ChartConfig;

export function ExampleRadialChart() {
  return (
    <RadialChart
      className="h-full w-full p-4"
      data={data}
      dataKey="closed"
      nameKey="team"
      config={chartConfig}
      innerRadius="22%"
      endAngle={-180}
    >
      <RadialChart.Bar track={false} />
      <RadialChart.Label />
      <RadialChart.Tooltip />
    </RadialChart>
  );
}
