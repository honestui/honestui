"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Music royalties
const data = [
  { month: "January", earned: 401, paid: 147 },
  { month: "February", earned: 935, paid: 326 },
  { month: "March", earned: 590, paid: 220 },
  { month: "April", earned: 715, paid: 284 },
  { month: "May", earned: 515, paid: 245 },
  { month: "June", earned: 842, paid: 295 },
  { month: "July", earned: 474, paid: 182 },
  { month: "August", earned: 1006, paid: 370 },
  { month: "September", earned: 700, paid: 271 },
  { month: "October", earned: 598, paid: 272 },
  { month: "November", earned: 875, paid: 332 },
  { month: "December", earned: 365, paid: 134 },
];

const chartConfig = {
  earned: {
    label: "Earned",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  paid: {
    label: "Paid",
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
      curveType="monotoneY" // [!code highlight]
    >
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.YAxis dataKey="earned" />
      <LineChart.Legend isClickable />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="earned" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="default" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="paid" strokeVariant="solid" isClickable>
        <LineChart.Dot variant="default" />
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
