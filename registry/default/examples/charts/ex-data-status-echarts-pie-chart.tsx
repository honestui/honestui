"use client";

import { PieChart, type ChartConfig } from "@/registry/default/charts/pie-chart";

// Scenario: Support tickets by channel this quarter (sample data).
// Chat is still being counted, phone was estimated from call logs, and the
// social inbox export failed, so its total is unknown.
const data = [
  { channel: "email", tickets: 1840, status: "measured" },
  { channel: "chat", tickets: 1260, status: "provisional" },
  { channel: "phone", tickets: 720, status: "estimated", low: 640, high: 810 },
  { channel: "forum", tickets: 410, status: "measured" },
  { channel: "social", tickets: null, status: "missing" },
];

const chartConfig = {
  email: { label: "Email", colors: { light: ["#1d4ed8"], dark: ["#60a5fa"] } },
  chat: { label: "Chat", colors: { light: ["#047857"], dark: ["#34d399"] } },
  phone: { label: "Phone", colors: { light: ["#b45309"], dark: ["#fbbf24"] } },
  forum: { label: "Forum", colors: { light: ["#7e22ce"], dark: ["#c084fc"] } },
  social: { label: "Social", colors: { light: ["#be123c"], dark: ["#fb7185"] } },
} satisfies ChartConfig;

export function ExamplePieChart() {
  return (
    <PieChart
      data={data}
      config={chartConfig}
      dataKey="tickets"
      nameKey="channel"
      statusKey="status" // [!code highlight]
      lowerKey="low" // [!code highlight]
      upperKey="high" // [!code highlight]
      className="h-full w-full p-4"
      ariaLabel="Sample support tickets by channel. Email and forum are measured, chat is provisional, phone is estimated, and social is missing."
    >
      <PieChart.Legend />
      <PieChart.Tooltip />
      <PieChart.Pie innerRadius="45%" paddingAngle={2} />
    </PieChart>
  );
}
