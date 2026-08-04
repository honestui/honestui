"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Call center demand
const data = [
  { month: "January", incoming: 374, answered: 261 },
  { month: "February", incoming: 908, answered: 661 },
  { month: "March", incoming: 563, answered: 412 },
  { month: "April", incoming: 688, answered: 547 },
  { month: "May", incoming: 488, answered: 450 },
  { month: "June", incoming: 815, answered: 600 },
  { month: "July", incoming: 447, answered: 333 },
  { month: "August", incoming: 979, answered: 753 },
  { month: "September", incoming: 673, answered: 516 },
  { month: "October", incoming: 571, answered: 511 },
  { month: "November", incoming: 848, answered: 686 },
  { month: "December", incoming: 338, answered: 223 },
];

const chartConfig = {
  incoming: {
    label: "Incoming",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  answered: {
    label: "Answered",
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
      enableHoverReveal // [!code highlight]
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <LineChart.Legend />
      <LineChart.Tooltip />
      <LineChart.Line dataKey="incoming" strokeVariant="solid">
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
      <LineChart.Line dataKey="answered" strokeVariant="solid">
        <LineChart.ActiveDot variant="default" />
      </LineChart.Line>
    </LineChart>
  );
}
