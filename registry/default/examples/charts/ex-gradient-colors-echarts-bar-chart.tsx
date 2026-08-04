"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Recycling stream
const data = [
  { month: "January", recovered: 307, landfill: 169 },
  { month: "February", recovered: 745, landfill: 422 },
  { month: "March", recovered: 465, landfill: 268 },
  { month: "April", recovered: 569, landfill: 356 },
  { month: "May", recovered: 399, landfill: 297 },
  { month: "June", recovered: 669, landfill: 381 },
  { month: "July", recovered: 370, landfill: 216 },
  { month: "August", recovered: 806, landfill: 482 },
  { month: "September", recovered: 551, landfill: 337 },
  { month: "October", recovered: 470, landfill: 336 },
  { month: "November", recovered: 697, landfill: 434 },
  { month: "December", recovered: 283, landfill: 148 },
];

const chartConfig = {
  recovered: {
    label: "Recovered",
    colors: {
      light: ["#a855f7", "#6366f1", "#3b82f6"], // [!code highlight]
      dark: ["#f43f5e", "#ec4899", "#a855f7", "#6366f1", "#3b82f6"], // [!code highlight]
    },
  },
  landfill: {
    label: "Landfill",
    colors: {
      light: ["#10b981", "#34d399", "#6ee7b7"], // [!code highlight]
      dark: ["#10b981", "#14b8a6", "#06b6d4"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar dataKey="recovered" variant="default" isClickable />
      <BarChart.Bar dataKey="landfill" variant="default" isClickable />
    </BarChart>
  );
}
