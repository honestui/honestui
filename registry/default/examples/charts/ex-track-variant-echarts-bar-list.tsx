"use client";

import { BarList, type ChartConfig } from "@/registry/default/charts/bar-list";
import { Laptop, Monitor, Smartphone, Tablet } from "honestui/icons";

// Scenario: Sessions by device, each row with its own color and icon
const data = [
  { device: "desktop", sessions: 0.512 },
  { device: "mobile", sessions: 0.384 },
  { device: "laptop", sessions: 0.071 },
  { device: "tablet", sessions: 0.033 },
];

const chartConfig = {
  sessions: { label: "Sessions" },
  desktop: {
    label: "Desktop",
    icon: Monitor,
    colors: { light: ["#2563eb"], dark: ["#3b82f6"] },
  },
  mobile: {
    label: "Mobile",
    icon: Smartphone,
    colors: { light: ["#059669"], dark: ["#10b981"] },
  },
  laptop: {
    label: "Laptop",
    icon: Laptop,
    colors: { light: ["#d97706"], dark: ["#f59e0b"] },
  },
  tablet: {
    label: "Tablet",
    icon: Tablet,
    colors: { light: ["#7c3aed"], dark: ["#8b5cf6"] },
  },
} satisfies ChartConfig;

export function ExampleBarListTrack() {
  return (
    <BarList
      data={data}
      config={chartConfig}
      nameKey="device"
      valueKey="sessions"
      variant="track"
      max={1}
      valueFormatter={(value) => `${(value * 100).toFixed(1)}%`}
      className="w-full max-w-sm"
    />
  );
}
