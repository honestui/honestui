"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Train punctuality
const data = [
  { month: "January", arrivals: 273, departures: 152 },
  { month: "February", arrivals: 663, departures: 381 },
  { month: "March", arrivals: 416, departures: 243 },
  { month: "April", arrivals: 510, departures: 323 },
  { month: "May", arrivals: 355, departures: 270 },
  { month: "June", arrivals: 596, departures: 343 },
  { month: "July", arrivals: 332, departures: 195 },
  { month: "August", arrivals: 720, departures: 435 },
  { month: "September", arrivals: 489, departures: 305 },
  { month: "October", arrivals: 419, departures: 305 },
  { month: "November", arrivals: 622, departures: 391 },
  { month: "December", arrivals: 255, departures: 134 },
];

const chartConfig = {
  arrivals: {
    label: "Arrivals",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  departures: {
    label: "Departures",
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
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="arrivals" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
      <LineChart.Line
        dataKey="departures"
        strokeVariant="solid"
        glowing // [!code highlight]
        isClickable
      >
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
