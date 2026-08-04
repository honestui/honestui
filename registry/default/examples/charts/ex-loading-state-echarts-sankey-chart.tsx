"use client";

import {
  SankeyChart,
  type SankeyData,
  type ChartConfig,
} from "@/registry/default/charts/sankey-chart";

// Scenario: Food distribution
const data: SankeyData = {
  nodes: [
    { name: "BlogPosts" },
    { name: "Videos" },
    { name: "Podcasts" },
    { name: "Twitter" },
    { name: "LinkedIn" },
    { name: "YouTube" },
    { name: "Newsletter" },
  ],
  links: [
    { source: 0, target: 3, value: 24000 },
    { source: 0, target: 4, value: 17000 },
    { source: 0, target: 6, value: 30000 },
    { source: 1, target: 5, value: 56000 },
    { source: 1, target: 3, value: 8400 },
    { source: 2, target: 5, value: 19600 },
    { source: 2, target: 4, value: 7200 },
  ],
};

const chartConfig = {
  BlogPosts: {
    label: "Produce",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  Videos: {
    label: "Dairy",
    colors: {
      light: ["#ef4444"],
      dark: ["#f87171"],
    },
  },
  Podcasts: {
    label: "Bakery",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  Twitter: {
    label: "Food banks",
    colors: {
      light: ["#0ea5e9"],
      dark: ["#38bdf8"],
    },
  },
  LinkedIn: {
    label: "Schools",
    colors: {
      light: ["#0077b5"],
      dark: ["#0a95d9"],
    },
  },
  YouTube: {
    label: "Markets",
    colors: {
      light: ["#dc2626"],
      dark: ["#ef4444"],
    },
  },
  Newsletter: {
    label: "Shelters",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function ExampleSankeyChart() {
  return (
    <SankeyChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      isLoading // [!code highlight]
    >
      <SankeyChart.Node />
      <SankeyChart.Link variant="source" />
      <SankeyChart.Tooltip />
    </SankeyChart>
  );
}
