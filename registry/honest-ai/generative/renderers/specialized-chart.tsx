"use client";
import * as React from "react";
import * as echarts from "echarts/core";
import { RadarChart, BarChart } from "echarts/charts";
import {
  RadarComponent,
  PolarComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { useTheme } from "next-themes";
import { array, nodeProps, text, type Props } from "./shared";
// Honest UI provides Cartesian and pie charts; radar, polar bars and the
// single stacked bar are drawn here.
echarts.use([
  RadarChart,
  BarChart,
  RadarComponent,
  PolarComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  SVGRenderer,
]);

/** The colors a chart reads from the page, so it follows the theme. */
type Ink = {
  palette: string[];
  /** Labels and legend text. */
  muted: string;
  /** Rings, spokes and tracks. */
  line: string;
  /** The surface the chart sits on, for the gaps between parts. */
  surface: string;
  /** A ring's or a bar's empty track. */
  track: string;
};

const escape = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * A tooltip drawn like the surface it sits over: a hairline border, no
 * shadow, 12px text, the figure in tabular numerals.
 */
function tooltipCard(title: string, rows: { color: string; name: string; value: string }[]) {
  const body = rows
    .map(
      (row) =>
        `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;flex:none;background:${row.color}"></span><span style="color:var(--hui-color-foreground-base-secondary)">${escape(row.name)}</span><span style="margin-inline-start:auto;padding-inline-start:12px;font-variant-numeric:tabular-nums;color:var(--hui-color-foreground-base-primary)">${escape(row.value)}</span></div>`,
    )
    .join("");
  return `<div style="display:grid;gap:4px;min-width:128px;padding:6px 10px;font-size:12px;line-height:16px;border:1px solid var(--hui-color-border-base-primary);border-radius:var(--hui-radius-2);background:var(--hui-color-background-raised,var(--hui-color-background-base-primary))">${title ? `<div style="font-weight:500;color:var(--hui-color-foreground-base-primary)">${escape(title)}</div>` : ""}${body}</div>`;
}

const tooltipBase = {
  confine: true,
  backgroundColor: "transparent",
  borderWidth: 0,
  padding: 0,
  extraCssText: "box-shadow:none;",
};

const share = (value: number, total: number) => `${Math.round((value / total) * 100)}%`;

/**
 * Radial bars as concentric rings, one per category, outermost first. Each
 * ring's arc is its share of the total, drawn over a full-circle track, so
 * the rings compare at a glance. One series colors each ring itself; the
 * legend beneath the chart (ShareLegend) names them with their values.
 */
function radial(labels: string[], values: number[], ink: Ink) {
  const total = shareTotal(values);
  return {
    legend: { show: false },
    tooltip: {
      ...tooltipBase,
      formatter: (item: { name: string; value: number; color: string }) =>
        tooltipCard("", [
          { color: item.color, name: item.name, value: `${item.value.toLocaleString()} · ${share(item.value, total)}` },
        ]),
    },
    polar: { radius: ["28%", "92%"] },
    angleAxis: { type: "value", max: total, startAngle: 90, show: false },
    radiusAxis: { type: "category", data: labels, show: false, inverse: true },
    series: [
      {
        type: "bar",
        coordinateSystem: "polar",
        data: values.map((value, i) => ({
          value,
          name: labels[i],
          itemStyle: { color: ink.palette[i % ink.palette.length] },
        })),
        showBackground: true,
        backgroundStyle: { color: ink.track },
        roundCap: true,
        barWidth: "52%",
      },
    ],
  };
}

/**
 * One bar split into its parts, as a slim meter across the full width: the
 * parts in order, a sliver of surface between them, rounded at the ends.
 */
function stackedBar(labels: string[], values: number[], ink: Ink) {
  const total = shareTotal(values);
  const last = values.length - 1;
  return {
    legend: { show: false },
    tooltip: {
      ...tooltipBase,
      trigger: "item",
      formatter: (item: { seriesName: string; value: number; color: string }) =>
        tooltipCard("", [
          { color: item.color, name: item.seriesName, value: `${item.value.toLocaleString()} · ${share(item.value, total)}` },
        ]),
    },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: "value", min: 0, max: total, show: false },
    yAxis: { type: "category", data: ["Total"], show: false },
    series: labels.map((label, i) => ({
      type: "bar",
      name: label,
      stack: "total",
      barWidth: "100%",
      data: [Number.isFinite(values[i]) && values[i] > 0 ? values[i] : 0],
      itemStyle: {
        color: ink.palette[i % ink.palette.length],
        // A 1px surface border on each side leaves a 2px gap between parts.
        borderColor: ink.surface,
        borderWidth: 1,
        borderRadius: i === 0 && i === last ? 4 : i === 0 ? [4, 0, 0, 4] : i === last ? [0, 4, 4, 0] : 0,
      },
    })),
  };
}

function shareTotal(values: number[]) {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0) || 1;
}

/** The parts' names, values and shares, in order, each with its color. */
function ShareLegend({ props, center = false }: { props: Props; center?: boolean }) {
  const labels = array(props.labels).map(text);
  const values = array(props.values).map(Number);
  const total = shareTotal(values);
  return (
    <ul className={`m-0 flex list-none flex-wrap ${center ? "justify-center" : ""} gap-x-4 gap-y-1.5 p-0 text-xs text-[var(--hui-color-foreground-base-secondary)]`}>
      {labels.map((label, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: `var(--chart-${(i % 5) + 1})` }}
          />
          <span className="text-[var(--hui-color-foreground-base-primary)]">{label}</span>
          <span className="tabular-nums">
            {Number.isFinite(values[i]) ? values[i].toLocaleString() : "—"}
            {Number.isFinite(values[i]) && ` · ${share(values[i], total)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The first painted background behind an element: the surface it sits on. */
function surfaceOf(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    if (color && color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return getComputedStyle(document.body).backgroundColor || "#fff";
}

/** Point shapes, so radar series are told apart by more than color. */
const SYMBOLS = ["circle", "rect", "triangle", "diamond", "roundRect"];

const HEIGHT: Record<string, string> = {
  RadarChart: "h-72",
  RadialChart: "h-56",
  SingleStackedBarChart: "h-3",
};

export function SpecializedChart({
  name,
  props,
  label,
}: {
  name: string;
  props: Props;
  /** What the chart measures, from GeneratedChart's caption. */
  label?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const style = getComputedStyle(element);
    const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const ink: Ink = {
      palette: [1, 2, 3, 4, 5].map((i) => token(`--chart-${i}`, "#888")),
      muted: token("--hui-color-foreground-base-secondary", style.color),
      line: token("--hui-color-border-base-primary", "rgba(128,128,128,0.25)"),
      surface: surfaceOf(element),
      track: token("--hui-color-background-base-secondary", "rgba(128,128,128,0.1)"),
    };
    const chart = echarts.init(element, undefined, { renderer: "svg" });
    const series = array(props.series).map(nodeProps);
    const labels = array(props.labels).map(text);
    const values = array(props.values).map(Number);
    chart.setOption({
      animation: false,
      color: ink.palette,
      textStyle: { color: ink.muted, fontSize: 12 },
      aria: { enabled: true },
      ...(name === "RadarChart"
        ? {
            tooltip: {
              ...tooltipBase,
              trigger: "item",
              formatter: (item: { name: string; value: unknown[]; color: string }) =>
                tooltipCard(
                  item.name,
                  labels.map((indicator, i) => ({
                    color: item.color,
                    name: indicator,
                    value: Number.isFinite(Number(item.value[i])) ? Number(item.value[i]).toLocaleString() : "—",
                  })),
                ),
            },
            // Left, as the other charts' legends are, with each series' shape.
            legend: {
              top: 0,
              left: 0,
              itemWidth: 8,
              itemHeight: 8,
              itemGap: 16,
              textStyle: { color: ink.muted, fontSize: 12 },
              data: series.map((item, i) => ({ name: text(item.category), icon: SYMBOLS[i % SYMBOLS.length] })),
            },
            radar: {
              center: ["50%", "54%"],
              radius: "68%",
              indicator: labels.map((label) => ({ name: label })),
              axisName: { color: ink.muted, fontSize: 12 },
              axisLine: { lineStyle: { color: ink.line } },
              splitLine: { lineStyle: { color: ink.line } },
              splitArea: { show: false },
            },
            series: [
              {
                type: "radar",
                symbolSize: 6,
                lineStyle: { width: 2 },
                data: series.map((item, i) => ({
                  name: text(item.category),
                  value: array(item.values),
                  symbol: SYMBOLS[i % SYMBOLS.length],
                  areaStyle: { opacity: 0.08 },
                })),
              },
            ],
          }
        : name === "SingleStackedBarChart"
          ? stackedBar(labels, values, ink)
          : radial(labels, values, ink)),
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [name, props, resolvedTheme]);
  const parts = name === "RadialChart" || name === "SingleStackedBarChart";
  return (
    // GeneratedChart supplies the figure and its caption.
    <div className={name === "SingleStackedBarChart" ? "grid gap-3 pt-1" : "grid gap-3"}>
      <div
        ref={ref}
        role="img"
        aria-label={
          label ||
          array(props.series).map((item) => text(nodeProps(item).category)).filter(Boolean).join(", ") ||
          array(props.labels).map(text).join(", ") ||
          "Chart"
        }
        className={`${HEIGHT[name] ?? "h-72"} w-full`}
      />
      {/* Centred under the rings, as a pie's legend is; at the start under a bar. */}
      {parts && <ShareLegend props={props} center={name === "RadialChart"} />}
    </div>
  );
}
