"use client";
import * as React from "react";
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  type ChartConfig,
} from "honestui/charts";
import { useIsQueryLoading, useIsStreaming } from "../runtime/react";
import { cn } from "../../../lib/utils.js";
import { BlockActions, chartPng } from "./block-actions";
import { ChartDataTable } from "./chart-data";
import { InsideCardContext, array, groupDigits, looksLikeYears, nodeProps, text, type Props } from "./shared";
import { SpecializedChart } from "./specialized-chart";
const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
/** The names of a chart's series ("DAU, MAU"), or empty. */
function seriesNames(props: Props) {
  return [...array(props.series), ...array(props.datasets)]
    .map(nodeProps)
    .map((item) => text(item.category ?? item.name).trim())
    .filter(Boolean);
}

/**
 * "Rolls by total", "Score by hours practised": axis labels are generic far
 * more often than they start with a proper noun. "GDP" and "New York" (a
 * capitalised second word) stay as written.
 */
function byLabel(x: string) {
  return /^[A-Z][a-z]/.test(x) && !/^\S+\s+[A-Z]/.test(x)
    ? x.charAt(0).toLowerCase() + x.slice(1)
    : x;
}

/**
 * What the chart measures, as one name for its caption, its accessible name
 * and its "View data": "Amount ($) by category" from the axis labels; else
 * its series ("Orders by month", "DAU, MAU"); else a pie's slices. Empty
 * only when the program names nothing at all.
 */
function chartName(props: Props) {
  const x = text(props.xLabel).trim();
  const y = text(props.yLabel).trim();
  const measure = y || seriesNames(props).join(", ");
  if (measure) return x ? `${measure} by ${byLabel(x)}` : measure;
  return x || array(props.labels).map(text).join(", ");
}

/**
 * The visible caption: the chart's name, except where it would only repeat
 * the legend (several series and no y label) or the slices of a pie.
 */
function chartCaption(props: Props) {
  if (text(props.yLabel).trim()) return chartName(props);
  return seriesNames(props).length === 1 ? chartName(props) : "";
}

/**
 * A chart in a reply, framed like the other generated blocks and captioned
 * with what it measures. Inside a Card the Card is the frame.
 */
export function GeneratedChart({ name, props }: { name: string; props: Props }) {
  const inCard = React.useContext(InsideCardContext);
  const loading = useIsQueryLoading();
  const streaming = useIsStreaming();
  const caption = chartCaption(props);
  const accessibleName = chartName(props);
  const { ref: measure, value: chartWidth } = useWidth();
  const plot = React.useRef<HTMLDivElement>(null);
  // No categories yet (a reply mid-stream, or a calculator range that is empty
  // while its inputs are incomplete): an empty plot frame says nothing.
  if (name !== "ScatterChart" && array(props.labels).length === 0 && !loading)
    return null;
  const categories = array(props.labels).length;
  // Upright bars drop category labels once they no longer fit beneath them.
  // On a narrow reply the bars lie down, so every category keeps its label.
  // Long labels (about 6.5px a character at 11px) drop out the same way when
  // they are wider than the slot each bar gets.
  const longest = Math.max(0, ...array(props.labels).map((label) => text(label).length));
  const slot = (chartWidth - 56) / Math.max(categories, 1);
  const sideways =
    name === "BarChart" &&
    chartWidth > 0 &&
    ((chartWidth < 32 * 16 && categories > 4) || longest * 6.5 + 12 > slot);
  const table = chartTable(name, props);
  const missingAxis = name === "ScatterChart" ? unlabeledAxes(props) : "";
  const plotName = sideways ? "HorizontalBarChart" : name;
  return (
    <figure
      ref={measure}
      data-slot="generated-chart"
      className={cn(
        "m-0 grid min-w-0 gap-3",
        !inCard &&
          "rounded-[var(--hui-radius-4)] border border-[var(--hui-color-border-base-primary)] p-4",
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        {caption ? (
          <figcaption className="m-0 min-w-0 text-sm font-medium text-[var(--hui-color-foreground-base-primary)]">
            {caption}
          </figcaption>
        ) : (
          <span />
        )}
        {/* A chart still arriving has no final data or image to copy yet. */}
        {!streaming && (
          <BlockActions
            label={accessibleName}
            rows={
              table
                ? () => {
                    const raw = chartTable(name, props, false)!;
                    return [raw.columns, ...raw.rows];
                  }
                : undefined
            }
            png={() => (plot.current ? chartPng(plot.current, accessibleName) : Promise.resolve(null))}
            expanded={
              <div className="h-[min(60vh,32rem)]">
                <ChartBody name={plotName} props={props} label={accessibleName} fill />
              </div>
            }
          />
        )}
      </div>
      {/* A scatter's points mean nothing without its axes; say what is missing. */}
      {missingAxis && <p className="m-0 text-xs text-muted-foreground">{missingAxis}</p>}
      <div ref={plot} style={sideways ? { height: categories * 36 + 48 } : undefined}>
        <ChartBody
          name={plotName}
          props={props}
          label={accessibleName}
          fill={sideways}
          width={chartWidth}
        />
      </div>
      {table && <ChartDataTable label={accessibleName} columns={table.columns} rows={table.rows} />}
    </figure>
  );
}

/**
 * Axis bounds on the tick grid around the data (40 to 90, not 47.08 to
 * 82.92): a 1, 2 or 5 step aiming at about five ticks, so ECharts draws its
 * ticks on the same grid. Data that is never negative gets no negative axis.
 */
export function niceRange(
  values: unknown[],
  /** Whole steps only, for an axis of years. */
  integer = false,
  /** A percentage axis, which tops out at 100 when the data does. */
  percent = false,
): { min?: number; max?: number } {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (numbers.length === 0) return {};
  const low = Math.min(...numbers);
  const high = Math.max(...numbers);
  // A lone year is one point in time: a span of one year, not of 2024 years.
  const span = high - low || (integer ? 1 : Math.abs(high) || 1);
  const rough = span / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  const nice = ([1, 2, 5, 10].find((m) => m * power >= rough) ?? 10) * power;
  const step = integer ? Math.max(1, Math.round(nice)) : nice;
  // Rounded to the step's precision, so 0.7 is not 0.7000000000000001.
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const round = (n: number) => Number(n.toFixed(decimals));
  // The epsilon keeps 0.3 / 0.1 (2.9999…) from flooring to 2.
  let min = round(Math.floor(low / step + 1e-9) * step);
  let max = round(Math.ceil(high / step - 1e-9) * step);
  // A point on a bound would sit on the axis line or the plot's edge, so it
  // gets a step of room. Positive quantities still start at zero at most;
  // years are points in time and may start below it.
  if (min === low) min = round(min - step);
  if (max === high) max = round(max + step);
  if (percent && high <= 100) max = Math.min(max, 100);
  return {
    min: low >= 0 && !integer ? Math.max(0, min) : min,
    max: max === min ? round(max + step) : max,
  };
}

/**
 * An axis of years: bounds on whole years, labels as 2024 rather than 2,024,
 * and no label on a tick between years (2023.5 is not a year).
 */
function axisFor(values: unknown[], label: string, leading: boolean) {
  if (!looksLikeYears(values, label, { leading }))
    return niceRange(values, false, /%|\bpercent/i.test(label));
  return {
    ...niceRange(values, true),
    tickFormatter: (value: number) => (Number.isInteger(value) ? String(value) : ""),
  };
}

/** A note naming the scatter axes the program left unlabeled, or empty. */
function unlabeledAxes(props: Props) {
  const x = !text(props.xLabel).trim();
  const y = !text(props.yLabel).trim();
  if (x && y) return "The axes aren’t labeled, so what each point measures isn’t stated.";
  if (x) return "The horizontal axis isn’t labeled, so what it measures isn’t stated.";
  if (y) return "The vertical axis isn’t labeled, so what it measures isn’t stated.";
  return "";
}

/** The chart's width, so its layout can follow the reply column. */
function useWidth() {
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setValue(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { ref: setElement, value };
}

/**
 * A chart's figures as a header row and data rows: what "View data" shows
 * and what Copy and Download CSV write. Null when there is nothing to list.
 */
function chartTable(
  name: string,
  props: Props,
  /** False for export: the values as written, with no grouping. */
  display = true,
): { columns: string[]; rows: string[][] } | null {
  const format = (value: unknown, years: boolean) => (display ? groupDigits(value, years) : text(value));
  if (name === "ScatterChart") {
    const points = array(props.datasets)
      .map(nodeProps)
      .flatMap((dataset) =>
        array(dataset.points).map((point) => ({
          series: text(dataset.name),
          x: nodeProps(point).x,
          y: nodeProps(point).y,
        })),
      );
    const xYears = looksLikeYears(points.map((point) => point.x), text(props.xLabel), { leading: true });
    const yYears = looksLikeYears(points.map((point) => point.y), text(props.yLabel));
    // With one series its name is the caption; a column repeating it is noise.
    const named = array(props.datasets).length > 1;
    return points.length
      ? {
          columns: [...(named ? ["Series"] : []), text(props.xLabel) || "X", text(props.yLabel) || "Y"],
          rows: points.map((point) => [
            ...(named ? [point.series] : []),
            format(point.x, xYears),
            format(point.y, yYears),
          ]),
        }
      : null;
  }
  const labels = array(props.labels).map(text);
  const single = ["PieChart", "RadialChart", "SingleStackedBarChart"].includes(name);
  const series = single
    ? [{ category: "Value", values: array(props.values) }]
    : array(props.series).map(nodeProps);
  if (series.length === 0 || labels.length === 0) return null;
  const years = series.map((item) =>
    looksLikeYears(array(item.values), text(item.category) || text(props.yLabel)),
  );
  return {
    columns: [
      text(props.xLabel) || "Category",
      // One series: its column takes the measure the caption names.
      ...series.map((item) =>
        series.length === 1 && text(props.yLabel)
          ? text(props.yLabel)
          : text(item.category) || text(props.yLabel) || "Value",
      ),
    ],
    rows: labels.map((label, i) => [
      label,
      ...series.map((item, j) => format(array(item.values)[i], years[j])),
    ]),
  };
}

function ChartBody({
  name,
  props,
  label,
  fill = false,
  width = 0,
}: {
  name: string;
  props: Props;
  label: string;
  /** Fill the parent's height, for a chart sized by its number of categories. */
  fill?: boolean;
  /** The figure's width in pixels, or 0 before it is measured. */
  width?: number;
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
    className: fill ? "h-full w-full" : "h-64 w-full",
    isLoading: loading,
    animation: false,
    // Screen readers hear what is measured, not the component's name: the
    // caption, or else the series ("Orders"), or the slices of a pie.
    ariaLabel: label || "Chart",
  };
  if (name === "RadarChart" || name === "RadialChart")
    return <SpecializedChart name={name} props={props} label={label} />;
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
        // A Point is a component node, like the ScatterSeries around it.
        ...nodeProps(point),
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
        {/* One Scatter per series: each draws the points whose group is its key. */}
        {datasets.map((_, i) => (
          <ScatterChart.Scatter key={i} dataKey={`series${i}`} />
        ))}
        <ScatterChart.Grid />
        {/* The caption names both axes, so they carry no titles of their own. */}
        <ScatterChart.XAxis
          hideDots
          {...axisFor(points.map((point) => point.x), text(props.xLabel), true)}
        />
        <ScatterChart.YAxis
          hideDots
          {...axisFor(points.map((point) => point.y), text(props.yLabel), false)}
        />
        {datasets.length > 1 && <ScatterChart.Legend />}
        <ScatterChart.Tooltip />
      </ScatterChart>
    );
  }
  if (name === "LineChart")
    return (
      <LineChart {...common}>
        {series.map((_, i) => (
          <LineChart.Line key={i} dataKey={`series${i}`} strokeWidth={2} />
        ))}
        <LineChart.Grid />
        <LineChart.XAxis dataKey="label" hideDots />
        <LineChart.YAxis hideDots />
        {series.length > 1 && <LineChart.Legend />}
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
        <AreaChart.Grid />
        <AreaChart.XAxis dataKey="label" hideDots />
        <AreaChart.YAxis hideDots />
        {series.length > 1 && <AreaChart.Legend />}
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
  const horizontal = name === "HorizontalBarChart";
  const stacked = props.variant === "stacked";
  // A few categories across a wide reply make slabs; past 96px a bar stops
  // growing and the gap takes the rest. The 56px is the value axis.
  const pitch = width > 0 && !horizontal ? (width - 56) / Math.max(labels.length, 1) : 0;
  const barWidth = 96 * (stacked ? 1 : Math.max(series.length, 1));
  return (
    <BarChart
      {...common}
      layout={horizontal ? "horizontal" : "vertical"}
      stackType={stacked ? "stacked" : "default"}
      barCategoryGap={pitch > barWidth * 1.25 ? pitch - barWidth : undefined}
    >
      {series.map((_, i) => (
        <BarChart.Bar
          key={i}
          dataKey={`series${i}`}
          // Rounded at the value end only, so bars stand on their baseline.
          // The library hands the radius to ECharts, which takes corners.
          radius={
            (stacked && i < series.length - 1
              ? 0
              : horizontal
                ? [0, 4, 4, 0]
                : [4, 4, 0, 0]) as unknown as number
          }
        />
      ))}
      <BarChart.Grid />
      <BarChart.XAxis dataKey="label" hideDots />
      <BarChart.YAxis hideDots />
      {series.length > 1 && <BarChart.Legend />}
      <BarChart.Tooltip />
    </BarChart>
  );
}
