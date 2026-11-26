"use client";

import { ComboChart, type ChartConfig } from "@/registry/default/charts/combo-chart";

// Scenario: Daily rainfall and average temperature over six weeks
const data = Array.from({ length: 42 }, (_, index) => {
  const day = new Date(Date.UTC(2026, 3, 1 + index));
  const rain = Math.sin(index * 0.9) * 6 + Math.cos(index * 0.37) * 5 + 4;
  return {
    date: day.toISOString().slice(0, 10),
    rainfall: Math.max(0, Math.round(rain * 10) / 10),
    temperature: Math.round((14 + index * 0.18 + Math.sin(index * 0.45) * 2.4) * 10) / 10,
  };
});

const chartConfig = {
  rainfall: { label: "Rainfall", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  temperature: { label: "Avg. temperature", colors: { light: ["#dc2626"], dark: ["#f87171"] } },
} satisfies ChartConfig;

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ExampleBrushComboChart() {
  return (
    <ComboChart data={data} config={chartConfig} xDataKey="date" className="h-full w-full p-4">
      <ComboChart.Grid />
      <ComboChart.XAxis tickFormatter={shortDate} />
      <ComboChart.YAxis yAxisId="left" tickFormatter={(value) => `${value} mm`} />
      <ComboChart.YAxis yAxisId="right" tickFormatter={(value) => `${value}°`} />
      <ComboChart.Brush formatLabel={shortDate} />
      <ComboChart.Legend />
      <ComboChart.Tooltip
        labelFormatter={shortDate}
        valueFormatter={(value, key) => (key === "rainfall" ? `${value} mm` : `${value} °C`)}
      />
      <ComboChart.Bar dataKey="rainfall" variant="gradient" />
      <ComboChart.Line dataKey="temperature" yAxisId="right" />
    </ComboChart>
  );
}
