"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: School enrollment
const data = [
  { month: "January", enrolled: 435, waitlisted: 164 },
  { month: "February", enrolled: 1017, waitlisted: 367 },
  { month: "March", enrolled: 639, waitlisted: 246 },
  { month: "April", enrolled: 775, waitlisted: 317 },
  { month: "May", enrolled: 559, waitlisted: 272 },
  { month: "June", enrolled: 916, waitlisted: 333 },
  { month: "July", enrolled: 513, waitlisted: 203 },
  { month: "August", enrolled: 1092, waitlisted: 416 },
  { month: "September", enrolled: 761, waitlisted: 302 },
  { month: "October", enrolled: 649, waitlisted: 302 },
  { month: "November", enrolled: 950, waitlisted: 376 },
  { month: "December", enrolled: 392, waitlisted: 148 },
];

const chartConfig = {
  enrolled: {
    label: "Enrolled",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  waitlisted: {
    label: "Waitlisted",
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
      <LineChart.YAxis dataKey="enrolled" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="enrolled"
        strokeVariant="solid" // [!code highlight]
        isClickable
      >
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line
        dataKey="waitlisted"
        strokeVariant="solid" // [!code highlight]
        isClickable
      >
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
