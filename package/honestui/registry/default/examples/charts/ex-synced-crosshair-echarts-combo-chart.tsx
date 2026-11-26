"use client";

import { CandlestickChart } from "@/registry/default/charts/candlestick-chart";
import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: A share price and its trading activity on the same days
const data = (() => {
  const rows: {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    trades: number;
    average: number;
  }[] = [];
  let close = 182.4;
  const day = new Date(Date.UTC(2026, 8, 1));
  while (rows.length < 24) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const i = rows.length;
      const open = Math.round((close + Math.sin(i * 2.3) * 0.9) * 100) / 100;
      close = Math.round((open + Math.sin(i * 0.55) * 2.6 + Math.cos(i * 1.7) * 1.4) * 100) / 100;
      const trades = Math.round(4200 + Math.abs(close - open) * 1600 + Math.abs(Math.sin(i * 0.9)) * 1800);
      rows.push({
        date: day.toISOString().slice(0, 10),
        open,
        close,
        high: Math.round((Math.max(open, close) + 0.6 + Math.abs(Math.sin(i * 3.1)) * 1.8) * 100) / 100,
        low: Math.round((Math.min(open, close) - 0.6 - Math.abs(Math.cos(i * 2.7)) * 1.8) * 100) / 100,
        trades,
        average: 0,
      });
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  rows.forEach((row, i) => {
    const window = rows.slice(Math.max(0, i - 4), i + 1);
    row.average = Math.round(window.reduce((sum, r) => sum + r.trades, 0) / window.length);
  });
  return rows;
})();

const priceConfig = {
  up: { label: "Up", colors: { light: ["#16a34a"], dark: ["#22c55e"] } },
  down: { label: "Down", colors: { light: ["#dc2626"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

const activityConfig = {
  trades: { label: "Trades", colors: { light: ["#94a3b8"], dark: ["#475569"] } },
  average: { label: "5-day average", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
} satisfies ChartConfig;

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleSyncedCrosshairComboChart() {
  return (
    <div className="grid h-full w-full grid-rows-[3fr_2fr] gap-2 p-4">
      <CandlestickChart data={data} config={priceConfig} xDataKey="date" syncId="share-day" className="min-h-0"> {/* [!code highlight] */}
        <CandlestickChart.Grid />
        <CandlestickChart.YAxis position="left" tickFormatter={(value) => `$${value.toFixed(0)}`} />
        <CandlestickChart.Tooltip crosshair={false} labelFormatter={shortDate} valueFormatter={(value) => `$${value.toFixed(2)}`} />
        <CandlestickChart.Candles />
      </CandlestickChart>
      <ComboChart data={data} config={activityConfig} xDataKey="date" syncId="share-day" className="min-h-0"> {/* [!code highlight] */}
        <ComboChart.Grid />
        <ComboChart.XAxis tickFormatter={shortDate} />
        <ComboChart.YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
        <ComboChart.Tooltip labelFormatter={shortDate} />
        <ComboChart.Bar dataKey="trades" />
        <ComboChart.Line dataKey="average" />
      </ComboChart>
    </div>
  );
}
