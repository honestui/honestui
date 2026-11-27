"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Daily support tickets by channel (sample data).
// The export skipped Nov 7 and Nov 8 entirely, and chat sent nothing on Nov 11.
const data = [
  { day: "2026-11-02", email: 142, chat: 96 },
  { day: "2026-11-03", email: 158, chat: 104 },
  { day: "2026-11-04", email: 131, chat: 88 },
  { day: "2026-11-05", email: 149, chat: 112 },
  { day: "2026-11-06", email: 121, chat: 79 },
  { day: "2026-11-09", email: 166, chat: 118 },
  { day: "2026-11-10", email: 152, chat: 101 },
  { day: "2026-11-11", email: 139, chat: null },
  { day: "2026-11-12", email: 147, chat: 97 },
];

const chartConfig = {
  email: {
    label: "Email",
    colors: { light: ["#4f46e5"], dark: ["#818cf8"] },
  },
  chat: {
    label: "Chat",
    colors: { light: ["#c2410c"], dark: ["#fb923c"] },
  },
} satisfies ChartConfig;

const dayLabel = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleBarChart() {
  return (
    <BarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="day"
      gaps={{ interval: "day" }} // [!code highlight]
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="day" tickFormatter={dayLabel} />
      <BarChart.YAxis />
      <BarChart.Legend />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="email" />
      <BarChart.Bar dataKey="chat" />
    </BarChart>
  );
}
