"use client";

import { Sparkline, type ChartConfig } from "@/registry/default/charts/sparkline";

// Scenario: p95 latency against its average
const latency = [182, 176, 190, 214, 168, 172, 251, 198, 186, 164, 171, 179, 206, 188, 175, 169];
const data = latency.map((ms, index) => ({ hour: `${String(index + 6).padStart(2, "0")}:00`, ms }));

const chartConfig = {
  ms: {
    label: "p95 latency",
    colors: {
      light: ["#ea580c"],
      dark: ["#fb923c"],
    },
  },
} satisfies ChartConfig;

export function ExampleSparklineReference() {
  return (
    <div className="grid w-full max-w-sm gap-2 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-foreground font-medium">p95 latency · today</span>
        <span className="text-muted-foreground">Dashed line is the average</span>
      </div>
      <Sparkline data={data} config={chartConfig} dataKey="ms" xDataKey="hour" className="h-16 w-full">
        <Sparkline.ReferenceLine y="average" />
        <Sparkline.Dot points="last-and-extremes" variant="colored-border" />
        <Sparkline.Tooltip valueFormatter={(value) => `${value} ms`} />
      </Sparkline>
      <div className="text-muted-foreground flex justify-between font-mono tabular-nums">
        <span>Low 164 ms</span>
        <span>High 251 ms</span>
      </div>
    </div>
  );
}
