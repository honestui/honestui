"use client";

import { BarList, type ChartConfig } from "@/registry/default/charts/bar-list";

// Scenario: Top pages by visitors
const data = [
  { page: "/", visitors: 8420 },
  { page: "/pricing", visitors: 3912 },
  { page: "/docs/getting-started", visitors: 3104 },
  { page: "/blog/launch-week", visitors: 2287 },
  { page: "/changelog", visitors: 1460 },
  { page: "/careers", visitors: 642 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
} satisfies ChartConfig;

export function ExampleBarList() {
  return (
    <BarList
      data={data}
      config={chartConfig}
      nameKey="page"
      valueKey="visitors"
      nameLabel="Page"
      valueLabel="Visitors"
      className="w-full max-w-md"
    />
  );
}
