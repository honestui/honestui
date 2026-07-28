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
import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import {
  RadarComponent,
  TooltipComponent,
  type RadarComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { dotStyle, sampleGradient, type DotVariant } from "@/registry/default/ui/charts/dot";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import { RadarChart as RadarChartModule, type RadarSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type {
  ChartConfig,
  DotVariant,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

echarts.use([RadarChartModule, RadarComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

type EChartsOption = ComposeOption<
  RadarSeriesOption | RadarComponentOption | TooltipComponentOption
>;

type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type RadarOption = ArrayItem<NonNullable<EChartsOption["radar"]>>;

const STROKE_WIDTH = 1;
const DEFAULT_FILL_OPACITY = 0.3; 
const LOADING_ANIMATION_DURATION = 2000; 
const REVEAL_DURATION = 1000; 

const LOADING_DEFAULT_POINTS = 6; 

const GRID_LINE_OPACITY = 1; 

const LOADING_STROKE_OPACITY = 0.5; 
const LOADING_SHIMMER_MAX_OPACITY = 0.05; 
const LOADING_SHIMMER_BAND = 0.2; 
const LOADING_SHIMMER_FEATHER = 0.2; 

export type RadarVariant = "filled" | "lines";
export type GridType = "polygon" | "circle";

export interface RadarChartProps<TData extends Record<string, unknown>> {
  data: TData[]; 
  config: ChartConfig; 
  className?: string; 
  animation?: boolean; 
  defaultSelectedDataKey?: string | null; 
  onSelectionChange?: (key: string | null) => void; 
  isLoading?: boolean; 
  loadingPoints?: number; 
  chartOptions?: Record<string, unknown>; 
  children?: ReactNode; 
}

export interface RadarProps {
  dataKey: string; 
  variant?: RadarVariant; 
  fillOpacity?: number; 
  isClickable?: boolean; 
  children?: ReactNode; 
}

const Radar: FC<RadarProps> = () => null;

export interface DotProps {
  variant?: DotVariant; 
}

const Dot: FC<DotProps> = () => null;

const ActiveDot: FC<DotProps> = () => null;

export interface PolarGridProps {
  gridType?: GridType; 
}

const PolarGrid: FC<PolarGridProps> = () => null;

export interface PolarAngleAxisProps {
  dataKey?: string; 
}

const PolarAngleAxis: FC<PolarAngleAxisProps> = () => null;

const PolarRadiusAxis: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; 
  roundness?: TooltipRoundness; 
  position?: TooltipPosition; 

  defaultIndex?: number;
}

const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  variant?: LegendVariant; 
  align?: "left" | "center" | "right"; 
  verticalAlign?: "top" | "middle" | "bottom"; 
  isClickable?: boolean; 
}

const Legend: FC<LegendProps> = () => null;

type RadarSeriesConfig = {
  dataKey: string;
  variant: RadarVariant;
  fillOpacity: number;
  isClickable: boolean;
  dotVariant: DotVariant; 
  activeDotVariant: DotVariant; 
};

type PolarGridSlot = { present: boolean; gridType: GridType };
type PolarAngleAxisSlot = { present: boolean; dataKey?: string };
type PolarRadiusAxisSlot = { present: boolean };
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  position: TooltipPosition;
  defaultIndex?: number;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};

type CollectedConfig = {
  radars: RadarSeriesConfig[];
  grid: PolarGridSlot;
  angleAxis: PolarAngleAxisSlot;
  radiusAxis: PolarRadiusAxisSlot;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const radars: RadarSeriesConfig[] = [];
  let grid: PolarGridSlot = { present: false, gridType: "polygon" };
  let angleAxis: PolarAngleAxisSlot = { present: false };
  let radiusAxis: PolarRadiusAxisSlot = { present: false };
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

    if (type === Radar) {
      const props = child.props as RadarProps;
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
      radars.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "filled",
        fillOpacity: props.fillOpacity ?? DEFAULT_FILL_OPACITY,
        isClickable: props.isClickable ?? false,
        dotVariant,
        activeDotVariant,
      });
    } else if (type === PolarGrid) {
      const props = child.props as PolarGridProps;
      grid = { present: true, gridType: props.gridType ?? "polygon" };
    } else if (type === PolarAngleAxis) {
      const props = child.props as PolarAngleAxisProps;
      angleAxis = { present: true, dataKey: props.dataKey };
    } else if (type === PolarRadiusAxis) {
      radiusAxis = { present: true };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        defaultIndex: props.defaultIndex,
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

  return { radars, grid, angleAxis, radiusAxis, tooltip, legend };
}

const GRAY = "rgba(120, 120, 120, 1)";

function radarStrokePaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? GRAY;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 1, stops);
}

function radarFillPaint(slots: string[]): echarts.graphic.RadialGradient {
  if (slots.length <= 1) {
    const base = slots[0] ?? GRAY;
    return new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
      { offset: 0, color: withAlpha(base, 0.8) },
      { offset: 1, color: withAlpha(base, 0.3) },
    ]);
  }
  return new echarts.graphic.RadialGradient(
    0.5,
    0.5,
    0.5,
    slots.map((color, i) => ({
      offset: i / (slots.length - 1),
      color: withAlpha(color, i === 0 ? 0.8 : 0.3),
    })),
  );
}

function selectionOpacity(
  selected: string | null,
  key: string,
  isClickable: boolean,
): { fill: number; stroke: number; dot: number } {
  const isSelected = selected === null || selected === key;
  if (!isClickable || isSelected) return { fill: 1, stroke: 1, dot: 1 };
  return { fill: 0.1, stroke: 0.2, dot: 0.2 };
}

const LOADING_MAX = 100;
function getLoadingData(points: number): number[] {
  const rows: number[] = [];
  let value = 45 + Math.random() * 25;
  for (let i = 0; i < points; i++) {
    value = Math.min(90, Math.max(35, value + (Math.random() - 0.5) * 35));
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
  radars: RadarSeriesConfig[];
  seriesKeys: string[];
  selectedDataKey: string | null;
  hasSelection: boolean;
  gridSlot: PolarGridSlot;
  angleAxisSlot: PolarAngleAxisSlot;
  radiusAxisSlot: PolarRadiusAxisSlot;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  loadingData: () => number[];
  loadingPoints: number;
  resolved: ResolvedColors;
  categories: string[]; 
  indicatorMax: number; 
};

function radarCenterY(legendSlot: LegendSlot): string {
  if (!legendSlot.present) return "50%";
  if (legendSlot.verticalAlign === "bottom") return "46%";
  if (legendSlot.verticalAlign === "top") return "54%";
  return "50%";
}

function buildRadarComponent(ctx: OptionBuildContext): RadarOption {
  const { gridSlot, angleAxisSlot, radiusAxisSlot, isLoading, categories, indicatorMax } = ctx;
  const { tokens } = ctx.resolved;
  const gridColor = withAlpha(tokens.border, GRID_LINE_OPACITY);

  return {
    center: ["50%", radarCenterY(ctx.legendSlot)],
    radius: "68%",

    startAngle: 90,
    shape: gridSlot.gridType,
    splitNumber: 4,
    indicator: categories.map((name) => ({ name, max: indicatorMax })),

    axisName: {
      show: angleAxisSlot.present && !isLoading,
      color: tokens.mutedForeground,
      fontSize: 10,
    },

    axisLine: {
      show: gridSlot.present && !isLoading,
      lineStyle: { color: gridColor },
    },
    axisTick: { show: false },

    splitLine: {
      show: gridSlot.present && !isLoading,
      lineStyle: { color: gridColor, type: [3, 4] as [number, number] },
    },
    splitArea: { show: false },

    axisLabel: {
      show: radiusAxisSlot.present && !isLoading,
      color: tokens.mutedForeground,
      fontSize: 10,
      showMinLabel: false, 
    },
  };
}

function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot, categories } = ctx;

  return (params: unknown): string => {
    const param = (Array.isArray(params) ? params[0] : params) as {
      seriesId?: string;
      seriesName?: string;
      value?: number[];
    } | null;
    if (!param) return "";

    const key = param.seriesId ?? "";

    if (key.startsWith("__")) return "";

    const item = config[key];
    const colorsCount = item ? getColorsCount(item) : 1;
    const labelText = typeof item?.label === "string" ? item.label : (param.seriesName ?? key);
    const values = Array.isArray(param.value) ? param.value : [];
    const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";

    const body = categories
      .map((category, i) => {
        const raw = values[i];
        const value = typeof raw === "number" ? raw.toLocaleString() : String(raw ?? "");
        return tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
          labelText: category,
          valueText: value,
          dimmed: "",
        });
      })
      .join("");

    return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl${dimmed} ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}">
      <div class="font-medium">${labelText}</div>
      <div class="grid gap-1.5">${body}</div>
    </div>`;
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;

  return {
    show: tooltipSlot.present && !isLoading,

    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    position: resolveTooltipPosition(tooltipSlot.position),
    formatter: createTooltipFormatter(ctx),
  };
}

function buildRadarSeries(ctx: OptionBuildContext): RadarSeriesOption[] {
  const { data, config, radars, selectedDataKey, hasSelection, categories, resolved } = ctx;

  return radars.map((radar) => {
    const key = radar.dataKey;
    const slots = resolved.series[key] ?? [GRAY];
    const strokePaint = radarStrokePaint(slots);

    const dotColor = sampleGradient(slots, 0.5);
    const isSelected = selectedDataKey === null || selectedDataKey === key;
    const opacity = selectionOpacity(selectedDataKey, key, radar.isClickable);
    const isFilled = radar.variant === "filled";

    const restingVisible = radar.dotVariant !== "none";
    const activeVisible = radar.activeDotVariant !== "none";
    const restingDot = dotStyle(radar.dotVariant, dotColor, resolved.tokens.background);

    const activeDot = dotStyle(
      radar.activeDotVariant === "none" ? "default" : radar.activeDotVariant,
      dotColor,
      resolved.tokens.background,
    );

    const value = categories.map((_, i) => Number(data[i]?.[key]) || 0);

    const symbol = restingVisible || activeVisible ? "circle" : "none";

    return {
      id: key,
      name: typeof config[key]?.label === "string" ? (config[key]?.label as string) : key,
      type: "radar",
      radarIndex: 0,
      data: [{ value }],
      symbol,
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      cursor: radar.isClickable ? "pointer" : "default",

      z: isSelected ? 3 : hasSelection ? 1 : 2,
      lineStyle: { color: strokePaint, width: STROKE_WIDTH, opacity: opacity.stroke },
      areaStyle: isFilled
        ? { color: radarFillPaint(slots), opacity: radar.fillOpacity * opacity.fill }
        : undefined,

      itemStyle: restingVisible
        ? { ...restingDot.itemStyle, opacity: opacity.dot }
        : { ...activeDot.itemStyle, opacity: 0 },

      emphasis: hasSelection
        ? { disabled: true }
        : {

            itemStyle: { ...activeDot.itemStyle, opacity: 1 },
            lineStyle: { color: strokePaint, width: STROKE_WIDTH, opacity: opacity.stroke },
            ...(isFilled
              ? {
                  areaStyle: {
                    color: radarFillPaint(slots),
                    opacity: radar.fillOpacity * opacity.fill,
                  },
                }
              : {}),
          },
    };
  });
}

function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { tokens } = ctx.resolved;
  const points = ctx.loadingPoints;

  return {
    animation: false,
    radar: {
      center: ["50%", radarCenterY(ctx.legendSlot)],
      radius: "68%",
      startAngle: 90,
      shape: ctx.gridSlot.gridType,
      splitNumber: 4,
      indicator: Array.from({ length: points }, (_, i) => ({ name: `${i}`, max: LOADING_MAX })),
      axisName: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      splitArea: { show: false },
      axisLabel: { show: false },
    },
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "radar",
        radarIndex: 0,
        silent: true,
        symbol: "none",
        data: [{ value: ctx.loadingData() }],

        lineStyle: { color: withAlpha(tokens.foreground, 0), width: 2 },
        areaStyle: { color: withAlpha(tokens.foreground, 0) },
        z: 1,
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null; 
  hasRevealed: boolean; 
  revealRaf: number; 
  loadingRows: number[] | null; 
  categories: string[]; 

  handlers: {
    onSelectionChange?: (key: string | null) => void;
    clickableKeys: Set<string>;
    selectedDataKey: string | null;
    seriesKeys: string[];
  };

  repush: () => void;
};

export function RadarChart<TData extends Record<string, unknown>>({
  data,
  config,
  className,
  animation = true,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints = LOADING_DEFAULT_POINTS,
  chartOptions,
  children,
}: RadarChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    revealRaf: 0,
    loadingRows: null,
    categories: [],
    handlers: {
      onSelectionChange,
      clickableKeys: new Set<string>(),
      selectedDataKey: defaultSelectedDataKey,
      seriesKeys: [],
    },
    repush: () => {},
  }).current;

  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingData(loadingPoints)),
    [live, loadingPoints],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    radars,
    grid: gridSlot,
    angleAxis: angleAxisSlot,
    radiusAxis: radiusAxisSlot,
    tooltip: tooltipSlot,
    legend: legendSlot,
  } = collected;

  const seriesKeys = useMemo(() => radars.map((radar) => radar.dataKey), [radars]);

  const angleKey = useMemo(() => {
    if (angleAxisSlot.dataKey) return angleAxisSlot.dataKey;
    const firstRow = data[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [angleAxisSlot.dataKey, data, seriesKeys]);

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const hasSelection = selectedDataKey !== null;

  const clickableKeys = useMemo(
    () => new Set(radars.filter((radar) => radar.isClickable).map((radar) => radar.dataKey)),
    [radars],
  );

  live.handlers = {
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    seriesKeys,
  };

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

  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[angleKey]));
    live.categories = categories;

    let indicatorMax = 0;
    for (const key of seriesKeys) {
      for (const row of data) indicatorMax = Math.max(indicatorMax, Number(row[key]) || 0);
    }
    indicatorMax = indicatorMax || 1;

    const ctx: OptionBuildContext = {
      data,
      config,
      radars,
      seriesKeys,
      selectedDataKey,
      hasSelection,
      gridSlot,
      angleAxisSlot,
      radiusAxisSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      loadingPoints,
      resolved,
      categories,
      indicatorMax,
    };

    if (isLoading) return buildLoadingOption(ctx);

    return {
      animation: false,
      radar: buildRadarComponent(ctx),
      tooltip: buildTooltipOption(ctx),

      series: buildRadarSeries(ctx),
    };
  }, [
    live,
    data,
    config,
    radars,
    seriesKeys,
    angleKey,
    selectedDataKey,
    hasSelection,
    gridSlot,
    angleAxisSlot,
    radiusAxisSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    loadingPoints,
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

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (live.revealRaf) {
        cancelAnimationFrame(live.revealRaf);
        live.revealRaf = 0;
      }
      chart.dispose();
      echartsRef.current = null;

      live.hasRevealed = false;
    };

  }, []);

  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    live.resolved = resolveColors(container, config, seriesKeys);

    type RevealSeries = { id?: string; data?: { value?: number[] }[] };

    const cancelReveal = () => {
      if (live.revealRaf) {
        cancelAnimationFrame(live.revealRaf);
        live.revealRaf = 0;
      }
    };

    const buildMerged = (): EChartsOption => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;

      Object.assign(merged, { animation: false, animationDurationUpdate: 0 });

      return merged as EChartsOption;
    };

    const pushStatic = () => {
      cancelReveal();
      chart.setOption(buildMerged(), { notMerge: true });
    };

    const pushReveal = () => {
      cancelReveal();
      const merged = buildMerged();
      const series = (merged.series as unknown as RevealSeries[] | undefined) ?? [];
      const finals = series.map((s) => s.data?.[0]?.value ?? []);

      chart.setOption(
        {
          ...merged,
          series: series.map((s, i) => ({ ...s, data: [{ value: finals[i].map(() => 0) }] })),
        } as EChartsOption,
        { notMerge: true },
      );

      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min((now - start) / REVEAL_DURATION, 1);
        const eased = 1 - Math.pow(1 - t, 3); 
        chart.setOption(
          {
            series: series.map((s, i) => ({
              id: s.id,
              data: [{ value: finals[i].map((v) => v * eased) }],
            })),
          },
          { silent: true, lazyUpdate: true },
        );
        live.revealRaf = t < 1 ? requestAnimationFrame(frame) : 0;
      };
      live.revealRaf = requestAnimationFrame(frame);
    };

    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled = animation && shouldReveal && !shouldReduceMotion;
    if (revealEnabled) pushReveal();
    else pushStatic();

    if (
      !isLoading &&
      tooltipSlot.present &&
      tooltipSlot.defaultIndex != null &&
      seriesKeys.length
    ) {
      const idx = Math.min(Math.max(tooltipSlot.defaultIndex, 0), seriesKeys.length - 1);
      chart.dispatchAction({ type: "showTip", seriesIndex: idx, dataIndex: 0 });
    }

    live.repush = () => {
      live.resolved = resolveColors(container, config, seriesKeys);
      pushStatic();
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    shouldReduceMotion,
    config,
    seriesKeys,
    tooltipSlot.present,
    tooltipSlot.defaultIndex,
  ]);

  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      if (phase < lastPhase) live.loadingRows = getLoadingData(loadingPoints);
      lastPhase = phase;

      const foreground = live.resolved?.tokens.foreground ?? GRAY;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = (peak: number) =>
        new echarts.graphic.LinearGradient(
          0,
          0,
          w,
          w,
          shimmerWindowStops(center, foreground, peak),
          true,
        );
      chart.setOption(
        {
          series: [
            {
              id: "__loading",
              data: [{ value: loadingData() }],
              lineStyle: { color: clip(LOADING_STROKE_OPACITY), width: 2 },
              areaStyle: { color: clip(LOADING_SHIMMER_MAX_OPACITY) },
            },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, loadingPoints, loadingData]);

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top"
      ? { top: 12 }
      : legendSlot.verticalAlign === "bottom"
        ? { bottom: 12 }
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

RadarChart.Radar = Radar;
RadarChart.Dot = Dot;
RadarChart.ActiveDot = ActiveDot;
RadarChart.PolarGrid = PolarGrid;
RadarChart.PolarAngleAxis = PolarAngleAxis;
RadarChart.PolarRadiusAxis = PolarRadiusAxis;
RadarChart.Tooltip = Tooltip;
RadarChart.Legend = Legend;
