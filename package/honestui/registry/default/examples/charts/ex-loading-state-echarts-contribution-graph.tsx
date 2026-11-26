"use client";

import { ContributionGraph, type ChartConfig } from "@/registry/default/charts/contribution-graph";

const chartConfig = {
  commits: { label: "Commits", colors: { light: ["#16a34a"], dark: ["#22c55e"] } },
} satisfies ChartConfig;

export function LoadingContributionGraph() {
  return (
    <ContributionGraph
      data={[]}
      config={chartConfig}
      dateKey="date"
      valueKey="commits"
      range={2025}
      isLoading
      className="h-full w-full p-4"
    >
      <ContributionGraph.Months />
      <ContributionGraph.Weekdays />
      <ContributionGraph.Legend />
      <ContributionGraph.Cells />
    </ContributionGraph>
  );
}
