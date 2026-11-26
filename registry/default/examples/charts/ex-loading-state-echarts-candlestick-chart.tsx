"use client";

import { CandlestickChart, type ChartConfig } from "@/registry/default/charts/candlestick-chart";

const chartConfig = {
  up: { label: "Up", colors: { light: ["#16a34a"], dark: ["#22c55e"] } },
  down: { label: "Down", colors: { light: ["#dc2626"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

export function ExampleLoadingCandlestickChart() {
  return (
    <CandlestickChart
      data={[]}
      config={chartConfig}
      xDataKey="date"
      isLoading
      className="h-full w-full p-4"
    >
      <CandlestickChart.Grid />
      <CandlestickChart.Volume />
      <CandlestickChart.Candles />
    </CandlestickChart>
  );
}
