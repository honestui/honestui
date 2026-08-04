"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Film production workflow
const data: SankeyData = {
  nodes: [
    { name: "API" },
    { name: "Database" },
    { name: "Logs" },
    { name: "Ingestion" },
    { name: "Transform" },
    { name: "Analytics" },
    { name: "MLPipeline" },
    { name: "Dashboard" },
    { name: "Archive" },
  ],
  links: [
    { source: 0, target: 3, value: 170000 },
    { source: 1, target: 3, value: 124000 },
    { source: 2, target: 3, value: 86000 },
    { source: 3, target: 4, value: 380000 },
    { source: 4, target: 5, value: 190000 },
    { source: 4, target: 6, value: 110000 },
    { source: 4, target: 8, value: 80000 },
    { source: 5, target: 7, value: 144000 },
    { source: 5, target: 8, value: 46000 },
    { source: 6, target: 7, value: 76000 },
    { source: 6, target: 8, value: 34000 },
  ],
};

const chartConfig = {
  API: {
    label: "Script",
    colors: {
      light: ["#0ea5e9"],
      dark: ["#38bdf8"],
    },
  },
  Database: {
    label: "Cast",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  Logs: {
    label: "Locations",
    colors: {
      light: ["#d97706"],
      dark: ["#fbbf24"],
    },
  },
  Ingestion: {
    label: "Pre-production",
    colors: {
      light: ["#f97316"],
      dark: ["#fb923c"],
    },
  },
  Transform: {
    label: "Production",
    colors: {
      light: ["#eab308"],
      dark: ["#facc15"],
    },
  },
  Analytics: {
    label: "Editorial",
    colors: {
      light: ["#06b6d4"],
      dark: ["#22d3ee"],
    },
  },
  MLPipeline: {
    label: "Visual effects",
    colors: {
      light: ["#ec4899"],
      dark: ["#f472b6"],
    },
  },
  Dashboard: {
    label: "Final cut",
    colors: {
      light: ["#22c55e"],
      dark: ["#4ade80"],
    },
  },
  Archive: {
    label: "Vault",
    colors: {
      light: ["#be185d"],
      dark: ["#ec4899"],
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart className="h-full w-full p-4" data={data} config={chartConfig}>
      <SankeyChart.Node isClickable />
      <SankeyChart.Link
        variant="source" // [!code highlight]
      />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
