"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Coffee supply chain
const data: SankeyData = {
  nodes: [
    { name: "Organic" },
    { name: "PaidAds" },
    { name: "Social" },
    { name: "Landing" },
    { name: "Product" },
    { name: "Cart" },
    { name: "Purchase" },
    { name: "Bounced" },
  ],
  links: [
    { source: 0, target: 3, value: 84000 },
    { source: 1, target: 3, value: 56000 },
    { source: 2, target: 3, value: 36000 },
    { source: 3, target: 4, value: 104000 },
    { source: 3, target: 7, value: 72000 },
    { source: 4, target: 5, value: 62000 },
    { source: 4, target: 7, value: 42000 },
    { source: 5, target: 6, value: 48000 },
    { source: 5, target: 7, value: 14000 },
  ],
};

const chartConfig = {
  Organic: {
    label: "Farms",
    colors: {
      light: ["#059669"],
      dark: ["#34d399"],
    },
  },
  PaidAds: {
    label: "Cooperatives",
    colors: {
      light: ["#dc2626"],
      dark: ["#f87171"],
    },
  },
  Social: {
    label: "Importers",
    colors: {
      light: ["#7c3aed"],
      dark: ["#a78bfa"],
    },
  },
  Landing: {
    label: "Roastery",
    colors: {
      light: ["#0891b2"],
      dark: ["#22d3ee"],
    },
  },
  Product: {
    label: "Distribution",
    colors: {
      light: ["#2563eb"],
      dark: ["#60a5fa"],
    },
  },
  Cart: {
    label: "Cafés",
    colors: {
      light: ["#ea580c"],
      dark: ["#fb923c"],
    },
  },
  Purchase: {
    label: "Served",
    colors: {
      light: ["#16a34a"],
      dark: ["#4ade80"],
    },
  },
  Bounced: {
    label: "Waste",
    colors: {
      light: ["#f43f5e"],
      dark: ["#fb7185"],
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart className="h-full w-full p-4" data={data} config={chartConfig}>
      <SankeyChart.Node isClickable>
        <SankeyChart.NodeLabel position="outside" showValues />
      </SankeyChart.Node>
      <SankeyChart.Link variant="source" />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
