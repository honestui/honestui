"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Equipment lending workflow
const data: SankeyData = {
  nodes: [
    { name: "Direct" },
    { name: "Email" },
    { name: "Referral" },
    { name: "Browse" },
    { name: "Search" },
    { name: "ViewItem" },
    { name: "AddToCart" },
    { name: "Checkout" },
    { name: "Abandoned" },
  ],
  links: [
    { source: 0, target: 3, value: 30400 },
    { source: 1, target: 3, value: 16800 },
    { source: 2, target: 3, value: 13600 },
    { source: 3, target: 4, value: 37200 },
    { source: 3, target: 8, value: 23600 },
    { source: 4, target: 5, value: 24800 },
    { source: 4, target: 8, value: 12400 },
    { source: 5, target: 6, value: 16200 },
    { source: 5, target: 8, value: 8600 },
    { source: 6, target: 7, value: 10800 },
    { source: 6, target: 8, value: 5400 },
  ],
};

const chartConfig = {
  Direct: {
    label: "Requests",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  Email: {
    label: "Reservations",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  Referral: {
    label: "Transfers",
    colors: {
      light: ["#06b6d4"],
      dark: ["#22d3ee"],
    },
  },
  Browse: {
    label: "Inventory",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  Search: {
    label: "Search",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  ViewItem: {
    label: "Item reviewed",
    colors: {
      light: ["#ec4899"],
      dark: ["#f472b6"],
    },
  },
  AddToCart: {
    label: "Reserved",
    colors: {
      light: ["#f97316"],
      dark: ["#fb923c"],
    },
  },
  Checkout: {
    label: "Checked out",
    colors: {
      light: ["#22c55e"],
      dark: ["#4ade80"],
    },
  },
  Abandoned: {
    label: "Cancelled",
    colors: {
      light: ["#e11d48"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart className="h-full w-full p-4" data={data} config={chartConfig}>
      <SankeyChart.Node isClickable />
      <SankeyChart.Link
        variant="solid" // [!code highlight]
      />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
