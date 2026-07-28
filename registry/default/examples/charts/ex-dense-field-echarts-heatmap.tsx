"use client";

import { Heatmap, type ChartConfig } from "@/registry/default/charts/heatmap";

const columns = 160;
const rows = 80;

const data = Array.from({ length: columns + 1 }, (_, x) =>
  Array.from({ length: rows + 1 }, (_, y) => {
    const wave =
      Math.sin(x / 13) * 0.2 +
      Math.cos(y / 9) * 0.14 +
      Math.sin((x + y) / 17) * 0.13 +
      Math.cos((x - y * 2) / 21) * 0.11;

    return {
      x,
      y,
      intensity: Math.max(0, Math.min(1, 0.5 + wave)),
    };
  }),
).flat();

const chartConfig = {
  intensity: {
    label: "Signal intensity",
    colors: {
      light: ["#1e3a8a", "#60a5fa", "#e2e8f0", "#fbbf24", "#b91c1c"],
      dark: ["#60a5fa", "#1e3a8a", "#334155", "#a16207", "#f87171"],
    },
  },
} satisfies ChartConfig;

export function DenseFieldHeatmap() {
  return (
    <Heatmap
      data={data}
      config={chartConfig}
      xDataKey="x"
      yDataKey="y"
      valueDataKey="intensity"
      min={0}
      max={1}
      animation={false}
      className="h-full w-full p-4"
      ariaLabel="Dense signal intensity field across 160 columns and 80 rows"
    >
      <Heatmap.XAxis />
      <Heatmap.YAxis />
      <Heatmap.Legend
        orient="vertical"
        align="left"
        minLabel="Low"
        maxLabel="High"
        calculable
        realtime={false}
      />
      <Heatmap.Cells gap={0} radius={0} progressive={1000} progressiveThreshold={3000} />
    </Heatmap>
  );
}
