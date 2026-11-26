"use client";

import { Sparkline, type ChartConfig } from "@/registry/default/charts/sparkline";

// Scenario: Daily signups, three ways
const data = [42, 48, 45, 53, 61, 58, 66, 63, 71, 69, 78, 74, 82, 88].map((signups, index) => ({
  day: `Day ${index + 1}`,
  signups,
}));

const chartConfig = {
  signups: {
    label: "Signups",
    colors: {
      light: ["#059669"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

const variants = ["line", "area", "bar"] as const;

export function ExampleSparklineVariants() {
  return (
    <div className="grid w-full max-w-md gap-3 text-xs">
      {variants.map((variant) => (
        <div
          key={variant}
          className="flex items-center justify-between gap-6 border-b pb-3 last:border-0 last:pb-0"
        >
          <span className="text-muted-foreground w-10 font-mono">{variant}</span>
          <Sparkline
            data={data}
            config={chartConfig}
            dataKey="signups"
            xDataKey="day"
            variant={variant}
            curve="smooth"
            className="h-9 flex-1"
          >
            <Sparkline.Tooltip />
          </Sparkline>
          <span className="text-foreground w-8 text-right font-mono font-medium tabular-nums">88</span>
        </div>
      ))}
    </div>
  );
}
