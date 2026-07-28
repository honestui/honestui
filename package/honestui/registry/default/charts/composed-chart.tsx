"use client";

import {
  tooltipBaseOption,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import {
  Brush,
  buildBrushDataZoom,
  syncBrushOverlay,
  type BrushGeometry,
  type BrushOverlayElements,
  type BrushProps,
  type BrushRange,
} from "@/registry/default/ui/charts/brush";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  type DataZoomComponentOption,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import {
  buildChartCss,
  flattenColor,
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import { dotItemStyle, dotStyle, sampleGradient, type DotVariant } from "@/registry/default/ui/charts/dot";
import { BarChart, LineChart, type BarSeriesOption, type LineSeriesOption } from "echarts/charts";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import type { ComposeOption, ImagePatternObject } from "echarts/core";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import * as echarts from "echarts/core";

export type {
  ChartConfig,
  DotVariant,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type EChartsInstance = ReturnType<typeof echarts.init>;

type EChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
>;

type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

type SeriesPaint = string | echarts.graphic.LinearGradient | ImagePatternObject;

const STROKE_WIDTH = 2; 
const AXIS_POINTER_WIDTH = 1; 
const DEFAULT_BAR_RADIUS = 4; 
const LOADING_ANIMATION_DURATION = 2000; 
const REVEAL_DURATION = 1000; 

const BAR_GROW_DURATION = 500; 
const BAR_STAGGER = 50; 

const LOADING_DEFAULT_BARS = 12;
const DASH_PATTERN: [number, number] = [5, 5]; 
const DASH_PERIOD = 10; 

const GRID_LINE_OPACITY = 1; 
const AXIS_POINTER_OPACITY = 1; 

const LOADING_BAR_MAX_OPACITY = 0.22; 
const LOADING_LINE_MAX_OPACITY = 0.5; 
const LOADING_LINE_WIDTH = 2; 
const LOADING_SHIMMER_BAND = 0.2; 
const LOADING_SHIMMER_FEATHER = 0.2; 
const BRUSH_STROKE_OPACITY = 0.5; 
const BRUSH_FILL_OPACITY = 0.15; 
const BRUSH_FILLER_OPACITY = 0; 

const BAR_GLOW_BLUR = 16; 
const BAR_GLOW_OPACITY = 0.6; 

const LINE_GLOW_LAYERS: { width: number; opacity: number; blur: number }[] = [
  { width: 2, opacity: 0.9, blur: 5 }, 
  { width: 2, opacity: 0.6, blur: 12 },
  { width: 2, opacity: 0.38, blur: 24 },
  { width: 2, opacity: 0.22, blur: 42 },
];

const SELECTION_DIM = 0.3;
const SELECTION_DIM_FILL = 0.15;

export type BarVariant =
  | "default"
  | "hatched"
  | "duotone"
  | "duotone-reverse"
  | "gradient"
  | "stripped";
export type StrokeVariant = "solid" | "dashed" | "animated-dashed";
export type ComposedAnimationType =
  | "none"
  | "left-to-right"
  | "right-to-left"
  | "center-out"
  | "edges-in";
export type CurveType =
  | "linear"
  | "smooth"
  | "bump"
  | "monotone"
  | "monotoneX"
  | "monotoneY"
  | "natural"
  | "step";

export interface ComposedChartProps<TData extends Record<string, unknown>> {
  data: TData[]; 
  config: ChartConfig; 
  xDataKey?: keyof TData & string; 
  className?: string; 
  curveType?: CurveType; 
  animation?: boolean; 
  animationType?: ComposedAnimationType; 
  barGap?: number | string; 
  barCategoryGap?: number | string; 
  defaultSelectedDataKey?: string | null; 
  onSelectionChange?: (key: string | null) => void; 
  isLoading?: boolean; 
  loadingBars?: number; 
  chartOptions?: Record<string, unknown>; 
  children?: ReactNode; 
}

export interface BarProps {
  dataKey: string; 
  variant?: BarVariant; 
  radius?: number; 
  glow?: boolean; 
  animationType?: ComposedAnimationType; 
  isClickable?: boolean; 
  enableHoverHighlight?: boolean; 
  barProps?: Partial<BarSeriesOption>; 
}

const Bar: FC<BarProps> = () => null;

export interface LineProps {
  dataKey: string; 
  strokeVariant?: StrokeVariant; 
  curveType?: CurveType; 
  animationType?: ComposedAnimationType; 
  connectNulls?: boolean; 
  glow?: boolean; 
  isClickable?: boolean; 
  children?: ReactNode; 
  lineProps?: Partial<LineSeriesOption>; 
}

const Line: FC<LineProps> = () => null;

export interface DotProps {
  variant?: DotVariant; 
}

const Dot: FC<DotProps> = () => null;

const ActiveDot: FC<DotProps> = () => null;

export interface XAxisProps {
  dataKey?: string; 

  tickFormatter?: (value: string, index: number) => string; 
  label?: string; 
  hideDots?: boolean; 
}

const XAxis: FC<XAxisProps> = () => null;

export interface YAxisProps {
  dataKey?: string; 
  tickFormatter?: (value: number, index: number) => string; 
  label?: string; 
  hideDots?: boolean; 
}

const YAxis: FC<YAxisProps> = () => null;

const Grid: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; 
  roundness?: TooltipRoundness; 
  defaultIndex?: number; 
  cursor?: boolean; 
  position?: TooltipPosition; 
}

const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  variant?: LegendVariant; 
  align?: "left" | "center" | "right"; 
  verticalAlign?: "top" | "middle" | "bottom"; 
  isClickable?: boolean; 
}

const Legend: FC<LegendProps> = () => null;

type BarSeriesConfig = {
  dataKey: string;
  variant: BarVariant;
  radius: number;
  glow: boolean;
  animationType?: ComposedAnimationType;
  isClickable: boolean;
  enableHoverHighlight: boolean;
  barProps?: Partial<BarSeriesOption>;
};

type LineSeriesConfig = {
  dataKey: string;
  strokeVariant: StrokeVariant;
  curveType?: CurveType;
  animationType?: ComposedAnimationType;
  connectNulls: boolean;
  glow: boolean;
  isClickable: boolean;
  dotVariant: DotVariant; 
  activeDotVariant: DotVariant; 
  lineProps?: Partial<LineSeriesOption>;
};

type XAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hideDots: boolean;
};
type YAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots: boolean;
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  defaultIndex?: number;
  cursor: boolean;
  position: TooltipPosition;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};
type BrushSlot = {
  present: boolean; 
  height?: number;
  formatLabel?: (value: string, index: number) => string;
  onChange?: (range: { startIndex: number; endIndex: number }) => void;
};

type CollectedConfig = {
  bars: BarSeriesConfig[];
  lines: LineSeriesConfig[];
  xAxis: XAxisSlot;
  yAxis: YAxisSlot;
  showGrid: boolean;
  tooltip: TooltipSlot;
  legend: LegendSlot;
  brush: BrushSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const bars: BarSeriesConfig[] = [];
  const lines: LineSeriesConfig[] = [];
  let xAxis: XAxisSlot = { present: false, hideDots: false };
  let yAxis: YAxisSlot = { present: false, hideDots: false };
  let showGrid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    cursor: true,
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    variant: "rounded-square",
    align: "right",
    verticalAlign: "top",
    isClickable: false,
  };
  let brush: BrushSlot = { present: false };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Bar) {
      const props = child.props as BarProps;
      bars.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "default",
        radius: props.radius ?? DEFAULT_BAR_RADIUS,
        glow: props.glow ?? false,
        animationType: props.animationType,
        isClickable: props.isClickable ?? false,
        enableHoverHighlight: props.enableHoverHighlight ?? false,
        barProps: props.barProps,
      });
    } else if (type === Line) {
      const props = child.props as LineProps;
      let dotVariant: DotVariant = "none";
      let activeDotVariant: DotVariant = "none";
      Children.forEach(props.children, (dotChild) => {
        if (!isValidElement(dotChild)) return;
        if (dotChild.type === Dot) {
          dotVariant = (dotChild.props as DotProps).variant ?? "default";
        } else if (dotChild.type === ActiveDot) {
          activeDotVariant = (dotChild.props as DotProps).variant ?? "default";
        }
      });
      lines.push({
        dataKey: props.dataKey,
        strokeVariant: props.strokeVariant ?? "solid",
        curveType: props.curveType,
        animationType: props.animationType,
        connectNulls: props.connectNulls ?? false,
        glow: props.glow ?? false,
        isClickable: props.isClickable ?? false,
        dotVariant,
        activeDotVariant,
        lineProps: props.lineProps,
      });
    } else if (type === XAxis) {
      const props = child.props as XAxisProps;
      xAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
        hideDots: props.hideDots ?? false,
      };
    } else if (type === YAxis) {
      const props = child.props as YAxisProps;
      yAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
        hideDots: props.hideDots ?? false,
      };
    } else if (type === Grid) {
      showGrid = true;
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        defaultIndex: props.defaultIndex,
        cursor: props.cursor ?? true,
        position: props.position ?? "variable",
      };
    } else if (type === Legend) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "right",
        verticalAlign: props.verticalAlign ?? "top",
        isClickable: props.isClickable ?? false,
      };
    } else if (type === Brush) {
      const props = child.props as BrushProps;
      brush = {
        present: true,
        height: props.height,
        formatLabel: props.formatLabel,
        onChange: props.onChange,
      };
    }
  });

  return { bars, lines, xAxis, yAxis, showGrid, tooltip, legend, brush };
}

function barHatchPattern(color: string): ImagePatternObject | null {
  if (typeof document === "undefined") return null;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const period = 5;
  const stripe = 1.5;
  canvas.width = period * dpr;
  canvas.height = period * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = withAlpha(color, 0.3);
  ctx.fillRect(0, 0, period, period);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, stripe, period);

  return {
    image: canvas,
    repeat: "repeat",
    rotation: -Math.PI / 4,
    scaleX: 1 / dpr,
    scaleY: 1 / dpr,
  };
}

function verticalColorGradient(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? "rgba(120, 120, 120, 1)";
  return new echarts.graphic.LinearGradient(
    0,
    0,
    0,
    1,
    slots.map((color, i) => ({ offset: i / (slots.length - 1), color })),
  );
}

function barFillPaint(variant: BarVariant, slots: string[]): SeriesPaint {
  const base = slots[0] ?? "rgba(120, 120, 120, 1)";
  const multi = slots.length > 1;

  switch (variant) {
    case "gradient": {

      const fade = (t: number) => (t <= 0.2 ? 1 : t >= 0.9 ? 0 : 1 - (t - 0.2) / 0.7);
      if (multi) {
        return new echarts.graphic.LinearGradient(
          0,
          0,
          0,
          1,
          slots.map((color, i) => {
            const t = i / (slots.length - 1);
            return { offset: t, color: withAlpha(color, fade(t)) };
          }),
        );
      }
      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: withAlpha(base, 1) },
        { offset: 0.2, color: withAlpha(base, 1) },
        { offset: 0.9, color: withAlpha(base, 0) },
        { offset: 1, color: withAlpha(base, 0) },
      ]);
    }
    case "duotone":
    case "duotone-reverse": {

      const reverse = variant === "duotone-reverse";
      const dim = withAlpha(base, 0.4);
      const left = reverse ? base : dim;
      const right = reverse ? dim : base;
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: left },
        { offset: 0.5, color: left },
        { offset: 0.5, color: right },
        { offset: 1, color: right },
      ]);
    }
    case "stripped": {

      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: withAlpha(base, 1) },
        { offset: 0.05, color: withAlpha(base, 0.4) },
        { offset: 1, color: withAlpha(base, 0.1) },
      ]);
    }
    case "hatched":
      return barHatchPattern(base) ?? base;
    case "default":
    default:
      return verticalColorGradient(slots);
  }
}

function curveConfig(curveType: CurveType): { smooth: boolean; step: "middle" | false } {
  if (curveType === "step") return { smooth: false, step: "middle" };
  if (curveType === "linear") return { smooth: false, step: false };
  return { smooth: true, step: false };
}

function seriesDim(selected: string | null, key: string): number {
  return selected === null || selected === key ? 1 : SELECTION_DIM;
}

function seriesFillDim(selected: string | null, key: string): number {
  return selected === null || selected === key ? 1 : SELECTION_DIM_FILL;
}

function seriesLabel(config: ChartConfig, key: string): string {
  const label = config[key]?.label;
  return typeof label === "string" ? label : key;
}

function barStaggerDelay(type: ComposedAnimationType, index: number, count: number): number {
  if (type === "none" || count <= 0) return 0;
  const last = count - 1;
  const center = last / 2;
  let step: number;
  switch (type) {
    case "right-to-left":
      step = last - index;
      break;
    case "center-out":
      step = Math.abs(index - center);
      break;
    case "edges-in":
      step = center - Math.abs(index - center);
      break;
    default: 
      step = index;
  }
  return step * BAR_STAGGER;
}

function getLoadingData(points: number): number[] {
  const rows: number[] = [];
  let value = 30 + Math.random() * 20;
  for (let i = 0; i < points; i++) {
    value = Math.min(58, Math.max(16, value + (Math.random() - 0.5) * 16));
    rows.push(Math.round(value));
  }
  return rows;
}

function shimmerWindowStops(center: number, color: string, peak: number) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x: number) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return 0;

    return peak * Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
  };

  const offsets = [
    0,
    center - half,
    center - half + feather,
    center,
    center + half - feather,
    center + half,
    1,
  ]
    .filter((x) => x >= 0 && x <= 1)
    .sort((a, b) => a - b);

  const stops: { offset: number; color: string }[] = [];
  for (const offset of offsets) {
    if (stops.length === 0 || offset - stops[stops.length - 1].offset > 1e-4) {
      stops.push({ offset, color: withAlpha(color, alphaAt(offset)) });
    }
  }
  return stops;
}

type OptionBuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  bars: BarSeriesConfig[];
  lines: LineSeriesConfig[];
  seriesKeys: string[];
  curveType: CurveType;
  animationType: ComposedAnimationType; 
  barGap?: number | string;
  barCategoryGap?: number | string;
  selectedDataKey: string | null;
  showGrid: boolean;
  xAxisSlot: XAxisSlot;
  yAxisSlot: YAxisSlot;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  loadingData: () => number[]; 
  loadingLineData: () => number[]; 
  showBrush: boolean;
  brushHeight: number;
  resolved: ResolvedColors;
  categories: string[];
  brushRange: BrushRange; 
};

function buildChartLayout({ legendSlot, xAxisSlot, showBrush, brushHeight }: OptionBuildContext): {
  grid: GridComponentOption;
  brushBottom: number;
} {
  const legendTop = legendSlot.present && legendSlot.verticalAlign === "top";
  const legendBottom = legendSlot.present && legendSlot.verticalAlign === "bottom";

  const brushGap = showBrush ? brushHeight + 30 + (xAxisSlot.label ? 22 : 0) : 0;

  return {
    grid: {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: 8 + brushGap + (legendBottom ? 34 : 0),
    },
    brushBottom: legendBottom ? 34 : 6,
  };
}

function buildMainAxes(ctx: OptionBuildContext): { xAxis: XAxisOption; yAxis: YAxisOption } {
  const { xAxisSlot, yAxisSlot, showGrid, isLoading, bars, categories, loadingData } = ctx;
  const { tokens } = ctx.resolved;

  const axisLabelColor = tokens.mutedForeground;
  const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);

  const tickDotColor = flattenColor(splitLineColor, tokens.background);

  const hasBars = bars.length > 0 || isLoading;

  const xTickFormatter = xAxisSlot.tickFormatter;
  const yTickFormatter = yAxisSlot.tickFormatter;

  const xAxis: XAxisOption = {
    type: "category",
    boundaryGap: hasBars,
    show: true,
    data: isLoading ? loadingData().map((_, i) => i) : categories,

    name: isLoading ? undefined : xAxisSlot.label,
    nameLocation: "middle",
    nameGap: 30,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },

    axisTick: {
      show: !isLoading && xAxisSlot.present && !xAxisSlot.hideDots,
      length: 0.5,

      alignWithLabel: true,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && xAxisSlot.present,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: xTickFormatter
        ? (value: string, index: number) => xTickFormatter(value, index)
        : undefined,
    },
  };

  const yAxis: YAxisOption = {
    type: "value",
    show: yAxisSlot.present || showGrid,
    min: bars.length > 0 ? 0 : undefined,

    name: isLoading ? undefined : yAxisSlot.label,
    nameLocation: "middle",
    nameGap: 38,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },

    axisTick: {
      show: yAxisSlot.present && !isLoading && !yAxisSlot.hideDots,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: {

      show: showGrid && !isLoading,
      lineStyle: { color: splitLineColor, type: [3, 3] as [number, number], width: 1 },
    },
    axisLabel: {

      show: yAxisSlot.present && !isLoading,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: yTickFormatter
        ? (value: number, index: number) => yTickFormatter(value, index)
        : undefined,
    },
  };

  return { xAxis, yAxis };
}

function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot } = ctx;

  return (params: unknown): string => {
    const rows = Array.isArray(params) ? params : [params];
    if (!rows.length) return "";

    const first = rows[0] as { axisValue?: string | number; name?: string };

    const axisValue = first.axisValue ?? first.name ?? "";
    const label = String(axisValue);

    const body = rows
      .map((param) => {
        const p = param as {
          seriesId?: string;
          seriesName?: string;
          value?: number | string;
        };

        if (String(p.seriesId ?? "").startsWith("__")) return "";
        const key = p.seriesId ?? p.seriesName ?? "";
        const item = config[key];
        const colorsCount = item ? getColorsCount(item) : 1;
        const labelText = typeof item?.label === "string" ? item.label : (p.seriesName ?? key);
        const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";
        const value =
          typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");

        return tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
          labelText,
          valueText: value,
          dimmed,
        });
      })
      .join("");

    return tooltipShell({
      label,
      body,
      roundness: tooltipSlot.roundness,
      variant: tooltipSlot.variant,
    });
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  const { tokens } = ctx.resolved;

  return {
    ...tooltipBaseOption({
      present: tooltipSlot.present && !isLoading,
      cursor: tooltipSlot.cursor,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: withAlpha(tokens.border, AXIS_POINTER_OPACITY),
      strokeWidth: AXIS_POINTER_WIDTH,
    }),
    formatter: createTooltipFormatter(ctx),
  };
}

function buildBrushOption(
  ctx: OptionBuildContext,
  brushBottom: number,
): {
  miniGrid: GridComponentOption;
  miniXAxis: XAxisOption;
  miniYAxis: YAxisOption;
  miniSeries: LineSeriesOption[];
  dataZoom: DataZoomComponentOption[];
} {
  const { data, bars, lines, curveType, selectedDataKey, brushHeight, categories } = ctx;
  const { tokens } = ctx.resolved;

  const miniGrid: GridComponentOption = {
    left: 8,
    right: 8,
    bottom: brushBottom,
    height: brushHeight,

    outerBoundsMode: "none",
  };

  const miniXAxis: XAxisOption = {
    type: "category",
    gridIndex: 1,
    boundaryGap: false,
    show: false,
    data: categories,
    axisPointer: { show: false },
  };

  const miniYAxis: YAxisOption = { type: "value", gridIndex: 1, show: false };

  const miniInputs = [
    ...bars.map((bar) => ({ dataKey: bar.dataKey, curveType: undefined, connectNulls: false })),
    ...lines.map((line) => ({
      dataKey: line.dataKey,
      curveType: line.curveType,
      connectNulls: line.connectNulls,
    })),
  ];

  const miniSeries: LineSeriesOption[] = miniInputs.map((input) => {
    const key = input.dataKey;
    const base = (ctx.resolved.series[key] ?? [])[0] ?? "rgba(120, 120, 120, 1)";
    const curve = curveConfig(input.curveType ?? curveType);

    const dim = seriesDim(selectedDataKey, key);
    const fillDim = seriesFillDim(selectedDataKey, key);

    return {
      id: `__mini-${key}`,
      type: "line",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: data.map((row) => Number(row[key]) || 0),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: input.connectNulls,
      silent: true,
      showSymbol: false,
      emphasis: { disabled: true },
      tooltip: { show: false },
      lineStyle: { color: base, width: 1, opacity: BRUSH_STROKE_OPACITY * dim },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: withAlpha(base, BRUSH_FILL_OPACITY * fillDim) },
          { offset: 1, color: withAlpha(base, 0) },
        ]),
      },
      z: 0,
    };
  });

  const dataZoom = buildBrushDataZoom({
    brushBottom,
    brushHeight,
    brushRange: ctx.brushRange,
    fillerColor: withAlpha(tokens.foreground, BRUSH_FILLER_OPACITY),
  });

  return { miniGrid, miniXAxis, miniYAxis, miniSeries, dataZoom };
}

function buildLoadingOption(
  ctx: OptionBuildContext,
  frame: { grid: GridComponentOption; xAxis: XAxisOption; yAxis: YAxisOption },
): EChartsOption {
  const { tokens } = ctx.resolved;

  return {
    animation: false,
    grid: frame.grid,
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "bar",
        data: ctx.loadingData(),
        barCategoryGap: "30%",

        itemStyle: {
          color: withAlpha(tokens.foreground, 0),
          borderRadius: [DEFAULT_BAR_RADIUS, DEFAULT_BAR_RADIUS, 0, 0],
        },
        silent: true,
        z: 1,
      },
      {
        id: "__loading-line",
        type: "line",
        data: ctx.loadingLineData(),
        smooth: true,
        showSymbol: false,
        symbol: "none",

        lineStyle: { color: withAlpha(tokens.foreground, 0), width: LOADING_LINE_WIDTH },
        silent: true,
        z: 2,
      },
    ],
  };
}

function buildBarSeries(ctx: OptionBuildContext): BarSeriesOption[] {
  const { data, config, bars, animationType, selectedDataKey, resolved, barGap, barCategoryGap } =
    ctx;

  const hasSelection = selectedDataKey !== null;

  return bars.map((bar) => {
    const key = bar.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const base = slots[0];
    const multiColor = slots.length > 1;
    const fillDim = seriesFillDim(selectedDataKey, key);
    const values = data.map((row) => Number(row[key]) || 0);
    const barAnim = bar.animationType ?? animationType;

    const glowSeriesStyle =
      bar.glow && !multiColor
        ? { shadowBlur: BAR_GLOW_BLUR, shadowColor: withAlpha(base, BAR_GLOW_OPACITY) }
        : {};

    const dataPoints =
      bar.glow && multiColor
        ? values.map((value, i) => {
            const t = values.length > 1 ? i / (values.length - 1) : 0;
            return {
              value,
              itemStyle: {
                shadowBlur: BAR_GLOW_BLUR,
                shadowColor: withAlpha(sampleGradient(slots, t), BAR_GLOW_OPACITY),
              },
            };
          })
        : values;

    const series: BarSeriesOption = {
      id: key,
      name: seriesLabel(config, key),
      type: "bar",
      data: dataPoints,
      barGap,
      barCategoryGap,
      cursor: bar.isClickable ? "pointer" : "default",

      z: 2,
      itemStyle: {
        color: barFillPaint(bar.variant, slots),
        opacity: fillDim,

        borderRadius: bar.variant === "stripped" ? 0 : bar.radius,
        ...glowSeriesStyle,
      },

      animationDuration: BAR_GROW_DURATION,
      animationEasing: "cubicOut",
      animationDelay: (idx: number) => barStaggerDelay(barAnim, idx, data.length),

      emphasis:
        bar.enableHoverHighlight && !hasSelection
          ? { focus: "self", blurScope: "series" }
          : { focus: "none" },
      blur:
        bar.enableHoverHighlight && !hasSelection
          ? { itemStyle: { opacity: SELECTION_DIM_FILL } }
          : undefined,
    };

    return bar.barProps ? { ...series, ...bar.barProps } : series;
  });
}

function buildLineSeries(ctx: OptionBuildContext): LineSeriesOption[] {
  const { data, config, lines, curveType, selectedDataKey, resolved } = ctx;

  return lines.map((line) => {
    const key = line.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const paint = seriesPaint(slots);
    const dim = seriesDim(selectedDataKey, key);
    const curve = curveConfig(line.curveType ?? curveType);
    const values = data.map((row) => Number(row[key]) || 0);

    const restingDot = dotStyle(line.dotVariant, paint, resolved.tokens.background);
    const activeDot = dotStyle(line.activeDotVariant, paint, resolved.tokens.background);
    const restingVisible = line.dotVariant !== "none";
    const multiColor = slots.length > 1;

    const dataPoints = !multiColor
      ? values
      : values.map((value, i) => {
          const t = values.length > 1 ? i / (values.length - 1) : 0;
          const pointColor = sampleGradient(slots, t);
          return {
            value,
            itemStyle: {
              ...dotItemStyle(
                restingVisible ? line.dotVariant : line.activeDotVariant,
                pointColor,
                resolved.tokens.background,
              ),
              opacity: dim,
            },
            emphasis: {
              itemStyle: {
                ...dotItemStyle(
                  line.activeDotVariant === "none" ? "default" : line.activeDotVariant,
                  pointColor,
                  resolved.tokens.background,
                ),
                opacity: 1,
              },
            },
          };
        });

    const series: LineSeriesOption = {
      id: key,
      name: seriesLabel(config, key),
      type: "line",
      data: dataPoints,
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: line.connectNulls,
      cursor: line.isClickable ? "pointer" : "default",

      triggerEvent: line.isClickable,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z: 3,

      lineStyle: {
        color: paint,
        width: STROKE_WIDTH,
        opacity: dim,
        type: line.strokeVariant === "solid" ? "solid" : DASH_PATTERN,
        dashOffset: 0,
      },
      itemStyle: multiColor
        ? { opacity: dim }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dim,
          },
      emphasis: {
        focus: "none",
        scale: restingVisible ? activeDot.size / Math.max(restingDot.size, 1) : 1,
        ...(multiColor ? {} : { itemStyle: { ...activeDot.itemStyle, opacity: 1 } }),
      },
    };

    return line.lineProps ? { ...series, ...line.lineProps } : series;
  });
}

function buildLineGlowSeries(ctx: OptionBuildContext): LineSeriesOption[] {
  const { data, lines, curveType, selectedDataKey, resolved } = ctx;

  return lines
    .filter((line) => line.glow)
    .flatMap((line) => {
      const key = line.dataKey;
      const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
      const paint = seriesPaint(slots);
      const dim = seriesDim(selectedDataKey, key);
      const curve = curveConfig(line.curveType ?? curveType);
      const values = data.map((row) => Number(row[key]) || 0);

      return [...LINE_GLOW_LAYERS].reverse().map((layer, i) => ({
        id: `__glow-${key}-${i}`,
        type: "line" as const,
        data: values,
        smooth: curve.smooth,
        step: curve.step,
        connectNulls: line.connectNulls,
        silent: true,
        showSymbol: false,
        symbol: "none" as const,
        emphasis: { disabled: true },
        tooltip: { show: false },

        z: 2,
        lineStyle: {
          color: paint,
          width: layer.width,
          opacity: layer.opacity * dim,

          shadowBlur: layer.blur,
          shadowColor: sampleGradient(slots, 0.5),
          cap: "round" as const,
          join: "round" as const,
        },
      }));
    });
}

type LiveState = {
  resolved: ResolvedColors | null; 
  hasRevealed: boolean; 
  revealEndsAt: number; 
  loadingRows: number[] | null; 
  loadingLineRows: number[] | null; 
  categories: string[]; 
  dataLength: number; 
  brushRange: BrushRange; 
  brushGeom: BrushGeometry | null; 
  brushOverlay: BrushOverlayElements | null; 
  brushHover: { inside: boolean; left: boolean; right: boolean };

  handlers: {
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    onSelectionChange?: (key: string | null) => void;
    clickableKeys: Set<string>;
    selectedDataKey: string | null;
    brushFormatLabel?: (value: string, index: number) => string;
    seriesKeys: string[];
  };

  repush: () => void;
};

export function ComposedChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  className,
  curveType = "linear",
  animation = true,
  animationType = "left-to-right",
  barGap,
  barCategoryGap,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingBars = LOADING_DEFAULT_BARS,
  chartOptions,
  children,
}: ComposedChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    revealEndsAt: 0,
    loadingRows: null,
    loadingLineRows: null,
    categories: [],
    dataLength: 0,
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    handlers: {
      onBrushChange: undefined,
      onSelectionChange,
      clickableKeys: new Set<string>(),
      selectedDataKey: defaultSelectedDataKey,
      brushFormatLabel: undefined,
      seriesKeys: [],
    },
    repush: () => {},
  }).current;

  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingData(loadingBars)),
    [live, loadingBars],
  );
  const loadingLineData = useCallback(
    () => (live.loadingLineRows ??= getLoadingData(loadingBars)),
    [live, loadingBars],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    bars,
    lines,
    xAxis: xAxisSlot,
    yAxis: yAxisSlot,
    showGrid,
    tooltip: tooltipSlot,
    legend: legendSlot,
    brush: brushSlot,
  } = collected;

  const showBrush = brushSlot.present;
  const brushHeight = brushSlot.height ?? 56;

  const seriesKeys = useMemo(
    () => [...bars.map((bar) => bar.dataKey), ...lines.map((line) => line.dataKey)],
    [bars, lines],
  );

  const xCategoryKey = useMemo(() => {
    if (xAxisSlot.dataKey) return xAxisSlot.dataKey;
    if (xDataKey) return xDataKey as string;
    const firstRow = data[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [xAxisSlot.dataKey, xDataKey, data, seriesKeys]);

  const effectiveAnimation = bars[0]?.animationType ?? lines[0]?.animationType ?? animationType;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const clickableKeys = useMemo(
    () =>
      new Set([
        ...bars.filter((bar) => bar.isClickable).map((bar) => bar.dataKey),
        ...lines.filter((line) => line.isClickable).map((line) => line.dataKey),
      ]),
    [bars, lines],
  );

  live.handlers = {
    onBrushChange: brushSlot.onChange,
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    brushFormatLabel: brushSlot.formatLabel,
    seriesKeys,
  };
  live.dataLength = data.length;

  const toggleSelection = useCallback(
    (key: string) => {
      setSelectedDataKey((prev) => {
        const next = prev === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  const syncBrushOverlayNow = useCallback(() => {
    const chart = echartsRef.current;
    if (!chart) return;

    const geom = live.brushGeom;
    const tokens = live.resolved?.tokens;
    if (!geom || !tokens) {
      syncBrushOverlay(chart, live, null);
      return;
    }

    const range = live.brushRange;
    const categories = live.categories;
    const format = live.handlers.brushFormatLabel;
    const lastIndex = Math.max(categories.length - 1, 0);
    const startIndex = Math.round((range.start / 100) * lastIndex);
    const endIndex = Math.round((range.end / 100) * lastIndex);
    const labels =
      format && categories.length
        ? {
            start: format(categories[startIndex] ?? "", startIndex),
            end: format(categories[endIndex] ?? "", endIndex),
          }
        : null;

    syncBrushOverlay(chart, live, {
      range,
      geom,
      size: { width: chart.getWidth(), height: chart.getHeight() },
      tokens,
      labels,
      showLabels: live.brushHover.inside,
      hover: live.brushHover,
    });
  }, [live]);

  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[xCategoryKey]));
    live.categories = categories;

    const ctx: OptionBuildContext = {
      data,
      config,
      bars,
      lines,
      seriesKeys,
      curveType,
      animationType,
      barGap,
      barCategoryGap,
      selectedDataKey,
      showGrid,
      xAxisSlot,
      yAxisSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      loadingLineData,
      showBrush,
      brushHeight,
      resolved,
      categories,
      brushRange: live.brushRange,
    };

    const { grid, brushBottom } = buildChartLayout(ctx);
    live.brushGeom = showBrush ? { bottom: brushBottom, height: brushHeight } : null;

    const { xAxis, yAxis } = buildMainAxes(ctx);

    if (isLoading) return buildLoadingOption(ctx, { grid, xAxis, yAxis });

    const brush = showBrush ? buildBrushOption(ctx, brushBottom) : null;

    return {
      animation: false,
      grid: brush ? [grid, brush.miniGrid] : grid,
      xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
      yAxis: brush ? [yAxis, brush.miniYAxis] : yAxis,
      tooltip: buildTooltipOption(ctx),
      dataZoom: brush?.dataZoom,

      series: [
        ...buildBarSeries(ctx),
        ...buildLineSeries(ctx),
        ...buildLineGlowSeries(ctx),
        ...(brush?.miniSeries ?? []),
      ],
    };
  }, [
    live,
    data,
    config,
    bars,
    lines,
    seriesKeys,
    xCategoryKey,
    curveType,
    animationType,
    barGap,
    barCategoryGap,
    selectedDataKey,
    showGrid,
    xAxisSlot,
    yAxisSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    loadingLineData,
    showBrush,
    brushHeight,
  ]);

  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount);
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {

      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      live.repush();
    });
    resizeObserver.observe(mount);

    const themeObserver = new MutationObserver(() => {
      live.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      const { clickableKeys: clickable, seriesKeys: keys } = live.handlers;
      const p = params as { seriesId?: string; seriesIndex?: number };

      const id =
        p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    chart.on("datazoom", () => {
      const option = chart.getOption() as { dataZoom?: { start?: number; end?: number }[] };
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;

      live.brushRange = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      syncBrushOverlayNow();

      const { onBrushChange: onChange } = live.handlers;
      if (!onChange) return;
      const len = live.dataLength;
      const startIndex = Math.round(((zoom.start ?? 0) / 100) * (len - 1));
      const endIndex = Math.round(((zoom.end ?? 100) / 100) * (len - 1));
      onChange({ startIndex, endIndex });
    });

    const zr = chart.getZr();
    const applyHover = (next: { inside: boolean; left: boolean; right: boolean }) => {
      const prev = live.brushHover;
      if (prev.inside === next.inside && prev.left === next.left && prev.right === next.right) {
        return;
      }
      live.brushHover = next;
      syncBrushOverlayNow();
    };
    const onZrMove = (event: { offsetX?: number; offsetY?: number }) => {
      const geom = live.brushGeom;
      if (!geom) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      const top = chart.getHeight() - geom.bottom - geom.height;
      const inside = y >= top - 4 && y <= top + geom.height + 4;
      const trackLeft = 8;
      const trackWidth = Math.max(chart.getWidth() - 16, 1);
      const { start, end } = live.brushRange;
      const selectionLeft = trackLeft + (trackWidth * start) / 100;
      const selectionRight = trackLeft + (trackWidth * end) / 100;
      applyHover({
        inside,
        left: inside && Math.abs(x - selectionLeft) <= 8,
        right: inside && Math.abs(x - selectionRight) <= 8,
      });
    };
    const onZrOut = () => applyHover({ inside: false, left: false, right: false });
    zr.on("mousemove", onZrMove);
    zr.on("globalout", onZrOut);

    return () => {
      zr.off("mousemove", onZrMove);
      zr.off("globalout", onZrOut);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;

      live.brushOverlay = null;

      live.hasRevealed = false;
    };

  }, []);

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    live.resolved = resolveColors(container, config, seriesKeys);

    const push = (withEntrance: boolean) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationDurationUpdate: 0,
      });

      chart.setOption(merged as EChartsOption, { notMerge: true });

      syncBrushOverlayNow();
    };

    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
    if (revealEnabled) live.revealEndsAt = performance.now() + REVEAL_DURATION;
    push(revealEnabled);

    live.repush = () => {
      live.resolved = resolveColors(container, config, seriesKeys);
      push(false);
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    effectiveAnimation,
    shouldReduceMotion,
    config,
    seriesKeys,
    syncBrushOverlayNow,
  ]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading) return;
    const index = tooltipSlot.defaultIndex;
    if (!tooltipSlot.present || index == null) return;

    const delay = Math.max(0, live.revealEndsAt - performance.now());
    const timer = setTimeout(() => {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
    }, delay + 60);

    return () => {
      clearTimeout(timer);
      chart.dispatchAction({ type: "hideTip" });
    };
  }, [live, isLoading, tooltipSlot.present, tooltipSlot.defaultIndex]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading) return;
    const animatedKeys = lines
      .filter((line) => line.strokeVariant === "animated-dashed")
      .map((line) => line.dataKey);
    const hasSelection = selectedDataKey !== null;
    if (animatedKeys.length === 0 || hasSelection) return;

    let raf = 0;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    const begin = () => {
      const loopStart = performance.now();
      const tick = (now: number) => {

        const offset = -(((now - loopStart) / 1000) % 1) * DASH_PERIOD;
        chart.setOption(
          { series: animatedKeys.map((id) => ({ id, lineStyle: { dashOffset: offset } })) },
          { silent: true, lazyUpdate: true },
        );
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const delay = Math.max(0, live.revealEndsAt - performance.now());
    if (delay > 0) delayTimer = setTimeout(begin, delay + 50);
    else begin();

    return () => {
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [live, lines, selectedDataKey, isLoading]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      if (phase < lastPhase) {
        live.loadingRows = getLoadingData(loadingBars);
        live.loadingLineRows = getLoadingData(loadingBars);
      }
      lastPhase = phase;

      const foreground = live.resolved?.tokens.foreground ?? "rgba(120, 120, 120, 1)";
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const barClip = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_BAR_MAX_OPACITY),
        true,
      );
      const lineClip = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_LINE_MAX_OPACITY),
        true,
      );
      chart.setOption(
        {
          series: [
            { id: "__loading", data: loadingData(), itemStyle: { color: barClip } },
            { id: "__loading-line", data: loadingLineData(), lineStyle: { color: lineClip } },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, loadingBars, loadingData, loadingLineData]);

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top"
      ? { top: 12 }
      : legendSlot.verticalAlign === "bottom"
        ? { bottom: showBrush ? brushHeight + 16 : 12 }
        : { top: "50%", transform: "translateY(-50%)" }),
  };

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="relative min-h-0 w-full flex-1">
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={selectedDataKey}
          hoveredKey={null}
          isClickable={legendSlot.isClickable}
          onToggle={toggleSelection}
          style={legendStyle}
        />
      )}

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div className="border-border border-t-primary h-3 w-3 animate-spin rounded-full border" />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

ComposedChart.Bar = Bar;
ComposedChart.Line = Line;
ComposedChart.Dot = Dot;
ComposedChart.ActiveDot = ActiveDot;
ComposedChart.XAxis = XAxis;
ComposedChart.YAxis = YAxis;
ComposedChart.Grid = Grid;
ComposedChart.Tooltip = Tooltip;
ComposedChart.Legend = Legend;
ComposedChart.Brush = Brush;
