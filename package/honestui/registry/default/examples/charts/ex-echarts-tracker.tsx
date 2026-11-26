"use client";

import { Tracker, type ChartConfig } from "@/registry/default/charts/tracker";

// Scenario: 90 days of API uptime
const incidents: Record<number, { status: string; uptime: number; note: string }> = {
  17: { status: "degraded", uptime: 99.2, note: "Elevated latency in us-east" },
  18: { status: "degraded", uptime: 99.6, note: "Elevated latency in us-east" },
  41: { status: "outage", uptime: 97.1, note: "Database failover, 42 min" },
  63: { status: "degraded", uptime: 99.5, note: "Webhook delivery delays" },
  82: { status: "maintenance", uptime: 99.9, note: "Scheduled maintenance" },
};

const start = Date.UTC(2026, 7, 28);
const data = Array.from({ length: 90 }, (_, index) => {
  const date = new Date(start + index * 86_400_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const incident = incidents[index];
  return {
    date,
    status: incident?.status ?? "operational",
    uptime: incident?.uptime ?? 100,
    note: incident?.note ?? "",
  };
});

const chartConfig = {
  operational: { label: "Operational", colors: { light: ["#10b981"], dark: ["#10b981"] } },
  degraded: { label: "Degraded", colors: { light: ["#f59e0b"], dark: ["#f59e0b"] } },
  outage: { label: "Outage", colors: { light: ["#ef4444"], dark: ["#ef4444"] } },
  maintenance: { label: "Maintenance", colors: { light: ["#3b82f6"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

const average = data.reduce((sum, day) => sum + day.uptime, 0) / data.length;

export function ExampleTracker() {
  return (
    <div className="grid w-full max-w-xl gap-3 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-foreground font-medium">API · last 90 days</span>
        <span className="text-muted-foreground">
          <span className="text-foreground font-mono tabular-nums">{average.toFixed(2)}%</span> uptime
        </span>
      </div>
      <Tracker
        data={data}
        config={chartConfig}
        statusKey="status"
        labelKey="date"
        valueKey="uptime"
        valueFormatter={(value) => `${value.toFixed(1)}%`}
        detailFormatter={(day) => day.note || undefined}
        showLegend
      />
    </div>
  );
}
