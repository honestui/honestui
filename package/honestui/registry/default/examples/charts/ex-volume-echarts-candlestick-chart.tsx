"use client";

import { CandlestickChart, type ChartConfig } from "@/registry/default/charts/candlestick-chart";

// Scenario: Six months of daily prices and trading volume, zoomable with the brush
const data = (() => {
  const rows: { date: string; open: number; close: number; high: number; low: number; volume?: number }[] = [];
  let close = 64.2;
  const day = new Date(Date.UTC(2026, 3, 1));
  while (rows.length < 126) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const i = rows.length;
      const open = Math.round((close + Math.sin(i * 1.9) * 0.4) * 100) / 100;
      const drift = Math.sin(i * 0.08) * 0.35 + Math.sin(i * 0.61) * 0.9 + Math.cos(i * 1.37) * 0.6;
      close = Math.round((open + drift) * 100) / 100;
      const move = Math.abs(close - open);
      rows.push({
        date: day.toISOString().slice(0, 10),
        open,
        close,
        high: Math.round((Math.max(open, close) + 0.2 + Math.abs(Math.sin(i * 2.9)) * 0.8) * 100) / 100,
        low: Math.round((Math.min(open, close) - 0.2 - Math.abs(Math.cos(i * 2.3)) * 0.8) * 100) / 100,
        volume: Math.round(1_800_000 + move * 1_400_000 + Math.abs(Math.sin(i * 0.7)) * 900_000),
      });
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return rows;
})();

const chartConfig = {
  up: { label: "Up", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
  down: { label: "Down", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
} satisfies ChartConfig;

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleVolumeCandlestickChart() {
  return (
    <CandlestickChart
      data={data}
      config={chartConfig}
      xDataKey="date"
      volumeDataKey="volume"
      className="h-full w-full p-4"
    >
      <CandlestickChart.Grid />
      <CandlestickChart.XAxis tickFormatter={shortDate} />
      <CandlestickChart.YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
      <CandlestickChart.Brush formatLabel={shortDate} />
      <CandlestickChart.Tooltip valueFormatter={(value) => `$${value.toFixed(2)}`} />
      <CandlestickChart.Volume height={0.22} />
      <CandlestickChart.Candles variant="hollow" />
    </CandlestickChart>
  );
}
