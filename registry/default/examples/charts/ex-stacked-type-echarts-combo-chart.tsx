"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Support tickets by channel against tickets resolved
const data = [
  { week: "Week 1", email: 182, chat: 241, phone: 96, resolved: 488 },
  { week: "Week 2", email: 167, chat: 263, phone: 88, resolved: 501 },
  { week: "Week 3", email: 201, chat: 289, phone: 104, resolved: 552 },
  { week: "Week 4", email: 176, chat: 312, phone: 91, resolved: 560 },
  { week: "Week 5", email: 158, chat: 334, phone: 83, resolved: 571 },
  { week: "Week 6", email: 149, chat: 358, phone: 79, resolved: 579 },
  { week: "Week 7", email: 163, chat: 371, phone: 72, resolved: 597 },
  { week: "Week 8", email: 141, chat: 396, phone: 68, resolved: 601 },
];

const chartConfig = {
  email: { label: "Email", colors: { light: ["#1e40af"], dark: ["#93c5fd"] } },
  chat: { label: "Chat", colors: { light: ["#3b82f6"], dark: ["#3b82f6"] } },
  phone: { label: "Phone", colors: { light: ["#93c5fd"], dark: ["#1e40af"] } },
  resolved: { label: "Resolved", colors: { light: ["#0f766e"], dark: ["#2dd4bf"] } },
} satisfies ChartConfig;

export function ExampleStackedComboChart() {
  return (
    <ComboChart
      data={data}
      config={chartConfig}
      xDataKey="week"
      stackType="stacked"
      className="h-full w-full p-4"
    >
      <ComboChart.Grid />
      <ComboChart.XAxis tickFormatter={(value) => value.replace("Week ", "W")} />
      <ComboChart.YAxis />
      <ComboChart.Legend />
      <ComboChart.Tooltip />
      <ComboChart.Bar dataKey="email" />
      <ComboChart.Bar dataKey="chat" />
      <ComboChart.Bar dataKey="phone" />
      <ComboChart.Line dataKey="resolved" strokeVariant="dashed" curveType="linear">
        <ComboChart.Dot variant="colored-border" />
      </ComboChart.Line>
    </ComboChart>
  );
}
