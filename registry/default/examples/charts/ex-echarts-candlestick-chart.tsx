"use client";

import { CandlestickChart, type ChartConfig } from "@/registry/default/charts/candlestick-chart";

// Scenario: A share price over 40 trading days
const data = (() => {
  const rows: { date: string; open: number; close: number; high: number; low: number; volume?: number }[] = [];
  let close = 182.4;
  const day = new Date(Date.UTC(2026, 8, 1));
  while (rows.length < 40) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const i = rows.length;
      const open = Math.round((close + Math.sin(i * 2.3) * 0.9) * 100) / 100;
      close = Math.round((open + Math.sin(i * 0.55) * 2.6 + Math.cos(i * 1.7) * 1.4 + 0.18) * 100) / 100;
      rows.push({
        date: day.toISOString().slice(0, 10),
        open,
        close,
        high: Math.round((Math.max(open, close) + 0.6 + Math.abs(Math.sin(i * 3.1)) * 1.8) * 100) / 100,
        low: Math.round((Math.min(open, close) - 0.6 - Math.abs(Math.cos(i * 2.7)) * 1.8) * 100) / 100,
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

export function ExampleCandlestickChart() {
  return (
    <CandlestickChart data={data} config={chartConfig} xDataKey="date" className="h-full w-full p-4">
      <CandlestickChart.Grid />
      <CandlestickChart.XAxis tickFormatter={shortDate} />
      <CandlestickChart.YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
      <CandlestickChart.Tooltip valueFormatter={(value) => `$${value.toFixed(2)}`} />
      <CandlestickChart.Candles />
    </CandlestickChart>
  );
}
