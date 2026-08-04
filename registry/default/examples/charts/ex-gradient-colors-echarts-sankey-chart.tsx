"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: University funding
const data: SankeyData = {
  nodes: [
    { name: "ProductSales" },
    { name: "Subscriptions" },
    { name: "Services" },
    { name: "TotalRevenue" },
    { name: "Research" },
    { name: "Marketing" },
    { name: "Operations" },
    { name: "Salaries" },
    { name: "Profit" },
  ],
  links: [
    { source: 0, target: 3, value: 900000 },
    { source: 1, target: 3, value: 640000 },
    { source: 2, target: 3, value: 360000 },
    { source: 3, target: 4, value: 370000 },
    { source: 3, target: 5, value: 284000 },
    { source: 3, target: 6, value: 396000 },
    { source: 3, target: 7, value: 570000 },
    { source: 3, target: 8, value: 280000 },
  ],
};

const chartConfig = {
  ProductSales: {
    label: "Tuition",
    colors: {
      light: ["#86efac", "#22c55e", "#16a34a", "#15803d", "#166534"], // [!code highlight]
      dark: ["#bbf7d0", "#4ade80", "#22c55e", "#16a34a", "#15803d"], // [!code highlight]
    },
  },
  Subscriptions: {
    label: "Research grants",
    colors: {
      light: ["#93c5fd", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"], // [!code highlight]
      dark: ["#bfdbfe", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"], // [!code highlight]
    },
  },
  Services: {
    label: "Donations",
    colors: {
      light: ["#c4b5fd", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"], // [!code highlight]
      dark: ["#ddd6fe", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9"], // [!code highlight]
    },
  },
  TotalRevenue: {
    label: "University fund",
    colors: {
      light: ["#fde047", "#eab308", "#ca8a04", "#a16207", "#854d0e"], // [!code highlight]
      dark: ["#fef08a", "#facc15", "#eab308", "#ca8a04", "#a16207"], // [!code highlight]
    },
  },
  Research: {
    label: "Labs",
    colors: {
      light: ["#67e8f9", "#06b6d4", "#0891b2", "#0e7490", "#155e75"], // [!code highlight]
      dark: ["#a5f3fc", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490"], // [!code highlight]
    },
  },
  Marketing: {
    label: "Admissions",
    colors: {
      light: ["#f9a8d4", "#ec4899", "#db2777", "#be185d", "#9d174d"], // [!code highlight]
      dark: ["#fbcfe8", "#f472b6", "#ec4899", "#db2777", "#be185d"], // [!code highlight]
    },
  },
  Operations: {
    label: "Facilities",
    colors: {
      light: ["#fdba74", "#f97316", "#ea580c", "#c2410c", "#9a3412"], // [!code highlight]
      dark: ["#fed7aa", "#fb923c", "#f97316", "#ea580c", "#c2410c"], // [!code highlight]
    },
  },
  Salaries: {
    label: "Faculty",
    colors: {
      light: ["#5eead4", "#14b8a6", "#0d9488", "#0f766e", "#115e59"], // [!code highlight]
      dark: ["#99f6e4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e"], // [!code highlight]
    },
  },
  Profit: {
    label: "Scholarships",
    colors: {
      light: ["#bef264", "#84cc16", "#65a30d", "#4d7c0f", "#3f6212"], // [!code highlight]
      dark: ["#d9f99d", "#a3e635", "#84cc16", "#65a30d", "#4d7c0f"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart className="h-full w-full p-4" data={data} config={chartConfig}>
      <SankeyChart.Node isClickable>
        <SankeyChart.NodeLabel position="outside" showValues />
      </SankeyChart.Node>
      <SankeyChart.Link variant="gradient" />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
