"use client";

import { CandlestickChart, type ChartConfig } from "@/registry/default/charts/candlestick-chart";

// Scenario: Six months of daily prices. Pinch, or Ctrl and scroll, to zoom; drag to pan.
const data = (() => {
  const rows: { date: string; open: number; close: number; high: number; low: number }[] = [];
  let close = 64.2;
  const day = new Date(Date.UTC(2026, 3, 1));
  while (rows.length < 126) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const i = rows.length;
      const open = Math.round((close + Math.sin(i * 1.9) * 0.4) * 100) / 100;
      const drift = Math.sin(i * 0.08) * 0.35 + Math.sin(i * 0.61) * 0.9 + Math.cos(i * 1.37) * 0.6;
      close = Math.round((open + drift) * 100) / 100;
      rows.push({
        date: day.toISOString().slice(0, 10),
        open,
        close,
        high: Math.round((Math.max(open, close) + 0.2 + Math.abs(Math.sin(i * 2.9)) * 0.8) * 100) / 100,
        low: Math.round((Math.min(open, close) - 0.2 - Math.abs(Math.cos(i * 2.3)) * 0.8) * 100) / 100,
      });
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return rows;
})();

const chartConfig = {
  up: { label: "Up", colors: { light: ["#16a34a"], dark: ["#22c55e"] } },
  down: { label: "Down", colors: { light: ["#dc2626"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleZoomCandlestickChart() {
  return (
    <CandlestickChart data={data} config={chartConfig} xDataKey="date" className="h-full w-full p-4">
      <CandlestickChart.Grid />
      <CandlestickChart.XAxis tickFormatter={shortDate} />
      <CandlestickChart.YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
      <CandlestickChart.Tooltip valueFormatter={(value) => `$${value.toFixed(2)}`} />
      <CandlestickChart.Zoom /> {/* [!code highlight] */}
      <CandlestickChart.ReferenceLine y={70} label="Resistance $70" /> {/* [!code highlight] */}
      <CandlestickChart.Candles />
    </CandlestickChart>
  );
}
