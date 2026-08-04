"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Hospital census
const data = [
  { month: "January", admissions: 239, discharges: 136 },
  { month: "February", admissions: 581, discharges: 339 },
  { month: "March", admissions: 366, discharges: 218 },
  { month: "April", admissions: 450, discharges: 289 },
  { month: "May", admissions: 311, discharges: 244 },
  { month: "June", admissions: 522, discharges: 305 },
  { month: "July", admissions: 293, discharges: 175 },
  { month: "August", admissions: 634, discharges: 388 },
  { month: "September", admissions: 428, discharges: 274 },
  { month: "October", admissions: 368, discharges: 274 },
  { month: "November", admissions: 547, discharges: 348 },
  { month: "December", admissions: 228, discharges: 120 },
];

const chartConfig = {
  admissions: {
    label: "Admissions",
    colors: {
      light: ["red", "orange", "rosybrown", "purple", "blue"],
      dark: ["red", "orange", "rosybrown", "purple", "blue"],
    },
  },
  discharges: {
    label: "Discharges",
    colors: {
      light: ["gray"],
      dark: ["gray"],
    },
  },
} satisfies ChartConfig;

export function ExampleLineChart() {
  return (
    <LineChart data={data} config={chartConfig} className="h-full w-full p-4">
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line
        dataKey="admissions"
        strokeVariant="solid"
        glowing // [!code highlight]
        isClickable
      >
        <LineChart.Dot variant="colored-border" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="discharges" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="colored-border" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
