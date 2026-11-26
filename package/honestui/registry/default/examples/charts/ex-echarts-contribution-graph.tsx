"use client";

import { ContributionGraph, type ChartConfig } from "@/registry/default/charts/contribution-graph";

// Scenario: A year of commits
const start = Date.UTC(2025, 0, 1);
const data = Array.from({ length: 365 }, (_, day) => {
  const date = new Date(start + day * 86_400_000);
  const weekday = date.getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;
  // Deterministic noise: a busy spring, a quiet August, lighter weekends.
  const noise = Math.abs(Math.sin(day * 12.9898) * 43758.5453) % 1;
  const season = 1 + Math.sin((day / 365) * Math.PI * 2 + 0.6) * 0.6;
  const holiday = day > 212 && day < 236 ? 0.15 : 1;
  const commits = noise < (isWeekend ? 0.7 : 0.18) ? 0 : Math.round(noise * 9 * season * holiday * (isWeekend ? 0.4 : 1));
  return { date: date.toISOString().slice(0, 10), commits };
});

const chartConfig = {
  commits: {
    label: "Commits",
    colors: {
      light: ["#16a34a"],
      dark: ["#22c55e"],
    },
  },
} satisfies ChartConfig;

export function ExampleContributionGraph() {
  return (
    <ContributionGraph
      data={data}
      config={chartConfig}
      dateKey="date"
      valueKey="commits"
      range={2025}
      className="h-full w-full p-4"
    >
      <ContributionGraph.Months />
      <ContributionGraph.Weekdays />
      <ContributionGraph.Legend />
      <ContributionGraph.Tooltip valueFormatter={(value) => `${value} ${value === 1 ? "commit" : "commits"}`} />
      <ContributionGraph.Cells />
    </ContributionGraph>
  );
}
