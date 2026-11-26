"use client";

import { ContributionGraph, type ChartConfig } from "@/registry/default/charts/contribution-graph";

// Scenario: Daily running distance over six months, weeks starting Monday
const start = Date.UTC(2025, 3, 1);
const data = Array.from({ length: 183 }, (_, day) => {
  const weekday = new Date(start + day * 86_400_000).getUTCDay();
  const noise = Math.abs(Math.sin(day * 78.233) * 12345.6789) % 1;
  // Long runs on Sundays, rest days on Mondays, easy runs otherwise.
  const km = weekday === 1 ? 0 : weekday === 0 ? 14 + Math.round(noise * 10) : noise < 0.3 ? 0 : 4 + Math.round(noise * 6);
  return { day: new Date(start + day * 86_400_000).toISOString().slice(0, 10), km };
});

const chartConfig = {
  km: {
    label: "Distance",
    colors: {
      light: ["#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
      dark: ["#7c2d12", "#c2410c", "#f97316", "#fdba74"],
    },
  },
} satisfies ChartConfig;

export function ExampleContributionGraph() {
  return (
    <ContributionGraph
      data={data}
      config={chartConfig}
      dateKey="day"
      valueKey="km"
      range={["2025-04-01", "2025-09-30"]}
      weekStart={1}
      className="h-full w-full p-4"
    >
      <ContributionGraph.Months />
      <ContributionGraph.Weekdays show="all" />
      <ContributionGraph.Legend lessLabel="Rest" moreLabel="Long run" />
      <ContributionGraph.Tooltip valueFormatter={(value) => `${value} km`} />
      <ContributionGraph.Cells thresholds={[1, 6, 9, 14]} maxSize={18} radius={3} />
    </ContributionGraph>
  );
}
