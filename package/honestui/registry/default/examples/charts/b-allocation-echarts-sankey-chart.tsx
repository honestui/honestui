"use client";

import { SankeyChart, type ChartConfig } from "@/registry/default/charts/sankey-chart";
import { cn } from "@/lib/utils";

// Scenario: City budget allocation
const chartData = {
  nodes: [
    { name: "Revenue" },
    { name: "Transit" },
    { name: "Housing" },
    { name: "Parks" },
    { name: "CapitalProjects" },
    { name: "CommunityServices" },
    { name: "EmergencyFund" },
  ],
  links: [
    { source: 0, target: 1, value: 87 },
    { source: 0, target: 2, value: 51 },
    { source: 0, target: 3, value: 27 },
    { source: 1, target: 4, value: 58 },
    { source: 1, target: 5, value: 29 },
    { source: 2, target: 5, value: 21 },
    { source: 2, target: 6, value: 30 },
    { source: 3, target: 4, value: 10 },
    { source: 3, target: 6, value: 17 },
  ],
};

const chartConfig = {
  Revenue: { label: "Revenue", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
  Transit: { label: "Transit", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  Housing: { label: "Housing", colors: { light: ["#ea580c"], dark: ["#fb923c"] } },
  Parks: { label: "Parks", colors: { light: ["#b45309"], dark: ["#f59e0b"] } },
  CapitalProjects: { label: "Capital projects", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
  CommunityServices: { label: "Community services", colors: { light: ["#6d28d9"], dark: ["#8b5cf6"] } },
  EmergencyFund: { label: "Emergency fund", colors: { light: ["#4f46e5"], dark: ["#818cf8"] } },
} satisfies ChartConfig;

const STATS = [
  { key: "positions", label: "Funded programs", value: "146" },
  { key: "aum", label: "Annual budget", value: "$82.6M" },
  { key: "hedged", label: "Contingency funded", value: "94%" },
];

export function AllocationSankeyChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
          Where the city budget goes
        </span>
        <span className="text-muted-foreground text-xs">Approved plan</span>
      </div>

      <div className="mt-2 min-h-0 w-full flex-1">
        <SankeyChart
          data={chartData}
          config={chartConfig}
          className="h-full w-full"
          nodeWidth={92}
          nodePadding={12}
          linkCurvature={0.55}
        >
          <SankeyChart.Tooltip variant="frosted-glass" />
          <SankeyChart.Link variant="gradient" />
          <SankeyChart.Node radius={6}>
            <SankeyChart.NodeLabel
              position="inside"
              showValues
              valueFormatter={(value) => `$${(value * 1000).toLocaleString("en-US")}`}
            />
          </SankeyChart.Node>
        </SankeyChart>
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-3 gap-4">
        {STATS.map(({ key, label, value }, i) => (
          <div
            key={key}
            className={cn(
              "flex flex-col gap-0.5",
              i === 1 && "items-center text-center",
              i === STATS.length - 1 && "items-end text-right",
            )}
          >
            <span className="text-muted-foreground truncate text-[10px] tracking-wide uppercase sm:text-[11px]">
              {label}
            </span>
            <span className="text-primary text-lg font-semibold tracking-tight sm:text-2xl">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
