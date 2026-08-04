"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Patient referral flow
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
    label: "Primary care",
    colors: {
      light: ["#059669"],
      dark: ["#34d399"],
    },
  },
  PaidAds: {
    label: "Urgent care",
    colors: {
      light: ["#dc2626"],
      dark: ["#f87171"],
    },
  },
  Social: {
    label: "Telehealth",
    colors: {
      light: ["#7c3aed"],
      dark: ["#a78bfa"],
    },
  },
  Landing: {
    label: "Triage",
    colors: {
      light: ["#0891b2"],
      dark: ["#22d3ee"],
    },
  },
  Product: {
    label: "Specialist",
    colors: {
      light: ["#2563eb"],
      dark: ["#60a5fa"],
    },
  },
  Cart: {
    label: "Treatment",
    colors: {
      light: ["#ea580c"],
      dark: ["#fb923c"],
    },
  },
  Purchase: {
    label: "Discharged",
    colors: {
      light: ["#16a34a"],
      dark: ["#4ade80"],
    },
  },
  Bounced: {
    label: "Follow-up",
    colors: {
      light: ["#f43f5e"],
      dark: ["#fb7185"],
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      nodeWidth={8}
      nodePadding={20}
    >
      <SankeyChart.Node isClickable radius={4}>
        <SankeyChart.NodeLabel
          position="outside" // [!code highlight]
          showValues // [!code highlight]
          valueFormatter={(value) => value.toLocaleString()}
        />
      </SankeyChart.Node>
      <SankeyChart.Link variant="source" />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
