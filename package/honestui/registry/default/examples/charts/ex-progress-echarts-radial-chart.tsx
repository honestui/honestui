"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Daily activity goals, as a percent of each target
const data = [
  { goal: "move", percent: 82 },
  { goal: "exercise", percent: 64 },
  { goal: "stand", percent: 100 },
];

const chartConfig = {
  percent: { label: "Progress" },
  move: { label: "Move", colors: { light: ["#f43f5e"], dark: ["#fb7185"] } },
  exercise: { label: "Exercise", colors: { light: ["#84cc16"], dark: ["#a3e635"] } },
  stand: { label: "Stand", colors: { light: ["#06b6d4"], dark: ["#22d3ee"] } },
} satisfies ChartConfig;

export function ExampleRadialChart() {
  return (
    <RadialChart
      className="h-full w-full p-4"
      data={data}
      dataKey="percent"
      nameKey="goal"
      config={chartConfig}
      max={100} // [!code highlight]
      innerRadius="45%"
    >
      <RadialChart.Bar />
      <RadialChart.Center value="1 of 3" label="Rings closed" valueFormatter={(value) => `${value}%`} />
      <RadialChart.Tooltip valueFormatter={(value) => `${value}%`} />
    </RadialChart>
  );
}
