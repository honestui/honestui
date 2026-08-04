"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Newsletter growth
const data = [
  { month: "January", subscribers: 307, unsubscribes: 169 },
  { month: "February", subscribers: 745, unsubscribes: 422 },
  { month: "March", subscribers: 465, unsubscribes: 268 },
  { month: "April", subscribers: 569, unsubscribes: 356 },
  { month: "May", subscribers: 399, unsubscribes: 297 },
  { month: "June", subscribers: 669, unsubscribes: 381 },
  { month: "July", subscribers: 370, unsubscribes: 216 },
  { month: "August", subscribers: 806, unsubscribes: 482 },
  { month: "September", subscribers: 551, unsubscribes: 337 },
  { month: "October", subscribers: 470, unsubscribes: 336 },
  { month: "November", subscribers: 697, unsubscribes: 434 },
  { month: "December", subscribers: 283, unsubscribes: 148 },
];

const chartConfig = {
  subscribers: {
    label: "Subscribers",
    colors: {
      light: ["red", "orange", "rosybrown", "purple", "blue"],
      dark: ["red", "orange", "rosybrown", "purple", "blue"],
    },
  },
  unsubscribes: {
    label: "Unsubscribes",
    colors: {
      light: ["gray"],
      dark: ["gray"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      curveType="bump" // [!code highlight]
    >
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="subscribers" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="colored-border" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="unsubscribes" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="colored-border" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
