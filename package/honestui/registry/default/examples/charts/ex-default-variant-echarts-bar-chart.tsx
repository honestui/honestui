"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";

// Scenario: Bookstore sales
const data = [
  { month: "January", hardcover: 347, paperback: 155 },
  { month: "February", hardcover: 881, paperback: 408 },
  { month: "March", hardcover: 536, paperback: 254 },
  { month: "April", hardcover: 661, paperback: 342 },
  { month: "May", hardcover: 461, paperback: 283 },
  { month: "June", hardcover: 788, paperback: 367 },
  { month: "July", hardcover: 420, paperback: 202 },
  { month: "August", hardcover: 952, paperback: 468 },
  { month: "September", hardcover: 646, paperback: 323 },
  { month: "October", hardcover: 544, paperback: 322 },
  { month: "November", hardcover: 821, paperback: 420 },
  { month: "December", hardcover: 311, paperback: 134 },
];

const chartConfig = {
  hardcover: {
    label: "Hardcover",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  paperback: {
    label: "Paperback",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarChart() {
  return (
    <BarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <BarChart.Legend isClickable />
      <BarChart.Tooltip />
      <BarChart.Bar
        dataKey="hardcover"
        variant="default" // [!code highlight]
        isClickable
      />
      <BarChart.Bar
        dataKey="paperback"
        variant="default" // [!code highlight]
        isClickable
      />
    </BarChart>
  );
}
