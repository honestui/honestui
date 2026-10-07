"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Daily sensor temperature in °C (sample data).
// Thursday was reconstructed from neighbouring sensors, and Saturday was never recorded.
const data = [
  { day: "Monday", temperature: 18.2, status: "measured" },
  { day: "Tuesday", temperature: 19.1, status: "measured" },
  { day: "Wednesday", temperature: 17.6, status: "measured" },
  { day: "Thursday", temperature: 18.4, status: "estimated", low: 17.5, high: 19.3 },
  { day: "Friday", temperature: 20.3, status: "measured" },
  { day: "Saturday", temperature: null, status: "missing" },
  { day: "Sunday", temperature: 19.7, status: "measured" },
];

const chartConfig = {
  temperature: {
    label: "Temperature",
    colors: {
      light: ["#b45309"],
      dark: ["#fbbf24"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="day"
      ariaLabel="Sample daily temperature. Thursday is estimated and Saturday is missing."
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="day" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="temperature"
        statusKey="status" // [!code highlight]
        lowerKey="low"
        upperKey="high"
      >
        <LineChart.Dot variant="border" />
        <LineChart.ActiveDot variant="colored-border" />
      </LineChart.Line>
    </LineChart>
  );
}
