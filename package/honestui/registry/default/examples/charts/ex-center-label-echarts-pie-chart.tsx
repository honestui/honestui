"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Support tickets by channel this week
const data = [
  { channel: "email", tickets: 412 },
  { channel: "chat", tickets: 296 },
  { channel: "phone", tickets: 134 },
  { channel: "social", tickets: 58 },
];

const chartConfig = {
  email: { label: "Email", colors: { light: ["#3b82f6"], dark: ["#60a5fa"] } },
  chat: { label: "Chat", colors: { light: ["#10b981"], dark: ["#34d399"] } },
  phone: { label: "Phone", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  social: { label: "Social", colors: { light: ["#8b5cf6"], dark: ["#a78bfa"] } },
} satisfies ChartConfig;

export function ExamplePieChart() {
  return (
    <PieChart className="h-full w-full p-4" data={data} dataKey="tickets" nameKey="channel" config={chartConfig}>
      <PieChart.Legend isClickable />
      <PieChart.Pie isClickable innerRadius="62%" paddingAngle={2} cornerRadius={4} />
      <PieChart.Center label="Tickets" /> {/* [!code highlight] */}
    </PieChart>
  );
}
