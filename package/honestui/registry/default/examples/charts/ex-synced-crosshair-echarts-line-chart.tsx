"use client";

import { LineChart, type ChartConfig } from "@/registry/default/charts/line-chart";

// Scenario: Service health, one row per signal, read at the same minute
const minutes = ["09:00", "09:05", "09:10", "09:15", "09:20", "09:25", "09:30", "09:35", "09:40", "09:45", "09:50", "09:55"];
const requests = [1240, 1310, 1295, 1420, 1580, 1720, 1690, 1610, 1540, 1480, 1450, 1390];
const errors = [0.4, 0.5, 0.4, 0.6, 1.1, 2.3, 1.9, 1.2, 0.8, 0.6, 0.5, 0.4];

const traffic = minutes.map((minute, i) => ({ minute, requests: requests[i] }));
const errorRate = minutes.map((minute, i) => ({ minute, errors: errors[i] }));

const trafficConfig = {
  requests: { label: "Requests/min", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
} satisfies ChartConfig;

const errorConfig = {
  errors: { label: "Error rate %", colors: { light: ["#ea580c"], dark: ["#fb923c"] } },
} satisfies ChartConfig;

export function ExampleSyncedCrosshairLineChart() {
  return (
    <div className="grid h-full w-full grid-rows-2 gap-2 p-4">
      <LineChart data={traffic} config={trafficConfig} xDataKey="minute" syncId="service-health" className="min-h-0"> {/* [!code highlight] */}
        <LineChart.Grid />
        <LineChart.Tooltip />
        <LineChart.Line dataKey="requests" />
      </LineChart>
      <LineChart data={errorRate} config={errorConfig} xDataKey="minute" syncId="service-health" className="min-h-0"> {/* [!code highlight] */}
        <LineChart.Grid />
        <LineChart.XAxis />
        <LineChart.Tooltip />
        <LineChart.Line dataKey="errors" />
      </LineChart>
    </div>
  );
}
