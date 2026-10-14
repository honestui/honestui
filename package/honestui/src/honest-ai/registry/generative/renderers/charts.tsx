"use client";
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  type ChartConfig,
} from "honestui/charts";
import { useIsQueryLoading } from "../runtime/react";
import { array, nodeProps, record, text, type Props } from "./shared";
import { SpecializedChart } from "./specialized-chart";
const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
export function GeneratedChart({
  name,
  props,
}: {
  name: string;
  props: Props;
}) {
  const loading = useIsQueryLoading();
  const labels = array(props.labels).map(text);
  const series = array(props.series).map(nodeProps);
  const config: ChartConfig = {};
  series.forEach((item, i) => {
    config[`series${i}`] = {
      label: text(item.category),
      colors: { light: [colors[i % colors.length]] },
    };
  });
  const data = labels.map((label, i) =>
    Object.fromEntries([
      ["label", label],
      ...series.map((item, j) => [`series${j}`, array(item.values)[i] ?? null]),
    ]),
  );
  const common = {
    data,
    config,
    xDataKey: "label",
    className: "h-64 w-full",
    isLoading: loading,
    animation: false,
    ariaLabel: [name, text(props.xLabel), text(props.yLabel)]
      .filter(Boolean)
      .join(" — "),
  };
  // No categories yet (a reply mid-stream, or a calculator range that is empty
  // while its inputs are incomplete): an empty plot frame says nothing.
  if (name !== "ScatterChart" && labels.length === 0 && !loading) return null;
  if (name === "RadarChart" || name === "RadialChart")
    return <SpecializedChart name={name} props={props} />;
  if (name === "PieChart") {
    const pieData = labels.map((label, i) => ({
      label,
      value: Number(array(props.values)[i] ?? 0),
    }));
    labels.forEach((label, i) => {
      config[label] = { label, colors: { light: [colors[i % colors.length]] } };
    });
    return (
      <PieChart {...common} data={pieData} dataKey="value" nameKey="label">
        <PieChart.Pie
          innerRadius={props.variant === "donut" ? "55%" : 0}
          startAngle={props.appearance === "semiCircular" ? 180 : 90}
          endAngle={props.appearance === "semiCircular" ? 0 : -270}
        />
        <PieChart.Legend />
        <PieChart.Tooltip />
      </PieChart>
    );
  }
  if (name === "ScatterChart") {
    const datasets = array(props.datasets).map(nodeProps);
    datasets.forEach((item, i) => {
      config[`series${i}`] = {
        label: text(item.name),
        colors: { light: [colors[i % colors.length]] },
      };
    });
    const points: Record<string, unknown>[] = datasets.flatMap((item, i) =>
      array(item.points).map((point) => ({
        ...record(point),
        group: `series${i}`,
      })),
    );
    return (
      <ScatterChart
        {...common}
        data={points}
        xDataKey="x"
        yDataKey="y"
        groupDataKey="group"
      >
        <ScatterChart.Scatter dataKey="group" />
        <ScatterChart.Legend />
        <ScatterChart.Tooltip />
      </ScatterChart>
    );
  }
  if (name === "LineChart")
    return (
      <LineChart {...common}>
        {series.map((_, i) => (
          <LineChart.Line key={i} dataKey={`series${i}`} />
        ))}
        <LineChart.XAxis dataKey="label" />
        <LineChart.YAxis />
        <LineChart.Legend />
        <LineChart.Tooltip />
      </LineChart>
    );
  if (name === "AreaChart")
    return (
      <AreaChart
        {...common}
        stackType={props.variant === "stacked" ? "stacked" : "default"}
      >
        {series.map((_, i) => (
          <AreaChart.Area key={i} dataKey={`series${i}`} />
        ))}
        <AreaChart.XAxis dataKey="label" />
        <AreaChart.YAxis />
        <AreaChart.Legend />
        <AreaChart.Tooltip />
      </AreaChart>
    );
  if (name === "SingleStackedBarChart") {
    const row: Record<string, unknown> = { label: "Total" };
    labels.forEach((label, i) => {
      row[`series${i}`] = array(props.values)[i];
      config[`series${i}`] = {
        label,
        colors: { light: [colors[i % colors.length]] },
      };
    });
    return (
      <BarChart
        {...common}
        data={[row]}
        layout="horizontal"
        stackType="stacked"
      >
        {labels.map((_, i) => (
          <BarChart.Bar key={i} dataKey={`series${i}`} />
        ))}
        <BarChart.Legend />
        <BarChart.Tooltip />
      </BarChart>
    );
  }
  return (
    <BarChart
      {...common}
      layout={name === "HorizontalBarChart" ? "horizontal" : "vertical"}
      stackType={props.variant === "stacked" ? "stacked" : "default"}
    >
      {series.map((_, i) => (
        <BarChart.Bar key={i} dataKey={`series${i}`} />
      ))}
      <BarChart.XAxis dataKey="label" />
      <BarChart.YAxis />
      <BarChart.Legend />
      <BarChart.Tooltip />
    </BarChart>
  );
}
