"use client";

import { Sparkline, type ChartConfig } from "@/registry/default/charts/sparkline";

// Scenario: Weekly revenue card
const data = [
  { week: "Week 1", revenue: 31.2 },
  { week: "Week 2", revenue: 33.8 },
  { week: "Week 3", revenue: 32.1 },
  { week: "Week 4", revenue: 35.6 },
  { week: "Week 5", revenue: 34.9 },
  { week: "Week 6", revenue: 38.4 },
  { week: "Week 7", revenue: 37.2 },
  { week: "Week 8", revenue: 40.9 },
  { week: "Week 9", revenue: 39.8 },
  { week: "Week 10", revenue: 43.5 },
  { week: "Week 11", revenue: 45.1 },
  { week: "Week 12", revenue: 48.2 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: {
      light: ["#2563eb"],
      dark: ["#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function ExampleSparkline() {
  return (
    <div className="bg-background flex w-full max-w-72 items-end justify-between gap-6 rounded-lg border p-4 text-xs">
      <div className="grid gap-1">
        <span className="text-muted-foreground">Revenue</span>
        <span className="text-foreground font-mono text-xl font-medium tabular-nums">$48.2k</span>
        <span className="text-muted-foreground">
          <span className="text-emerald-600 dark:text-emerald-400">+54%</span> in 12 weeks
        </span>
      </div>
      <Sparkline
        data={data}
        config={chartConfig}
        dataKey="revenue"
        xDataKey="week"
        variant="area"
        className="h-12 w-28"
      >
        <Sparkline.Dot points="last" />
        <Sparkline.Tooltip valueFormatter={(value) => `$${value.toFixed(1)}k`} />
      </Sparkline>
    </div>
  );
}
