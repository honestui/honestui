"use client";

import {
  resolveTooltipPosition,
  roundnessClass,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipVariantClass,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/default/ui/charts/tooltip";
import {
  buildChartCss,
  getColorsCount,
  resolveColors,
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
  type FC,
  type ReactNode,
} from "react";
import {
  PolarComponent,
  TooltipComponent,
  type PolarComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { LegendIndicator, type LegendVariant } from "@/registry/default/ui/charts/legend";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, LegendVariant, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([BarChart, PolarComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

type EChartsOption = ComposeOption<BarSeriesOption | TooltipComponentOption | PolarComponentOption>;

type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type PolarOption = ArrayItem<NonNullable<EChartsOption["polar"]>>;
type AngleAxisOption = ArrayItem<NonNullable<EChartsOption["angleAxis"]>>;
type RadiusAxisOption = ArrayItem<NonNullable<EChartsOption["radiusAxis"]>>;

type BarItemStyle = {
  color?: string | echarts.graphic.LinearGradient;
  opacity?: number;
};

const DEFAULT_INNER_RADIUS = "30%";
const DEFAULT_OUTER_RADIUS = "100%";
const DEFAULT_CORNER_RADIUS = 5;
const DEFAULT_BAR_SIZE = 14;
const LOADING_BARS = 5; 
const LOADING_MAX = 100; 
const LOADING_ANIMATION_DURATION = 2000; 
const REVEAL_DURATION = 1000; 

const TRACK_OPACITY = 0.15; 
const SELECTED_DIM_OPACITY = 0.15; 

const LOADING_SHIMMER_MAX_OPACITY = 0.4; 
const LOADING_SHIMMER_BAND = 0.2; 
const LOADING_SHIMMER_FEATHER = 0.2; 

const MAIN_SERIES_ID = "radial-bars";
const TRACK_SERIES_ID = "__track";

const TRACK_POLAR_INDEX = 1;
const LOADING_SERIES_ID = "__loading";
const LOADING_TRACK_ID = "__loading-track";

const FALLBACK_COLOR = "rgba(120, 120, 120, 1)";

export type RadialVariant = "full" | "semi";

export interface RadialChartProps<TData extends Record<string, unknown>> {
  data: TData[]; 
  config: ChartConfig; 
  nameKey: keyof TData & string; 
  className?: string; 
  variant?: RadialVariant; 

  max?: number;
  innerRadius?: number | string; 
  outerRadius?: number | string; 
  defaultSelectedDataKey?: string | null; 
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; 
  isLoading?: boolean; 
  backgroundVariant?: BackgroundVariant; 
  chartOptions?: Record<string, unknown>; 
  children?: ReactNode; 
}

export interface RadialBarProps {
  dataKey: string; 
  cornerRadius?: number; 
  barSize?: number; 
  showBackground?: boolean; 
  isClickable?: boolean; 
}

const RadialBar: FC<RadialBarProps> = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; 
  roundness?: TooltipRoundness; 
  defaultIndex?: number; 
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

type RadialBarSlot = {
  present: boolean;
  dataKey: string;
  cornerRadius: number;
  barSize: number;
  showBackground: boolean;
  isClickable: boolean;
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  defaultIndex?: number;
  position: TooltipPosition;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};

type CollectedConfig = {
  radialBar: RadialBarSlot;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {

  let radialBar: RadialBarSlot = {
    present: false,
    dataKey: "",
    cornerRadius: DEFAULT_CORNER_RADIUS,
    barSize: DEFAULT_BAR_SIZE,
    showBackground: true,
    isClickable: false,
  };
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    variant: "rounded-square",
    align: "center",
    verticalAlign: "bottom",
    isClickable: false,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === RadialBar) {
      const props = child.props as RadialBarProps;
      radialBar = {
        present: true,
        dataKey: props.dataKey,
        cornerRadius: props.cornerRadius ?? DEFAULT_CORNER_RADIUS,
        barSize: props.barSize ?? DEFAULT_BAR_SIZE,
        showBackground: props.showBackground ?? true,
        isClickable: props.isClickable ?? false,
      };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        defaultIndex: props.defaultIndex,
        position: props.position ?? "variable",
      };
    } else if (type === Legend) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
        isClickable: props.isClickable ?? false,
      };
    }
  });

  return { radialBar, tooltip, legend };
}

function barPaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? FALLBACK_COLOR;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 1, stops);
}

function getVariantGeometry(variant: RadialVariant): {
  center: [string, string];
  startAngle: number;
  endAngle: number;
} {
  switch (variant) {
    case "semi":
      return { center: ["50%", "70%"], startAngle: 180, endAngle: 0 };
    case "full":
    default:
      return { center: ["50%", "50%"], startAngle: 90, endAngle: -270 };
  }
}

function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const rough = value / 5;
  const power = Math.floor(Math.log10(rough));
  const base = Math.pow(10, power);
  const fraction = rough / base;
  const niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  const interval = niceFraction * base;
  return Math.ceil(value / interval) * interval;
}

function getLoadingData(count: number): number[] {
  const rows: number[] = [];
  let value = 55 + Math.random() * 30;
  for (let i = 0; i < count; i++) {
    value = Math.min(LOADING_MAX, Math.max(40, value + (Math.random() - 0.5) * 30));
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

export type BackgroundVariant =
  | "dots"
  | "grid"
  | "cross-hatch"
  | "diagonal-lines"
  | "plus"
  | "falling-triangles"
  | "4-pointed-star"
  | "tiny-checkers"
  | "overlapping-circles"
  | "wiggle-lines"
  | "bubbles";

type PatternProps = { id: string };

const BACKGROUND_PATTERNS: Record<BackgroundVariant, FC<PatternProps>> = {
  dots: ({ id }) => (
    <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle className="text-border" cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
  ),
  grid: ({ id }) => (
    <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        d="M 20 0 L 0 0 0 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  ),
  "cross-hatch": ({ id }) => (
    <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path
        className="text-border/60 dark:text-border/50"
        d="M 0 0 L 20 20 M 20 0 L 0 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  ),
  "diagonal-lines": ({ id }) => (
    <pattern
      id={id}
      x="0"
      y="0"
      width="6"
      height="6"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <line
        className="text-border"
        x1="0"
        y1="0"
        x2="0"
        y2="6"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  ),
  plus: ({ id }) => (
    <pattern id={id} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        d="M 8 4 L 8 12 M 4 8 L 12 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </pattern>
  ),
  "falling-triangles": ({ id }) => (
    <pattern id={id} x="0" y="0" width="18" height="36" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        d="M2 6h12L8 18 2 6zm18 36h12l-6 12-6-12z"
        transform="scale(0.5)"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  "4-pointed-star": ({ id }) => (
    <pattern id={id} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <polygon
        className="text-border"
        fillRule="evenodd"
        points="5 3 8 4 5 5 4 8 3 5 0 4 3 3 4 0 5 3"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  "tiny-checkers": ({ id }) => (
    <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        fillRule="evenodd"
        d="M0 0h4v4H0V0zm4 4h4v4H4V4z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </pattern>
  ),
  "overlapping-circles": ({ id }) => (
    <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        fillRule="evenodd"
        d="M25 25c0-2.762 2.238-5 5-5s5 2.238 5 5-2.238 5-5 5c0 2.762-2.238 5-5 5s-5-2.238-5-5 2.238-5 5-5zM5 5c0-2.762 2.238-5 5-5s5 2.238 5 5-2.238 5-5 5c0 2.762-2.238 5-5 5S0 12.762 0 10s2.238-5 5-5zm5 4c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4zm20 20c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  "wiggle-lines": ({ id }) => (
    <pattern
      id={id}
      x="0"
      y="0"
      width="52"
      height="26"
      patternUnits="userSpaceOnUse"
      patternTransform="scale(0.6)"
    >
      <path
        className="text-border"
        d="M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  bubbles: ({ id }) => (
    <pattern
      id={id}
      x="0"
      y="0"
      width="100"
      height="100"
      patternUnits="userSpaceOnUse"
      patternTransform="scale(0.6667)"
    >
      <path
        className="text-border"
        d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z"
        fill="currentColor"
        fillOpacity="0.4"
        fillRule="evenodd"
      />
    </pattern>
  ),
};

function ChartBackground({ variant }: { variant: BackgroundVariant }) {
  const baseId = useId().replace(/:/g, "");
  const patternId = `${baseId}-bg-${variant}`;
  const maskId = `${baseId}-bg-edge-fade`;
  const filterId = `${baseId}-bg-blur`;
  const Pattern = BACKGROUND_PATTERNS[variant];

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <Pattern id={patternId} />

        <filter id={filterId}>
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="8%" y="20%" width="85%" height="60%" fill="white" filter={`url(#${filterId})`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} mask={`url(#${maskId})`} />
    </svg>
  );
}

type OptionBuildContext = {
  categories: string[]; 
  values: number[]; 
  config: ChartConfig;
  radialBar: RadialBarSlot;
  variant: RadialVariant;
  innerRadius: number | string;
  outerRadius: number | string;
  angleMax: number;
  selectedBar: string | null;
  hasSelection: boolean;
  tooltipSlot: TooltipSlot;
  isLoading: boolean;
  loadingData: () => number[];
  resolved: ResolvedColors;
};

function buildPolar(ctx: OptionBuildContext): PolarOption[] {
  const geom = getVariantGeometry(ctx.variant);
  const polar: PolarOption = {
    center: geom.center,
    radius: [ctx.innerRadius, ctx.outerRadius] as (number | string)[],
  };
  return [polar, { ...polar }];
}

function buildAngleAxis(ctx: OptionBuildContext): AngleAxisOption[] {
  const geom = getVariantGeometry(ctx.variant);
  const axis: AngleAxisOption = {
    type: "value",
    min: 0,
    max: ctx.angleMax,
    startAngle: geom.startAngle,
    endAngle: geom.endAngle,
    clockwise: true,
    show: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false },
  };

  return [
    { ...axis, polarIndex: 0 },
    { ...axis, polarIndex: TRACK_POLAR_INDEX },
  ];
}

function buildRadiusAxis(ctx: OptionBuildContext): RadiusAxisOption[] {
  const axis: RadiusAxisOption = {
    type: "category",
    data: ctx.categories,
    show: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false },
  };

  return [
    { ...axis, polarIndex: 0 },
    { ...axis, polarIndex: TRACK_POLAR_INDEX },
  ];
}

function buildTrackSeries(ctx: OptionBuildContext, loading: boolean): BarSeriesOption {
  const { radialBar } = ctx;
  const trackColor = withAlpha(ctx.resolved.tokens.mutedForeground, TRACK_OPACITY);
  return {
    id: loading ? LOADING_TRACK_ID : TRACK_SERIES_ID,
    type: "bar",
    coordinateSystem: "polar",
    polarIndex: TRACK_POLAR_INDEX,
    data: ctx.categories.map(() => ctx.angleMax),
    barWidth: radialBar.barSize,
    roundCap: radialBar.cornerRadius > 0,
    silent: true,

    animation: false,
    emphasis: { disabled: true },
    itemStyle: { color: trackColor },
    z: 1,
  };
}

function buildBarSeries(ctx: OptionBuildContext): BarSeriesOption[] {
  const { categories, values, radialBar, selectedBar, hasSelection, resolved } = ctx;

  const data = categories.map((name, i) => {
    const slots = resolved.series[name] ?? [FALLBACK_COLOR];
    const isSelected = selectedBar === null || selectedBar === name;

    const dimmed = radialBar.isClickable && hasSelection && !isSelected;

    const itemStyle: BarItemStyle = {
      color: barPaint(slots),
      opacity: dimmed ? SELECTED_DIM_OPACITY : 1,
    };

    return { value: values[i] ?? 0, itemStyle };
  });

  const main: BarSeriesOption = {
    id: MAIN_SERIES_ID,
    type: "bar",
    coordinateSystem: "polar",

    polarIndex: 0,
    data,
    barWidth: radialBar.barSize,
    roundCap: radialBar.cornerRadius > 0,
    cursor: radialBar.isClickable ? "pointer" : "default",

    emphasis: { disabled: true },
    z: 3, 
  };

  return [main, ...(radialBar.showBackground ? [buildTrackSeries(ctx, false)] : [])];
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, config, categories, isLoading } = ctx;

  const formatter = (params: unknown): string => {
    const p = (Array.isArray(params) ? params[0] : params) as {
      dataIndex?: number;
      value?: number | string;
      seriesId?: string;
    };
    if (p == null || String(p.seriesId ?? "").startsWith("__")) return "";

    const index = typeof p.dataIndex === "number" ? p.dataIndex : 0;
    const key = categories[index] ?? "";
    const item = config[key];
    const colorsCount = item ? getColorsCount(item) : 1;
    const labelText = typeof item?.label === "string" ? item.label : key;
    const value = typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");

    const row = tooltipRow({
      indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
      labelText,
      valueText: value,
      dimmed: "",
    });

    return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}">
      <div class="grid gap-1.5">${row}</div>
    </div>`;
  };

  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",

    position: resolveTooltipPosition(tooltipSlot.position),
    formatter,
  };
}

function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { tokens } = ctx.resolved;
  const loadingCats = Array.from({ length: LOADING_BARS }, (_, i) => String(i));
  const loadingCtx: OptionBuildContext = {
    ...ctx,
    categories: loadingCats,
    angleMax: LOADING_MAX,
  };

  return {
    animation: false,
    polar: buildPolar(loadingCtx),
    angleAxis: buildAngleAxis(loadingCtx),
    radiusAxis: buildRadiusAxis(loadingCtx),
    tooltip: { show: false },
    series: [
      buildTrackSeries(loadingCtx, true),
      {
        id: LOADING_SERIES_ID,
        type: "bar",
        coordinateSystem: "polar",
        polarIndex: 0,
        data: ctx.loadingData(),
        barWidth: loadingCtx.radialBar.barSize,
        roundCap: loadingCtx.radialBar.cornerRadius > 0,
        silent: true,
        emphasis: { disabled: true },

        itemStyle: { color: withAlpha(tokens.foreground, 0) },
        z: 2,
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null; 
  hasRevealed: boolean; 
  loadingRows: number[] | null; 
  categories: string[]; 
  valueByName: Map<string, number>; 
  handlers: { clickable: boolean }; 

  repush: () => void;
};

export function RadialChart<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  className,
  variant = "full",
  max,
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  backgroundVariant,
  chartOptions,
  children,
}: RadialChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    loadingRows: null,
    categories: [],
    valueByName: new Map<string, number>(),
    handlers: { clickable: false },
    repush: () => {},
  }).current;

  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingData(LOADING_BARS)),
    [live],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedBar, setSelectedBar] = useState<string | null>(defaultSelectedDataKey);

  const collected = useMemo(() => collectConfig(children), [children]);
  const { radialBar, tooltip: tooltipSlot, legend: legendSlot } = collected;

  const configKeys = useMemo(() => Object.keys(config), [config]);

  const categories = useMemo(() => data.map((row) => String(row[nameKey])), [data, nameKey]);
  const values = useMemo(
    () => data.map((row) => Number(row[radialBar.dataKey]) || 0),
    [data, radialBar.dataKey],
  );

  const angleMax = useMemo(
    () => (max != null && max > 0 ? max : niceCeil(Math.max(0, ...values))),
    [max, values],
  );

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const hasSelection = selectedBar !== null;

  live.categories = categories;
  live.handlers = { clickable: radialBar.isClickable };
  live.valueByName = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((name, i) => map.set(name, values[i] ?? 0));
    return map;
  }, [categories, values]);

  const toggleSelection = useCallback(
    (name: string) => {
      setSelectedBar((prev) => {
        const next = prev === name ? null : name;
        onSelectionChange?.(
          next === null ? null : { dataKey: next, value: live.valueByName.get(next) ?? 0 },
        );
        return next;
      });
    },
    [onSelectionChange, live],
  );

  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const ctx: OptionBuildContext = {
      categories,
      values,
      config,
      radialBar,
      variant,
      innerRadius,
      outerRadius,
      angleMax,
      selectedBar,
      hasSelection,
      tooltipSlot,
      isLoading,
      loadingData,
      resolved,
    };

    if (isLoading) return buildLoadingOption(ctx);

    return {
      animation: false,
      polar: buildPolar(ctx),
      angleAxis: buildAngleAxis(ctx),
      radiusAxis: buildRadiusAxis(ctx),
      tooltip: buildTooltipOption(ctx),
      series: buildBarSeries(ctx),
    };
  }, [
    live,
    categories,
    values,
    config,
    radialBar,
    variant,
    innerRadius,
    outerRadius,
    angleMax,
    selectedBar,
    hasSelection,
    tooltipSlot,
    isLoading,
    loadingData,
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

    const themeObserver = new MutationObserver(() => live.repush());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      if (!live.handlers.clickable) return;
      const p = params as { seriesId?: string; dataIndex?: number; componentType?: string };

      if (p.componentType !== "series" || p.seriesId !== MAIN_SERIES_ID) return;
      if (typeof p.dataIndex !== "number") return;
      const name = live.categories[p.dataIndex];
      if (name != null) toggleSelection(name);
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;

      live.hasRevealed = false;
    };

  }, []);

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    live.resolved = resolveColors(container, config, configKeys);

    const push = (withEntrance: boolean) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationDurationUpdate: 0,
      });

      chart.setOption(merged as EChartsOption, { notMerge: true });

      if (!isLoading && tooltipSlot.present && tooltipSlot.defaultIndex != null) {
        chart.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: tooltipSlot.defaultIndex,
        });
      }
    };

    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled = shouldReveal && !shouldReduceMotion;
    push(revealEnabled);

    live.repush = () => {
      live.resolved = resolveColors(container, config, configKeys);
      push(false);
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    shouldReduceMotion,
    config,
    configKeys,
    tooltipSlot,
  ]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      if (phase < lastPhase) live.loadingRows = getLoadingData(LOADING_BARS);
      lastPhase = phase;

      const foreground = live.resolved?.tokens.foreground ?? FALLBACK_COLOR;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_SHIMMER_MAX_OPACITY),
        true,
      );
      chart.setOption(
        { series: [{ id: LOADING_SERIES_ID, data: loadingData(), itemStyle: { color: clip } }] },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, loadingData]);

  const legendJustify =
    legendSlot.align === "left"
      ? "justify-start"
      : legendSlot.align === "center"
        ? "justify-center"
        : "justify-end";

  const renderLegend = (overlay: boolean) => (
    <div
      className={`flex flex-wrap items-center gap-3 px-4 select-none ${legendJustify} ${
        overlay ? "pointer-events-auto absolute inset-x-4 top-1/2 -translate-y-1/2" : "py-2"
      }`}
    >
      {categories.map((name) => {
        const item = config[name];
        const colorsCount = item ? getColorsCount(item) : 1;
        const isActive = selectedBar === null || selectedBar === name;
        return (
          <div
            key={name}
            className={`flex items-center gap-1.5 transition-opacity ${
              !isActive ? "opacity-30" : ""
            } ${legendSlot.isClickable ? "cursor-pointer" : ""}`}
            onClick={() => {
              if (legendSlot.isClickable) toggleSelection(name);
            }}
          >
            <LegendIndicator
              variant={legendSlot.variant}
              dataKey={name}
              colorsCount={colorsCount}
            />
            {item?.label ?? name}
          </div>
        );
      })}
    </div>
  );

  const showLegend = legendSlot.present && !isLoading;
  const legendTop = showLegend && legendSlot.verticalAlign === "top";
  const legendBottom = showLegend && legendSlot.verticalAlign === "bottom";
  const legendMiddle = showLegend && legendSlot.verticalAlign === "middle";

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {legendTop && renderLegend(false)}

      <div className="relative min-h-0 w-full flex-1">
        {backgroundVariant && <ChartBackground variant={backgroundVariant} />}

        <div ref={mountRef} className="relative z-10 h-full min-h-0 w-full" />
        {legendMiddle && renderLegend(true)}
      </div>

      {legendBottom && renderLegend(false)}

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

RadialChart.RadialBar = RadialBar;
RadialChart.Tooltip = Tooltip;
RadialChart.Legend = Legend;
