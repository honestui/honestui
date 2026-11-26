"use client";

import { Sparkline, type ChartConfig } from "@/registry/default/charts/sparkline";

const chartConfig = {
  sessions: {
    label: "Sessions",
    colors: {
      light: ["#2563eb"],
      dark: ["#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function ExampleSparklineLoading() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Sparkline
        data={[]}
        config={chartConfig}
        dataKey="sessions"
        variant="area"
        isLoading
        className="h-12 w-full"
      />
      <Sparkline
        data={[]}
        config={chartConfig}
        dataKey="sessions"
        variant="bar"
        isLoading
        className="h-12 w-full"
      />
    </div>
  );
}
