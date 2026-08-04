"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Garden growth
const data = [
  { month: "January", tomatoes: 469, peppers: 180 },
  { month: "February", tomatoes: 1099, peppers: 409 },
  { month: "March", tomatoes: 688, peppers: 271 },
  { month: "April", tomatoes: 835, peppers: 351 },
  { month: "May", tomatoes: 603, peppers: 298 },
  { month: "June", tomatoes: 989, peppers: 371 },
  { month: "July", tomatoes: 551, peppers: 223 },
  { month: "August", tomatoes: 1178, peppers: 463 },
  { month: "September", tomatoes: 823, peppers: 333 },
  { month: "October", tomatoes: 700, peppers: 333 },
  { month: "November", tomatoes: 1025, peppers: 419 },
  { month: "December", tomatoes: 419, peppers: 162 },
];

const chartConfig = {
  tomatoes: {
    label: "Tomatoes",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  peppers: {
    label: "Peppers",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      curveType="step" // [!code highlight]
    >
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis dataKey="tomatoes" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="tomatoes" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="default" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="peppers" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="default" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
