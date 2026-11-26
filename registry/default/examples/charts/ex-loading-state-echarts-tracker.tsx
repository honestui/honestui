"use client";

import { Tracker, type ChartConfig } from "@/registry/default/charts/tracker";

const chartConfig = {
  operational: { label: "Operational", colors: { light: ["#10b981"], dark: ["#10b981"] } },
} satisfies ChartConfig;

export function ExampleTrackerLoading() {
  return (
    <Tracker
      data={[]}
      config={chartConfig}
      statusKey="status"
      labelKey="date"
      isLoading
      className="w-full max-w-xl"
    />
  );
}
