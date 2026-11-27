"use client";

import { ScatterChart, type ChartConfig } from "@/registry/default/charts/scatter-chart";

// Scenario: Price and average rating for a store's headphones (sample data).
// Products with few reviews have shakier averages, so they are ringed.
const data = [
  { product: "Arc Studio", price: 349, rating: 4.6, reviews: 1284 },
  { product: "Arc Lite", price: 199, rating: 4.3, reviews: 864 },
  { product: "Pulse One", price: 129, rating: 4.1, reviews: 2213 },
  { product: "Pulse Mini", price: 79, rating: 3.9, reviews: 1540 },
  { product: "Halo Pro", price: 279, rating: 4.4, reviews: 412 },
  { product: "Halo Go", price: 149, rating: 4.0, reviews: 655 },
  { product: "Drift ANC", price: 229, rating: 4.9, reviews: 11 },
  { product: "Drift Sport", price: 99, rating: 3.2, reviews: 9 },
  { product: "Nova Wired", price: 59, rating: 3.8, reviews: 978 },
  { product: "Nova Buds", price: 119, rating: 4.2, reviews: 1103 },
  { product: "Echo Max", price: 399, rating: 4.7, reviews: 24 },
  { product: "Echo Air", price: 169, rating: 4.1, reviews: 317 },
];

const chartConfig = {
  price: { label: "Price" },
  rating: { label: "Average rating" },
  headphones: {
    label: "Headphones",
    colors: { light: ["#4f46e5"], dark: ["#818cf8"] },
  },
} satisfies ChartConfig;

export function ExampleScatterChart() {
  return (
    <ScatterChart
      data={data}
      config={chartConfig}
      xDataKey="price"
      yDataKey="rating"
      pointNameDataKey="product"
      sampleSizeKey="reviews"
      minSampleSize={30}
      className="h-full w-full p-4"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis hideDots tickFormatter={(value) => `$${value}`} />
      <ScatterChart.YAxis hideDots tickFormatter={(value) => value.toFixed(1)} />
      <ScatterChart.Tooltip xValueFormatter={(value) => `$${value}`} />
      <ScatterChart.Scatter dataKey="headphones" />
    </ScatterChart>
  );
}
