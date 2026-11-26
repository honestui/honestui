"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Delivery orders by distance and minutes late, dense near the store
const data = Array.from({ length: 160 }, (_, i) => {
  const ring = (i % 16) / 16;
  const spoke = Math.floor(i / 16);
  const distance = Number((0.4 + ring * ring * 11 + Math.sin(i * 1.7) * 0.35).toFixed(2));
  const late = Number((distance * 1.6 + Math.sin(spoke * 2.3 + i) * 4 + Math.cos(i * 0.9) * 1.5).toFixed(1));
  return { order: `#${4100 + i}`, distance, late };
});

const chartConfig = {
  orders: {
    label: "Orders",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
} satisfies ChartConfig;

export function ExampleZoomScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="distance"
      yDataKey="late"
      pointNameDataKey="order"
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis label="Distance (km)" min={0} max={12} />
      <ScatterChart.YAxis label="Minutes late" min={-10} max={30} />
      <ScatterChart.Tooltip />
      <ScatterChart.Zoom /> {/* [!code highlight] */}
      <ScatterChart.Scatter dataKey="orders" symbolSize={7} />
    </ScatterChart>
  );
}
