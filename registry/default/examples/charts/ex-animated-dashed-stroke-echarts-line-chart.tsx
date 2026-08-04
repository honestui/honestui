"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Temperature range
const data = [
  { month: "January", highTemp: 212, lowTemp: 88 },
  { month: "February", highTemp: 554, lowTemp: 243 },
  { month: "March", highTemp: 339, lowTemp: 153 },
  { month: "April", highTemp: 423, lowTemp: 209 },
  { month: "May", highTemp: 284, lowTemp: 176 },
  { month: "June", highTemp: 495, lowTemp: 216 },
  { month: "July", highTemp: 266, lowTemp: 119 },
  { month: "August", highTemp: 607, lowTemp: 281 },
  { month: "September", highTemp: 401, lowTemp: 197 },
  { month: "October", highTemp: 341, lowTemp: 199 },
  { month: "November", highTemp: 520, lowTemp: 247 },
  { month: "December", highTemp: 201, lowTemp: 79 },
];

const chartConfig = {
  highTemp: {
    label: "High",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  lowTemp: {
    label: "Low",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4">
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis dataKey="highTemp" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="highTemp"
        strokeVariant="animated-dashed" // [!code highlight]
        isClickable
      >
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line
        dataKey="lowTemp"
        strokeVariant="animated-dashed" // [!code highlight]
        isClickable
      >
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
