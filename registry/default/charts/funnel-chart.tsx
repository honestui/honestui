"use client";

import {
  resolveTooltipPosition,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
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
  withChartFont,
} from "@/registry/default/ui/charts/chart";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type FC,
  type ReactNode,
} from "react";
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import {
  BarChart as BarChartModule,
  FunnelChart as FunnelChartModule,
  type BarSeriesOption,
  type FunnelSeriesOption,
} from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([BarChartModule, FunnelChartModule, GridComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  BarSeriesOption | FunnelSeriesOption | GridComponentOption | TooltipComponentOption
>;

const GRAY = "rgba(120, 120, 120, 1)";
const DEFAULT_RADIUS = 2;
// The drop-off ghost is a tint of the stage colour, light enough to read as
// "lost" next to the solid bar without becoming a second series.
const DROP_OFF_ALPHA = 0.16;
// Room a drop-off label needs inside its ghost: its height on columns, its
// width on rows.
const MIN_DROP_OFF_LABEL_PX = { vertical: 18, horizontal: 40 };

export type FunnelVariant = "stepped" | "tapered";
export type FunnelLayout = "vertical" | "horizontal";
export type FunnelCalculateFrom = "first" | "previous";

export type FunnelStage<TData extends Record<string, unknown>> = {
  name: string;
  value: number;
  /** Share of the first stage, from 0 to 1. */
  fromFirst: number;
  /** Share of the previous stage, from 0 to 1. The first stage is 1. */
  fromPrevious: number;
  /** People or items lost since the previous stage. */
  dropOff: number;
  datum: TData;
  index: number;
};

export interface FunnelChartProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  /** The field holding each stage's name. Stages render in data order. */
  nameKey: keyof TData & string;
  /** The numeric field counted at each stage. Its config entry colours the bars. */
  dataKey: keyof TData & string;
  layout?: FunnelLayout;
  /** Whether conversion is measured against the first stage or the one before it. */
  calculateFrom?: FunnelCalculateFrom;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  onStageClick?: (stage: FunnelStage<TData>) => void;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface FunnelProps {
  variant?: FunnelVariant;
  radius?: number;
  /** Draws the volume lost since the previous stage as a tinted ghost bar. */
  showDropOff?: boolean;
  /** Labels each ghost with the drop-off percentage when it is tall enough. */
  dropOffLabels?: boolean;
  isClickable?: boolean;
}

const Funnel: FC<FunnelProps> = () => null;
Funnel.displayName = "FunnelChart.Funnel";

export interface LabelsProps {
  /** Formats the stage count under the conversion rate. */
  valueFormatter?: (value: number) => string;
  /** Formats the conversion rate, given a share from 0 to 1. */
  percentFormatter?: (share: number) => string;
  hideValue?: boolean;
}

const Labels: FC<LabelsProps> = () => null;
Labels.displayName = "FunnelChart.Labels";

export interface AxisProps {
  tickFormatter?: (value: string, index: number) => string;
  hide?: boolean;
}

const Axis: FC<AxisProps> = () => null;
Axis.displayName = "FunnelChart.Axis";

const Grid: FC = () => null;
Grid.displayName = "FunnelChart.Grid";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
  defaultIndex?: number;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "FunnelChart.Tooltip";

type FunnelSlot = Required<FunnelProps>;
type LabelsSlot = LabelsProps & { present: boolean };
type AxisSlot = AxisProps & { present: boolean };
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Omit<TooltipProps, "variant" | "roundness" | "position"> & { present: boolean };

function matchesSlot(type: unknown, slot: FC, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `FunnelChart.${name}`;
}

function collectConfig(children: ReactNode) {
  let funnel: FunnelSlot = {
    variant: "stepped",
    radius: DEFAULT_RADIUS,
    showDropOff: true,
    dropOffLabels: true,
    isClickable: false,
  };
  let labels: LabelsSlot = { present: false };
  let axis: AxisSlot = { present: false };
  let grid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (matchesSlot(child.type, Funnel, "Funnel")) {
      const props = child.props as FunnelProps;
      funnel = {
        variant: props.variant ?? "stepped",
        radius: props.radius ?? DEFAULT_RADIUS,
        showDropOff: props.showDropOff ?? true,
        dropOffLabels: props.dropOffLabels ?? true,
        isClickable: props.isClickable ?? false,
      };
    } else if (matchesSlot(child.type, Labels, "Labels")) {
      labels = { present: true, ...(child.props as LabelsProps) };
    } else if (matchesSlot(child.type, Axis, "Axis")) {
      axis = { present: true, ...(child.props as AxisProps) };
    } else if (matchesSlot(child.type, Grid, "Grid")) {
      grid = true;
    } else if (matchesSlot(child.type, Tooltip, "Tooltip")) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        valueFormatter: props.valueFormatter,
        defaultIndex: props.defaultIndex,
      };
    }
  });

  return { funnel, labels, axis, grid, tooltip };
}

const defaultPercent = (share: number) =>
  `${(share * 100).toLocaleString(undefined, { maximumFractionDigits: share < 0.1 ? 1 : 0 })}%`;

function buildStages<TData extends Record<string, unknown>>(
  data: TData[],
  nameKey: string,
  dataKey: string,
): FunnelStage<TData>[] {
  const first = Math.max(Number(data[0]?.[dataKey]) || 0, 0);
  return data.map((datum, index) => {
    const value = Math.max(Number(datum[dataKey]) || 0, 0);
    const previous = index === 0 ? value : Math.max(Number(data[index - 1][dataKey]) || 0, 0);
    return {
      name: String(datum[nameKey]),
      value,
      fromFirst: first ? value / first : 0,
      fromPrevious: index === 0 ? 1 : previous ? value / previous : 0,
      dropOff: index === 0 ? 0 : Math.max(previous - value, 0),
      datum,
      index,
    };
  });
}

/** A stage with its own config colour takes it; others use the series colour. */
function stageColor(resolved: ResolvedColors, config: ChartConfig, stageName: string, dataKey: string) {
  const key = stageColorKey(config, stageName, dataKey);
  return resolved.series[key]?.[0] ?? GRAY;
}

function stageColorKey(config: ChartConfig, stageName: string, dataKey: string) {
  return config[stageName]?.colors ? stageName : dataKey;
}

type BuildContext = {
  stages: FunnelStage<Record<string, unknown>>[];
  config: ChartConfig;
  dataKey: string;
  layout: FunnelLayout;
  calculateFrom: FunnelCalculateFrom;
  funnel: FunnelSlot;
  labels: LabelsSlot;
  axis: AxisSlot;
  grid: boolean;
  tooltip: TooltipSlot;
  resolved: ResolvedColors;
  plotSize: { width: number; height: number };
};

function createTooltipFormatter(ctx: BuildContext) {
  const { stages, config, dataKey, tooltip } = ctx;
  const format = (value: number) => tooltip.valueFormatter?.(value) ?? value.toLocaleString();
  return (raw: unknown) => {
    const p = (Array.isArray(raw) ? raw[0] : raw) as { dataIndex?: number } | undefined;
    const stage = stages[p?.dataIndex ?? 0];
    if (!stage) return "";
    const colorKey = stageColorKey(config, stage.name, dataKey);
    const item = config[dataKey];
    const label = typeof item?.label === "string" ? item.label : dataKey;
    const rows = [
      tooltipRow({
        indicatorHtml: tooltipIndicatorHtml(colorKey, getColorsCount(config[colorKey] ?? {})),
        labelText: label,
        valueText: format(stage.value),
        dimmed: "",
      }),
    ];
    if (stage.index > 0) {
      const spacer = '<div class="h-2.5 w-2.5 shrink-0"></div>';
      rows.push(
        tooltipRow({
          indicatorHtml: spacer,
          labelText: "Of first stage",
          valueText: defaultPercent(stage.fromFirst),
          dimmed: "",
        }),
        tooltipRow({
          indicatorHtml: spacer,
          labelText: "Of previous",
          valueText: defaultPercent(stage.fromPrevious),
          dimmed: "",
        }),
        tooltipRow({
          indicatorHtml: spacer,
          labelText: "Dropped off",
          valueText: format(stage.dropOff),
          dimmed: "",
        }),
      );
    }
    return tooltipShell({
      label: stage.name,
      body: rows.join(""),
      roundness: tooltip.roundness,
      variant: tooltip.variant,
    });
  };
}

function tooltipOption(ctx: BuildContext): TooltipComponentOption {
  return {
    show: ctx.tooltip.present,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    transitionDuration: 0,
    position: resolveTooltipPosition(ctx.tooltip.position),
    formatter: createTooltipFormatter(ctx),
  };
}

function conversionText(ctx: BuildContext, stage: FunnelStage<Record<string, unknown>>) {
  const share = ctx.calculateFrom === "previous" ? stage.fromPrevious : stage.fromFirst;
  return ctx.labels.percentFormatter?.(share) ?? defaultPercent(share);
}

function steppedOption(ctx: BuildContext): EChartsOption {
  const { stages, layout, funnel, labels, axis, grid, resolved, plotSize } = ctx;
  const { tokens } = resolved;
  const isHorizontal = layout === "horizontal";
  const names = stages.map((stage) => stage.name);
  const max = Math.max(...stages.map((stage) => stage.value), 1);
  const splitLineColor = withAlpha(tokens.border, 1);
  const showAxis = axis.present && !axis.hide;
  const formatValue = (value: number) => labels.valueFormatter?.(value) ?? value.toLocaleString();

  const categoryAxis = {
    type: "category" as const,
    data: names,
    inverse: isHorizontal,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      show: showAxis,
      color: tokens.mutedForeground,
      fontSize: 10,
      margin: 8,
      // Every stage is named; long names truncate to their band instead of
      // ECharts skipping alternate labels.
      interval: 0,
      width: isHorizontal ? 120 : Math.max(plotSize.width / Math.max(stages.length, 1) - 8, 24),
      overflow: "truncate" as const,
      formatter: axis.tickFormatter
        ? (value: string, index: number) => axis.tickFormatter?.(value, index) ?? value
        : undefined,
    },
  };

  // The conversion rates ride a second category axis on the far edge, so every
  // label lines up with its stage and never collides with the bars.
  const labelAxis = {
    type: "category" as const,
    data: names,
    inverse: isHorizontal,
    position: isHorizontal ? ("right" as const) : ("top" as const),
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      show: labels.present,
      margin: isHorizontal ? 12 : 10,
      align: isHorizontal ? ("left" as const) : undefined,
      lineHeight: 14,
      formatter: (_value: string, index: number) => {
        const stage = stages[index];
        if (!stage) return "";
        const rate = `{rate|${conversionText(ctx, stage)}}`;
        if (labels.hideValue) return rate;
        const value = `{value|${formatValue(stage.value)}}`;
        return isHorizontal ? `${rate}  ${value}` : `${rate}\n${value}`;
      },
      rich: {
        rate: { color: tokens.foreground, fontSize: 12, fontWeight: 500, lineHeight: 16 },
        value: { color: tokens.mutedForeground, fontSize: 10, lineHeight: 14 },
      },
    },
  };

  const valueAxis = {
    type: "value" as const,
    max,
    show: grid,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: {
      show: grid,
      lineStyle: { color: splitLineColor, type: [3, 3] as [number, number], width: 1 },
    },
  };

  const plotExtent = isHorizontal ? plotSize.width : plotSize.height;
  const ghost: BarSeriesOption = {
    id: "__drop-off",
    type: "bar",
    xAxisIndex: 0,
    yAxisIndex: 0,
    barGap: "-100%",
    barCategoryGap: isHorizontal ? "28%" : "22%",
    silent: !ctx.tooltip.present,
    cursor: funnel.isClickable ? "pointer" : "default",
    z: 1,
    data: stages.map((stage, index) => {
      const previous = index === 0 ? stage.value : stages[index - 1].value;
      const color = stageColor(resolved, ctx.config, stage.name, ctx.dataKey);
      const ghostPx = (stage.dropOff / max) * plotExtent;
      return {
        value: previous,
        itemStyle: {
          color: index === 0 ? "transparent" : withAlpha(color, DROP_OFF_ALPHA),
          borderRadius: funnel.radius,
        },
        label: {
          show: funnel.dropOffLabels && index > 0 && stage.dropOff > 0 && ghostPx >= MIN_DROP_OFF_LABEL_PX[layout],
          position: isHorizontal ? ("insideRight" as const) : ("insideTop" as const),
          distance: 6,
          color: tokens.mutedForeground,
          fontSize: 10,
          formatter: () =>
            `−${defaultPercent(stage.index === 0 ? 0 : 1 - stage.fromPrevious)}`,
        },
      };
    }),
    emphasis: { disabled: true },
  };

  const bars: BarSeriesOption = {
    id: "stages",
    type: "bar",
    xAxisIndex: 0,
    yAxisIndex: 0,
    barGap: "-100%",
    barCategoryGap: isHorizontal ? "28%" : "22%",
    cursor: funnel.isClickable ? "pointer" : "default",
    silent: !ctx.tooltip.present && !funnel.isClickable,
    z: 2,
    data: stages.map((stage) => ({
      value: stage.value,
      itemStyle: { color: stageColor(resolved, ctx.config, stage.name, ctx.dataKey), borderRadius: funnel.radius },
    })),
    emphasis: {
      itemStyle: { shadowBlur: 6, shadowColor: withAlpha(tokens.foreground, 0.12) },
    },
  };

  // The layout rect contains the axis labels, so the conversion labels on the
  // far edge and the stage names never clip, whatever their length.
  const gridOption: GridComponentOption = {
    left: 8,
    right: 8,
    top: 8,
    bottom: 8,
    outerBoundsMode: "same",
    outerBoundsContain: "axisLabel",
  };

  return {
    grid: gridOption,
    xAxis: isHorizontal ? [valueAxis] : [categoryAxis, { ...labelAxis, show: labels.present }],
    yAxis: isHorizontal ? [categoryAxis, { ...labelAxis, show: labels.present }] : [valueAxis],
    tooltip: tooltipOption(ctx),
    series: funnel.showDropOff ? [ghost, bars] : [bars],
  } as EChartsOption;
}

function taperedOption(ctx: BuildContext): EChartsOption {
  const { stages, layout, funnel, labels, resolved } = ctx;
  const { tokens } = resolved;
  const isHorizontal = layout === "horizontal";
  const formatValue = (value: number) => labels.valueFormatter?.(value) ?? value.toLocaleString();
  const max = Math.max(...stages.map((stage) => stage.value), 1);
  const series: FunnelSeriesOption = {
    id: "stages",
    type: "funnel",
    orient: isHorizontal ? "horizontal" : "vertical",
    sort: "none",
    min: 0,
    max,
    minSize: "8%",
    gap: 2,
    left: isHorizontal ? 8 : labels.present ? "6%" : 8,
    right: isHorizontal ? 8 : labels.present ? "38%" : 8,
    top: isHorizontal ? (labels.present ? 44 : 8) : 8,
    bottom: 8,
    cursor: funnel.isClickable ? "pointer" : "default",
    silent: !ctx.tooltip.present && !funnel.isClickable,
    label: {
      show: labels.present,
      position: isHorizontal ? "top" : "right",
      color: tokens.foreground,
      lineHeight: 14,
      formatter: (params: unknown) => {
        const stage = stages[(params as { dataIndex: number }).dataIndex];
        if (!stage) return "";
        const head = `{name|${stage.name}}  {rate|${conversionText(ctx, stage)}}`;
        return labels.hideValue ? head : `${head}\n{value|${formatValue(stage.value)}}`;
      },
      rich: {
        name: { color: tokens.mutedForeground, fontSize: 11 },
        rate: { color: tokens.foreground, fontSize: 12, fontWeight: 500 },
        value: { color: tokens.mutedForeground, fontSize: 10, lineHeight: 14 },
      },
    },
    labelLine: {
      show: labels.present && !isHorizontal,
      length: 12,
      lineStyle: { color: withAlpha(tokens.mutedForeground, 0.45), width: 1 },
    },
    itemStyle: { borderWidth: 0 },
    emphasis: {
      label: { show: labels.present },
      itemStyle: { shadowBlur: 6, shadowColor: withAlpha(tokens.foreground, 0.12) },
    },
    data: stages.map((stage, index) => {
      const ownColor = ctx.config[stage.name]?.colors ? resolved.series[stage.name]?.[0] : undefined;
      // Without per-stage colours, later stages fade so the shape still reads
      // as one flow narrowing towards the outcome.
      const fade = stages.length > 1 ? 1 - (index / (stages.length - 1)) * 0.45 : 1;
      return {
        name: stage.name,
        value: stage.value,
        itemStyle: {
          color: ownColor ?? withAlpha(stageColor(resolved, ctx.config, stage.name, ctx.dataKey), fade),
        },
      };
    }),
  };
  return { tooltip: tooltipOption(ctx), series: [series] };
}

function loadingOption(layout: FunnelLayout, tokens: ResolvedColors["tokens"]): EChartsOption {
  const values = [100, 72, 51, 34, 22];
  const isHorizontal = layout === "horizontal";
  const category = { type: "category" as const, data: values.map(String), show: false, inverse: isHorizontal };
  const value = { type: "value" as const, show: false, max: 100 };
  return {
    animation: false,
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: isHorizontal ? value : category,
    yAxis: isHorizontal ? category : value,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "bar",
        silent: true,
        barCategoryGap: "22%",
        data: values,
        itemStyle: { color: withAlpha(tokens.foreground, 0.07), borderRadius: DEFAULT_RADIUS },
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  click: {
    stages: FunnelStage<Record<string, unknown>>[];
    enabled: boolean;
    callback?: (stage: FunnelStage<Record<string, unknown>>) => void;
  };
};

export function FunnelChart<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  dataKey,
  layout = "vertical",
  calculateFrom = "first",
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  onStageClick,
  chartOptions,
  children,
}: FunnelChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { funnel, labels, axis, grid, tooltip } = collectConfig(children);
  const stages = useMemo(() => buildStages(data, nameKey, dataKey), [data, nameKey, dataKey]);
  const colorKeys = useMemo(
    () => Array.from(new Set([dataKey as string, ...stages.map((stage) => stage.name)])),
    [dataKey, stages],
  );
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const seriesLabel = typeof config[dataKey]?.label === "string" ? (config[dataKey]?.label as string) : dataKey;
  const defaultAriaLabel = stages.length
    ? `Funnel of ${seriesLabel} across ${stages.length} stages: ${stages
        .map((stage) => `${stage.name} ${stage.value.toLocaleString()} (${defaultPercent(stage.fromFirst)})`)
        .join(", ")}.`
    : `Funnel of ${seriesLabel} with no stages.`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    click: { stages: [], enabled: false },
  });

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(layout, resolved.tokens);
    const chart = chartRef.current;
    const ctx: BuildContext = {
      stages: stages as FunnelStage<Record<string, unknown>>[],
      config,
      dataKey,
      layout,
      calculateFrom,
      funnel,
      labels,
      axis,
      grid,
      tooltip,
      resolved,
      // Approximate plot size, used only to decide whether a drop-off label fits.
      plotSize: {
        width: Math.max((chart?.getWidth() ?? 0) - (layout === "horizontal" ? (labels.present ? 220 : 140) : 16), 0),
        height: Math.max((chart?.getHeight() ?? 0) - (layout === "horizontal" ? 16 : labels.present ? 72 : 32), 0),
      },
    };
    const option = funnel.variant === "tapered" ? taperedOption(ctx) : steppedOption(ctx);
    return {
      ...option,
      animation: animation && !shouldReduceMotion,
      animationDuration: 480,
      animationDelay: (index: number) => index * 40,
    };
  }, [isLoading, layout, stages, config, dataKey, calculateFrom, funnel, labels, axis, grid, tooltip, animation, shouldReduceMotion]);

  useEffect(() => {
    liveRef.current.click = {
      stages: stages as FunnelStage<Record<string, unknown>>[],
      enabled: funnel.isClickable,
      callback: onStageClick as LiveState["click"]["callback"],
    };
  }, [stages, funnel.isClickable, onStageClick]);

  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;
    const chart = echarts.init(mount);
    chartRef.current = chart;
    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) return;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        chart.resize({ animation: { duration: 0 } });
        // Drop-off labels depend on the plot size.
        liveRef.current.repush();
      });
    });
    resizeObserver.observe(mount);
    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    chart.on("click", (params) => {
      const current = liveRef.current.click;
      if (!current.enabled || !current.callback) return;
      const stage = current.stages[(params as { dataIndex?: number }).dataIndex ?? -1];
      if (stage) current.callback(stage);
    });
    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    liveRef.current.resolved = resolveColors(container, config, colorKeys);
    const push = () => {
      const option = buildOption();
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, colorKeys);
      push();
    };
    if (!isLoading && tooltip.present && tooltip.defaultIndex != null && stages.length) {
      const dataIndex = Math.min(Math.max(tooltip.defaultIndex, 0), stages.length - 1);
      const seriesIndex = funnel.variant === "stepped" && funnel.showDropOff ? 1 : 0;
      chart.dispatchAction({ type: "showTip", seriesIndex, dataIndex });
    }
  }, [buildOption, chartOptions, config, colorKeys, isLoading, tooltip.present, tooltip.defaultIndex, stages.length, funnel.variant, funnel.showDropOff]);

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="relative min-h-0 w-full flex-1" role="img" aria-label={ariaLabel ?? defaultAriaLabel}>
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            role="status"
            aria-live="polite"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div
              aria-hidden
              className={`border-border border-t-primary h-3 w-3 rounded-full border ${shouldReduceMotion ? "" : "animate-spin"}`}
            />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

FunnelChart.Funnel = Funnel;
FunnelChart.Labels = Labels;
FunnelChart.Axis = Axis;
FunnelChart.Grid = Grid;
FunnelChart.Tooltip = Tooltip;
