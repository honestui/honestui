"use client";

import { RadialChart, type ChartConfig } from "@/registry/default/charts/radial-chart";

// Scenario: Storage used, split by kind of file
const data = [{ plan: "storage", photos: 128, documents: 46, backups: 72 }];

const chartConfig = {
  photos: { label: "Photos", colors: { light: ["#3b82f6"], dark: ["#60a5fa"] } },
  documents: { label: "Documents", colors: { light: ["#10b981"], dark: ["#34d399"] } },
  backups: { label: "Backups", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
} satisfies ChartConfig;

export function ExampleRadialChart() {
  return (
    <RadialChart
      className="h-full w-full p-4"
      data={data}
      nameKey="plan"
      config={chartConfig}
      max={512}
      startAngle={180} // [!code highlight]
      endAngle={0} // [!code highlight]
      innerRadius="78%"
    >
      <RadialChart.Bar dataKey="photos" stackId="used" cornerRadius={6} />
      <RadialChart.Bar dataKey="documents" stackId="used" cornerRadius={6} />
      <RadialChart.Bar dataKey="backups" stackId="used" cornerRadius={6} />
      <RadialChart.Center label="GB of 512 used" />
      <RadialChart.Legend isClickable />
      <RadialChart.Tooltip valueFormatter={(value) => `${value} GB`} />
    </RadialChart>
  );
}
