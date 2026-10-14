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
export function SpecializedChart({
  name,
  props,
}: {
  name: string;
  props: Props;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const labels = array(props.labels).map(text);
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
      aria: { enabled: true, decal: { show: true } },
      tooltip: {},
      legend: { bottom: 0, textStyle: { color } },
      ...(name === "RadarChart"
        ? {
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
        : {
            angleAxis: { type: "value" },
            radiusAxis: {
              type: "category",
              data: labels,
              axisLabel: { color },
            },
            polar: {},
            series: [{ type: "bar", coordinateSystem: "polar", data: values }],
          }),
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [name, props, resolvedTheme]);
  return (
    <figure className="m-0">
      <div ref={ref} role="img" aria-label={name} className="h-72 w-full" />
      <details>
        <summary className="cursor-pointer text-sm underline">
          View chart data
        </summary>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Category</th>
              {array(props.series).map((series, i) => (
                <th key={i}>{text(nodeProps(series).category)}</th>
              ))}
              {!!props.values && <th>Value</th>}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={i}>
                <th>{label}</th>
                {array(props.series).map((series, j) => (
                  <td key={j}>{text(array(nodeProps(series).values)[i])}</td>
                ))}
                {!!props.values && <td>{text(array(props.values)[i])}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
