"use client";

import { BarChart, type ChartConfig } from "@/registry/default/charts/bar-chart";
import { LineChart } from "@/registry/default/charts/line-chart";

// Scenario: Store orders and average basket size on the same days
const data = [
  { day: "Mon", orders: 182, basket: 38.2 },
  { day: "Tue", orders: 164, basket: 36.9 },
  { day: "Wed", orders: 201, basket: 41.5 },
  { day: "Thu", orders: 216, basket: 40.1 },
  { day: "Fri", orders: 274, basket: 44.8 },
  { day: "Sat", orders: 312, basket: 52.6 },
  { day: "Sun", orders: 248, basket: 49.3 },
];

const ordersConfig = {
  orders: { label: "Orders", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
} satisfies ChartConfig;

const basketConfig = {
  basket: { label: "Avg. basket ($)", colors: { light: ["#c026d3"], dark: ["#e879f9"] } },
} satisfies ChartConfig;

export function ExampleSyncedCrosshairBarChart() {
  return (
    <div className="grid h-full w-full grid-rows-2 gap-2 p-4">
      <BarChart data={data} config={ordersConfig} xDataKey="day" syncId="store-week" className="min-h-0"> {/* [!code highlight] */}
        <BarChart.Grid />
        <BarChart.Tooltip />
        <BarChart.Bar dataKey="orders" />
      </BarChart>
      <LineChart data={data} config={basketConfig} xDataKey="day" syncId="store-week" className="min-h-0"> {/* [!code highlight] */}
        <LineChart.Grid />
        <LineChart.XAxis />
        <LineChart.Tooltip />
        <LineChart.Line dataKey="basket" />
      </LineChart>
    </div>
  );
}
