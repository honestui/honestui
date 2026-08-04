"use client";

import { AreaChart, type ChartConfig } from "@/registry/default/charts/area-chart";

// Scenario: Course progress
const data = [
  { month: "January", lessons: 313, exercises: 182 },
  { month: "February", lessons: 800, exercises: 484 },
  { month: "March", lessons: 487, exercises: 299 },
  { month: "April", lessons: 602, exercises: 402 },
  { month: "May", lessons: 417, exercises: 331 },
  { month: "June", lessons: 715, exercises: 437 },
  { month: "July", lessons: 382, exercises: 238 },
  { month: "August", lessons: 865, exercises: 555 },
  { month: "September", lessons: 585, exercises: 379 },
  { month: "October", lessons: 493, exercises: 377 },
  { month: "November", lessons: 746, exercises: 501 },
  { month: "December", lessons: 283, exercises: 156 },
];

const chartConfig = {
  lessons: {
    label: "Lessons",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  exercises: {
    label: "Exercises",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleAreaChart() {
  return (
    <AreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      stackType="stacked"
      curveType="bump" // [!code highlight]
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <AreaChart.YAxis dataKey="lessons" />
      <AreaChart.Legend isClickable />
      <AreaChart.Tooltip />
      <AreaChart.Area dataKey="lessons" variant="gradient" isClickable>
        <AreaChart.Dot variant="default" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
      <AreaChart.Area dataKey="exercises" variant="gradient" isClickable>
        <AreaChart.Dot variant="default" />
        <AreaChart.ActiveDot variant="default" />
      </AreaChart.Area>
    </AreaChart>
  );
}
