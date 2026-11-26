"use client";

import { Sparkline, type ChartConfig } from "@/registry/default/charts/sparkline";

// Scenario: Watchlist with a 30-day trend per row
function series(start: number, drift: number, swing: number) {
  return Array.from({ length: 30 }, (_, day) => ({
    day: `Day ${day + 1}`,
    price: Number((start + drift * day + Math.sin(day * 0.9 + start) * swing).toFixed(2)),
  }));
}

const trendConfig = {
  up: { label: "Price", colors: { light: ["#059669"], dark: ["#34d399"] } },
  down: { label: "Price", colors: { light: ["#dc2626"], dark: ["#f87171"] } },
} satisfies ChartConfig;

const rows = [
  { ticker: "ACME", name: "Acme Corp", data: series(124, 0.42, 2.4) },
  { ticker: "GLBX", name: "Globex", data: series(88, -0.36, 1.8) },
  { ticker: "INIT", name: "Initech", data: series(46, 0.12, 1.1) },
  { ticker: "UMBR", name: "Umbrella", data: series(212, -0.6, 3.6) },
].map((row) => {
  const first = row.data[0].price;
  const last = row.data[row.data.length - 1].price;
  const change = ((last - first) / first) * 100;
  // Each row's config points the one data key at a rising or falling color.
  const config: ChartConfig = { price: change >= 0 ? trendConfig.up : trendConfig.down };
  return { ...row, last, change, config };
});

export function ExampleSparklineTable() {
  return (
    <table className="w-full max-w-lg text-xs">
      <thead>
        <tr className="text-muted-foreground border-b text-left">
          <th className="pb-2 font-medium">Ticker</th>
          <th className="pb-2 font-medium">30 days</th>
          <th className="pb-2 text-right font-medium">Price</th>
          <th className="pb-2 text-right font-medium">Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ticker} className="border-b last:border-0">
            <td className="py-2.5">
              <div className="text-foreground font-mono font-medium">{row.ticker}</div>
              <div className="text-muted-foreground">{row.name}</div>
            </td>
            <td className="py-2.5">
              <Sparkline
                data={row.data}
                config={row.config}
                dataKey="price"
                xDataKey="day"
                className="h-8 w-32"
                ariaLabel={`${row.ticker} price over 30 days`}
              >
                <Sparkline.ReferenceLine y="first" />
                <Sparkline.Tooltip valueFormatter={(value) => `$${value.toFixed(2)}`} />
              </Sparkline>
            </td>
            <td className="text-foreground py-2.5 text-right font-mono tabular-nums">
              ${row.last.toFixed(2)}
            </td>
            <td
              className={`py-2.5 text-right font-mono tabular-nums ${
                row.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {row.change >= 0 ? "+" : ""}
              {row.change.toFixed(1)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
