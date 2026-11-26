"use client";

import { Tracker, type ChartConfig } from "@/registry/default/charts/tracker";

// Scenario: A status page with one row per service, the last 30 days
const chartConfig = {
  operational: { label: "Operational", colors: { light: ["#10b981"], dark: ["#10b981"] } },
  degraded: { label: "Degraded", colors: { light: ["#f59e0b"], dark: ["#f59e0b"] } },
  outage: { label: "Outage", colors: { light: ["#ef4444"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

function history(issues: Record<number, "degraded" | "outage">, missingBefore = 0) {
  return Array.from({ length: 30 }, (_, index) => ({
    day: `Day ${index + 1}`,
    // Days before a service launched have no status and render as no data.
    status: index < missingBefore ? null : (issues[index] ?? "operational"),
  }));
}

const services = [
  { name: "Dashboard", data: history({ 12: "degraded" }) },
  { name: "API", data: history({ 4: "degraded", 21: "outage", 22: "degraded" }) },
  { name: "Webhooks", data: history({}) },
  { name: "Edge storage", data: history({ 27: "degraded" }, 9) },
];

export function ExampleTrackerServices() {
  return (
    <div className="grid w-full max-w-xl gap-4 text-xs">
      {services.map((service) => (
        <div key={service.name} className="grid grid-cols-[6.5rem_1fr] items-center gap-4">
          <span className="text-foreground truncate font-medium">{service.name}</span>
          <Tracker
            data={service.data}
            config={chartConfig}
            statusKey="status"
            labelKey="day"
            height={24}
            gap={3}
            emptyLabel="Not launched"
            ariaLabel={`${service.name} status, last 30 days`}
          />
        </div>
      ))}
    </div>
  );
}
