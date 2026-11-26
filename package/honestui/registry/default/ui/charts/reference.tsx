import {
  normalizeColor,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LineChart as LineChartModule, type LineSeriesOption } from "echarts/charts";
import {
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
} from "echarts/components";
import { Children, isValidElement, type FC, type ReactNode } from "react";
import * as echarts from "echarts/core";

// The marks ride on an invisible line series, so the line module is
// registered here for charts that do not draw lines themselves.
echarts.use([LineChartModule, MarkLineComponent, MarkAreaComponent, MarkPointComponent]);

/**
 * Reference marks use screen axes: `x` is a position on the horizontal axis
 * and `y` on the vertical axis, whatever the chart layout. On a category axis
 * pass the category as it appears in the data; on a value axis pass a number.
 */
export type ReferenceValue = string | number;
export type ReferenceStroke = "dashed" | "solid";
export type ReferenceLabelPosition = "start" | "center" | "end";

export interface ReferenceLineProps {
  x?: ReferenceValue;
  y?: ReferenceValue;
  label?: string;
  /** Where the label sits along the line. Defaults to `end` (right, or top). */
  labelPosition?: ReferenceLabelPosition;
  strokeVariant?: ReferenceStroke;
  strokeWidth?: number;
  /** A chart config key or any CSS color. Defaults to the muted foreground. */
  color?: string;
  /** Grow the value axis to keep the line in view. Defaults to true. */
  extendDomain?: boolean;
}

export interface ReferenceAreaProps {
  x1?: ReferenceValue;
  x2?: ReferenceValue;
  y1?: ReferenceValue;
  y2?: ReferenceValue;
  label?: string;
  labelPosition?: ReferenceLabelPosition;
  color?: string;
  extendDomain?: boolean;
}

export interface ReferenceDotProps {
  x: ReferenceValue;
  y: ReferenceValue;
  label?: string;
  labelPosition?: "top" | "bottom" | "left" | "right";
  color?: string;
  /** Dot diameter in pixels. Defaults to 8. */
  size?: number;
  extendDomain?: boolean;
}

export const ReferenceLine: FC<ReferenceLineProps> = () => null;
ReferenceLine.displayName = "ReferenceLine";
export const ReferenceArea: FC<ReferenceAreaProps> = () => null;
ReferenceArea.displayName = "ReferenceArea";
export const ReferenceDot: FC<ReferenceDotProps> = () => null;
ReferenceDot.displayName = "ReferenceDot";

export type ReferenceSlots = {
  lines: ReferenceLineProps[];
  areas: ReferenceAreaProps[];
  dots: ReferenceDotProps[];
};

function isSlot(type: unknown, slot: unknown, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || (typeof candidate === "string" && candidate.endsWith(`.${name}`));
}

/** Reads reference slots from a chart's children. Null when there are none. */
export function collectReferences(children: ReactNode): ReferenceSlots | null {
  const slots: ReferenceSlots = { lines: [], areas: [], dots: [] };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (isSlot(child.type, ReferenceLine, "ReferenceLine")) {
      slots.lines.push(child.props as ReferenceLineProps);
    } else if (isSlot(child.type, ReferenceArea, "ReferenceArea")) {
      slots.areas.push(child.props as ReferenceAreaProps);
    } else if (isSlot(child.type, ReferenceDot, "ReferenceDot")) {
      slots.dots.push(child.props as ReferenceDotProps);
    }
  });
  return slots.lines.length || slots.areas.length || slots.dots.length ? slots : null;
}

/** Config keys used as reference colors, so a chart resolves them with its series. */
export function referenceColorKeys(refs: ReferenceSlots | null, config: ChartConfig): string[] {
  if (!refs) return [];
  const keys = new Set<string>();
  for (const item of [...refs.lines, ...refs.areas, ...refs.dots]) {
    if (item.color && config[item.color]) keys.add(item.color);
  }
  return [...keys];
}

/**
 * Values on one screen axis that marks keep in view. For charts that set
 * their own axis bounds, such as the scatter chart, instead of the carrier.
 */
export function referenceValues(refs: ReferenceSlots | null, axis: "x" | "y"): number[] {
  if (!refs) return [];
  const values: unknown[] = [];
  for (const line of refs.lines) {
    if (line.extendDomain !== false) values.push(axis === "x" ? line.x : line.y);
  }
  for (const area of refs.areas) {
    if (area.extendDomain !== false) {
      values.push(...(axis === "x" ? [area.x1, area.x2] : [area.y1, area.y2]));
    }
  }
  for (const dot of refs.dots) {
    if (dot.extendDomain !== false) values.push(axis === "x" ? dot.x : dot.y);
  }
  return values
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(Number)
    .filter(Number.isFinite);
}

function resolveColor(color: string | undefined, resolved: ResolvedColors, fallback: string) {
  if (!color) return fallback;
  const slot = resolved.series[color]?.[0];
  if (slot) return slot;
  const normalized = normalizeColor(color);
  return normalized.startsWith("rgba(") ? normalized : fallback;
}

const LABEL_HEIGHT = 18;

function labelPill(tokens: ResolvedColors["tokens"]) {
  return {
    color: tokens.foreground,
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 12,
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: [2, 5],
  };
}

const HORIZONTAL_LABEL: Record<ReferenceLabelPosition, string> = {
  start: "insideStartTop",
  center: "insideMiddleTop",
  end: "insideEndTop",
};

const AREA_LABEL: Record<ReferenceLabelPosition, string> = {
  start: "insideTopLeft",
  center: "insideTop",
  end: "insideTopRight",
};

/**
 * Builds the invisible carrier series that draws every reference mark.
 * `valueAxes` names the axes that are numeric, so marks on them can widen
 * the axis: the carrier holds an invisible point at each such value.
 */
export function buildReferenceSeries(params: {
  refs: ReferenceSlots | null;
  resolved: ResolvedColors;
  valueAxes: { x: boolean; y: boolean };
  xAxisIndex?: number;
  yAxisIndex?: number;
  z?: number;
}): LineSeriesOption | null {
  const { refs, resolved, valueAxes, xAxisIndex = 0, yAxisIndex = 0, z = 5 } = params;
  if (!refs) return null;
  const { tokens } = resolved;
  // A guide, not data: the muted ink, eased back so it stays quieter than a
  // series in dark mode, where the muted ink is light.
  const muted = withAlpha(tokens.mutedForeground, 0.75);

  // Points that keep values in view. The other coordinate is the first
  // category on a category axis, or empty on a value axis so that axis is
  // left alone.
  const extent: [ReferenceValue, ReferenceValue][] = [];
  const keep = (axis: "x" | "y", value: ReferenceValue | undefined, extend?: boolean) => {
    if (extend === false || value === undefined || !valueAxes[axis]) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    const other = valueAxes[axis === "x" ? "y" : "x"] ? "-" : 0;
    extent.push(axis === "x" ? [n, other] : [other, n]);
  };

  const lineData = refs.lines.flatMap((line) => {
    const isVertical = line.x !== undefined;
    if (!isVertical && line.y === undefined) return [];
    keep(isVertical ? "x" : "y", isVertical ? line.x : line.y, line.extendDomain);
    const color = resolveColor(line.color, resolved, muted);
    const position = line.labelPosition ?? "end";
    // Labels inside a line are drawn along it, which would stand a vertical
    // label on its side. Vertical labels sit on the line's end instead, as a
    // level pill pulled just inside the plot.
    const label = line.label
      ? isVertical
        ? {
            show: true,
            formatter: line.label,
            position: position === "start" ? "start" : "end",
            distance: [0, -LABEL_HEIGHT - 2],
            ...labelPill(tokens),
          }
        : {
            show: true,
            formatter: line.label,
            position: HORIZONTAL_LABEL[position],
            distance: 4,
            ...labelPill(tokens),
          }
      : { show: false };
    return [
      {
        ...(isVertical ? { xAxis: line.x } : { yAxis: line.y }),
        lineStyle: {
          color,
          width: line.strokeWidth ?? 1,
          type: line.strokeVariant === "solid" ? "solid" : [3, 3],
          opacity: 1,
        },
        label,
      },
    ];
  });

  const areaData = refs.areas.flatMap((area) => {
    const hasX = area.x1 !== undefined || area.x2 !== undefined;
    const hasY = area.y1 !== undefined || area.y2 !== undefined;
    if (!hasX && !hasY) return [];
    keep("x", area.x1, area.extendDomain);
    keep("x", area.x2, area.extendDomain);
    keep("y", area.y1, area.extendDomain);
    keep("y", area.y2, area.extendDomain);
    const color = resolveColor(area.color, resolved, tokens.foreground);
    const tint = area.color ? 0.1 : 0.045;
    // An open edge runs to the edge of the plot.
    const from: Record<string, unknown> = {
      name: area.label ?? "",
      itemStyle: { color: withAlpha(color, tint) },
      label: {
        show: !!area.label,
        position: AREA_LABEL[area.labelPosition ?? "start"],
        color: area.color ? color : tokens.mutedForeground,
        fontSize: 10,
        fontWeight: 500,
        padding: [6, 6],
      },
    };
    const to: Record<string, unknown> = {};
    if (hasX) {
      from.xAxis = area.x1 ?? "min";
      to.xAxis = area.x2 ?? "max";
    }
    if (hasY) {
      from.yAxis = area.y1 ?? "min";
      to.yAxis = area.y2 ?? "max";
    }
    return [[from, to]];
  });

  const dotData = refs.dots.map((dot) => {
    keep("x", dot.x, dot.extendDomain);
    keep("y", dot.y, dot.extendDomain);
    const color = resolveColor(dot.color, resolved, tokens.foreground);
    return {
      coord: [dot.x, dot.y],
      symbol: "circle",
      symbolSize: dot.size ?? 8,
      itemStyle: { color, borderColor: tokens.background, borderWidth: 2 },
      label: dot.label
        ? {
            show: true,
            formatter: dot.label,
            position: dot.labelPosition ?? "top",
            distance: 6,
            ...labelPill(tokens),
          }
        : { show: false },
    };
  });

  return {
    id: "__reference",
    type: "line",
    xAxisIndex,
    yAxisIndex,
    data: extent,
    silent: true,
    showSymbol: false,
    symbol: "none",
    lineStyle: { opacity: 0, width: 0 },
    tooltip: { show: false },
    emphasis: { disabled: true },
    animation: false,
    legendHoverLink: false,
    z,
    markLine: lineData.length
      ? ({
          silent: true,
          animation: false,
          symbol: ["none", "none"],
          emphasis: { disabled: true },
          data: lineData,
        } as LineSeriesOption["markLine"])
      : undefined,
    markArea: areaData.length
      ? ({
          silent: true,
          animation: false,
          emphasis: { disabled: true },
          data: areaData,
        } as LineSeriesOption["markArea"])
      : undefined,
    markPoint: dotData.length
      ? ({
          silent: true,
          animation: false,
          emphasis: { disabled: true },
          data: dotData,
        } as LineSeriesOption["markPoint"])
      : undefined,
  };
}
