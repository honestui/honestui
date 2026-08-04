"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Freight capacity
const data = [
  { month: "January", used: 482 },
  { month: "February", used: 1209 },
  { month: "March", used: 732 },
  { month: "April", used: 900 },
  { month: "May", used: 638 },
  { month: "June", used: 1082 },
  { month: "July", used: 574 },
  { month: "August", used: 1296 },
  { month: "September", used: 891 },
  { month: "October", used: 748 },
  { month: "November", used: 1122 },
  { month: "December", used: 420 },
];

const chartConfig = {
  used: {
    label: "Used capacity",
    colors: {
      light: ["#0a0a0a"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="used"
        variant="expandable" // [!code highlight]
      />
    </BarChart>
  );
}
