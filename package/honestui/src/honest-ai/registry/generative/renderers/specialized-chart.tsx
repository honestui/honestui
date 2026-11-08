"use client";
import * as React from "react";
import * as echarts from "echarts/core";
import { RadarChart, BarChart } from "echarts/charts";
import {
  RadarComponent,
  PolarComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { useTheme } from "next-themes";
import { array, nodeProps, text, type Props } from "./shared";
// Honest UI provides Cartesian and pie charts; radar and polar bars are additions.
echarts.use([
  RadarChart,
  BarChart,
  RadarComponent,
  PolarComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  SVGRenderer,
]);
/**
 * Radial bars as concentric rings, one per category, outermost first. Each
 * ring's arc is its share of the total, drawn over a full-circle track, so
 * the rings compare at a glance. One series colors each ring itself; the
 * legend beneath the chart (RadialLegend) names them with their values.
 */
function radial(labels: string[], values: number[], palette: string[], track: string) {
  const total = radialTotal(values);
  return {
    legend: { show: false },
    tooltip: {
      formatter: (item: { name: string; value: number }) =>
        `${item.name}: ${item.value.toLocaleString()} (${Math.round((item.value / total) * 100)}%)`,
    },
    polar: { radius: ["24%", "92%"] },
    angleAxis: { type: "value", max: total, startAngle: 90, show: false },
    radiusAxis: { type: "category", data: labels, show: false, inverse: true },
    series: [
      {
        type: "bar",
        coordinateSystem: "polar",
        data: values.map((value, i) => ({ value, name: labels[i], itemStyle: { color: palette[i % palette.length] } })),
        showBackground: true,
        backgroundStyle: { color: track },
        roundCap: true,
        barWidth: "62%",
      },
    ],
  };
}

function radialTotal(values: number[]) {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0) || 1;
}

/** The rings' names, values and shares, in ring order, with the ring's color. */
function RadialLegend({ props }: { props: Props }) {
  const labels = array(props.labels).map(text);
  const values = array(props.values).map(Number);
  const total = radialTotal(values);
  return (
    <ul className="m-0 flex list-none flex-wrap justify-center gap-x-5 gap-y-1.5 p-0 text-xs text-[var(--hui-color-foreground-base-secondary)]">
      {labels.map((label, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: `var(--chart-${(i % 5) + 1})` }} />
          <span className="text-[var(--hui-color-foreground-base-primary)]">{label}</span>
          <span className="tabular-nums">
            {Number.isFinite(values[i]) ? values[i].toLocaleString() : "—"}
            {Number.isFinite(values[i]) && ` (${Math.round((values[i] / total) * 100)}%)`}
          </span>
        </li>
      ))}
    </ul>
  );
}

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
    const color = style.color;
    const palette = [1, 2, 3, 4, 5].map((i) =>
      style.getPropertyValue(`--chart-${i}`).trim(),
    );
    const chart = echarts.init(element, undefined, { renderer: "svg" });
    const series = array(props.series).map(nodeProps);
    const labels = array(props.labels).map(text);
    const values = array(props.values).map(Number);
    chart.setOption({
      animation: false,
      color: palette,
      textStyle: { color },
      // Hatching tells radar areas apart without color; radial rings are
      // already told apart by their position and the legend.
      aria: { enabled: true, decal: { show: name === "RadarChart" } },
      ...(name === "RadarChart"
        ? {
            tooltip: {},
            // Dots, as in the scatter chart's legend.
            legend: { bottom: 0, icon: "circle", textStyle: { color } },
            radar: { indicator: labels.map((label) => ({ name: label })) },
            series: [
              {
                type: "radar",
                data: series.map((item) => ({
                  name: text(item.category),
                  value: array(item.values),
                })),
              },
            ],
          }
        : radial(labels, values, palette, style.getPropertyValue("--hui-color-background-base-secondary").trim())),
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [name, props, resolvedTheme]);
  return (
    // GeneratedChart supplies the figure and its caption.
    <div className="grid gap-3">
      <div ref={ref} role="img" aria-label={
          label ||
          array(props.series).map((item) => text(nodeProps(item).category)).filter(Boolean).join(", ") ||
          array(props.labels).map(text).join(", ") ||
          "Chart"
        } className={name === "RadialChart" ? "h-60 w-full" : "h-72 w-full"} />
      {name === "RadialChart" && <RadialLegend props={props} />}
    </div>
  );
}
