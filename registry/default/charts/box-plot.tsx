"use client";

import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
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
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { BoxplotChart as BoxplotChartModule, type BoxplotSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type {
  ChartConfig,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

echarts.use([BoxplotChartModule, GridComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<
  BoxplotSeriesOption | GridComponentOption | TooltipComponentOption
>;
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

const GRAY = "rgba(120, 120, 120, 1)";
const SELECTION_DIM = 0.24;

export type BoxPlotVariant = "default" | "blocks";
export type BoxPlotValue = readonly [
  minimum: number,
  firstQuartile: number,
  median: number,
  thirdQuartile: number,
  maximum: number,
];

export interface BoxPlotProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  xDataKey: keyof TData & string;
  className?: string;
  animation?: boolean;
  defaultSelectedDataKey?: string | null;
  onSelectionChange?: (key: string | null) => void;
  isLoading?: boolean;
  loadingBoxes?: number;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface BoxProps {
  dataKey: string;
  variant?: BoxPlotVariant;
  boxWidth?: number | string | [number | string, number | string];
  isClickable?: boolean;
}

const Box: FC<BoxProps> = () => null;
Box.displayName = "BoxPlot.Box";

export interface XAxisProps {
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
  hideDots?: boolean;
}

const XAxis: FC<XAxisProps> = () => null;
XAxis.displayName = "BoxPlot.XAxis";

export interface YAxisProps {
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
  hideDots?: boolean;
  min?: number;
  max?: number;
}

const YAxis: FC<YAxisProps> = () => null;
YAxis.displayName = "BoxPlot.YAxis";

const Grid: FC = () => null;
Grid.displayName = "BoxPlot.Grid";

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
  defaultIndex?: number;
}

const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "BoxPlot.Tooltip";

export interface LegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  isClickable?: boolean;
}

const Legend: FC<LegendProps> = () => null;
Legend.displayName = "BoxPlot.Legend";

type BoxSlot = Required<Pick<BoxProps, "dataKey" | "variant" | "isClickable">> &
  Pick<BoxProps, "boxWidth">;
type XAxisSlot = XAxisProps & { present: boolean };
type YAxisSlot = YAxisProps & { present: boolean };
type TooltipSlot = Required<Pick<TooltipProps, "variant" | "roundness" | "position">> &
  Omit<TooltipProps, "variant" | "roundness" | "position"> & { present: boolean };
type LegendSlot = Required<
  Pick<LegendProps, "variant" | "align" | "verticalAlign" | "isClickable">
> & { present: boolean };

function matchesSlot(type: unknown, slot: unknown, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || candidate === `BoxPlot.${name}`;
}

function collectConfig(children: ReactNode) {
  const boxes: BoxSlot[] = [];
  let xAxis: XAxisSlot = { present: false };
  let yAxis: YAxisSlot = { present: false };
  let grid = false;
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
    if (matchesSlot(child.type, Box, "Box")) {
      const props = child.props as BoxProps;
      boxes.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "default",
        boxWidth: props.boxWidth,
        isClickable: props.isClickable ?? false,
      });
    } else if (matchesSlot(child.type, XAxis, "XAxis")) {
      xAxis = { present: true, ...(child.props as XAxisProps) };
    } else if (matchesSlot(child.type, YAxis, "YAxis")) {
      yAxis = { present: true, ...(child.props as YAxisProps) };
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
    } else if (matchesSlot(child.type, Legend, "Legend")) {
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

  return { boxes, xAxis, yAxis, grid, tooltip, legend };
}

function normalizeBoxValue(value: unknown): number[] {
  if (!Array.isArray(value)) return [0, 0, 0, 0, 0];
  const numbers = value.slice(0, 5).map((item) => Number(item));
  while (numbers.length < 5) numbers.push(0);
  return numbers.map((item) => (Number.isFinite(item) ? item : 0));
}

function defaultBoxPaint(slots: string[]) {
  const colors = slots.length ? slots : [GRAY];
  if (colors.length === 1) return withAlpha(colors[0], 0.28);
  return new echarts.graphic.LinearGradient(
    0,
    0,
    0,
    1,
    colors.map((color, index) => ({
      offset: index / (colors.length - 1),
      color: withAlpha(color, 0.72),
    })),
  );
}

function blockBoxPaint(slots: string[]) {
  const colors =
    slots.length > 1
      ? slots
      : [0.2, 0.38, 0.62, 0.86].map((alpha) => withAlpha(slots[0] ?? GRAY, alpha));
  const stops: { offset: number; color: string }[] = [];
  colors.forEach((color, index) => {
    const start = index / colors.length;
    const end = (index + 1) / colors.length;
    stops.push({ offset: start, color }, { offset: end, color });
  });
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}

function createTooltipFormatter(params: {
  config: ChartConfig;
  slot: TooltipSlot;
  selectedDataKey: string | null;
}) {
  const { config, slot, selectedDataKey } = params;
  const metricLabels = ["Minimum", "Q1", "Median", "Q3", "Maximum"];

  return (raw: unknown) => {
    const p = raw as {
      name?: string;
      seriesId?: string;
      seriesName?: string;
      value?: unknown;
    };
    const key = p.seriesId ?? p.seriesName ?? "";
    const values = normalizeBoxValue(p.value);
    const item = config[key];
    const colorsCount = item ? getColorsCount(item) : 1;
    const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";
    const body = values
      .map((value, index) =>
        tooltipRow({
          indicatorHtml:
            index === 2
              ? tooltipIndicatorHtml(key, colorsCount)
              : '<div class="h-2.5 w-2.5 shrink-0"></div>',
          labelText: metricLabels[index],
          valueText: slot.valueFormatter?.(value) ?? value.toLocaleString(),
          dimmed,
        }),
      )
      .join("");
    const seriesLabel = typeof item?.label === "string" ? item.label : p.seriesName;

    return tooltipShell({
      label: [p.name, seriesLabel].filter(Boolean).join(" · "),
      body,
      roundness: slot.roundness,
      variant: slot.variant,
    });
  };
}

function loadingOption(count: number, tokens: ResolvedColors["tokens"]): EChartsOption {
  const categories = Array.from({ length: count }, (_, index) => String(index));
  const data = categories.map((_, index) => {
    const base = 28 + ((index * 17) % 32);
    return [base - 15, base - 7, base, base + 8, base + 18];
  });
  return {
    animation: false,
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: "category", data: categories, show: false },
    yAxis: { type: "value", show: false },
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "boxplot",
        data,
        silent: true,
        itemStyle: {
          color: withAlpha(tokens.foreground, 0.08),
          borderColor: withAlpha(tokens.foreground, 0.2),
          borderWidth: 1,
        },
      },
    ],
  };
}

type LiveState = {
  resolved: ResolvedColors | null;
  repush: () => void;
  clickability: Map<string, boolean>;
};

export function BoxPlot<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  className,
  animation = true,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingBoxes = 6,
  ariaLabel,
  chartOptions,
  children,
}: BoxPlotProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const { boxes, xAxis, yAxis, grid: showGrid, tooltip, legend } = useMemo(
    () => collectConfig(children),
    [children],
  );
  const seriesKeys = useMemo(() => boxes.map((box) => box.dataKey), [boxes]);
  const categories = useMemo(() => data.map((row) => String(row[xDataKey])), [data, xDataKey]);
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const defaultAriaLabel = `Box plot comparing ${seriesKeys
    .map((key) => String(config[key]?.label ?? key))
    .join(", ")} across ${xDataKey}`;

  const liveRef = useRef<LiveState>({
    resolved: null,
    repush: () => {},
    clickability: new Map(),
  });

  useEffect(() => {
    liveRef.current.clickability = new Map(
      boxes.map((box) => [box.dataKey, box.isClickable]),
    );
  }, [boxes]);

  const toggleSelection = useCallback(
    (key: string) => {
      setSelectedDataKey((current) => {
        const next = current === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  const buildOption = useCallback((): EChartsOption => {
    const resolved = liveRef.current.resolved;
    if (!resolved) return {};
    if (isLoading) return loadingOption(loadingBoxes, resolved.tokens);

    const legendTop = legend.present && legend.verticalAlign === "top";
    const legendBottom = legend.present && legend.verticalAlign === "bottom";
    const splitColor = withAlpha(resolved.tokens.border, 0.8);
    const tickColor = resolved.tokens.mutedForeground;
    const chartGrid: GridComponentOption = {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: legendBottom ? 42 : 12,
      containLabel: true,
    };
    const categoryAxis: XAxisOption = {
      type: "category",
      data: categories,
      boundaryGap: true,
      name: xAxis.label,
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { color: tickColor, fontSize: 10 },
      axisLine: { show: false },
      axisTick: {
        show: xAxis.present && !xAxis.hideDots,
        length: 2,
        alignWithLabel: true,
        lineStyle: { color: splitColor, width: 2, cap: "round" },
      },
      splitLine: { show: false },
      axisLabel: {
        show: xAxis.present,
        color: tickColor,
        fontSize: 10,
        margin: 8,
        formatter: xAxis.tickFormatter,
      },
    };
    const valueAxis: YAxisOption = {
      type: "value",
      min: yAxis.min,
      max: yAxis.max,
      name: yAxis.label,
      nameLocation: "middle",
      nameGap: 38,
      nameTextStyle: { color: tickColor, fontSize: 10 },
      axisLine: { show: false },
      axisTick: {
        show: yAxis.present && !yAxis.hideDots,
        length: 2,
        lineStyle: { color: splitColor, width: 2, cap: "round" },
      },
      axisLabel: {
        show: yAxis.present,
        color: tickColor,
        fontSize: 10,
        margin: 8,
        formatter: yAxis.tickFormatter,
      },
      splitLine: {
        show: showGrid,
        lineStyle: { color: splitColor, type: [3, 3], width: 1 },
      },
    };

    return {
      animation: animation && !shouldReduceMotion,
      animationDuration: 520,
      animationDelay: (index: number) => Math.min(index * 36, 280),
      grid: chartGrid,
      xAxis: categoryAxis,
      yAxis: valueAxis,
      tooltip: {
        show: tooltip.present,
        trigger: "item",
        confine: true,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        transitionDuration: 0,
        position: resolveTooltipPosition(tooltip.position),
        formatter: createTooltipFormatter({ config, slot: tooltip, selectedDataKey }),
      },
      series: boxes.map((box) => {
        const colors = resolved.series[box.dataKey] ?? [GRAY];
        const base = colors[colors.length - 1] ?? GRAY;
        const selected = selectedDataKey == null || selectedDataKey === box.dataKey;
        return {
          id: box.dataKey,
          name:
            typeof config[box.dataKey]?.label === "string"
              ? (config[box.dataKey]?.label as string)
              : box.dataKey,
          type: "boxplot" as const,
          data: data.map((row) => normalizeBoxValue(row[box.dataKey])),
          ...(box.boxWidth == null
            ? {}
            : {
                boxWidth: Array.isArray(box.boxWidth)
                  ? box.boxWidth
                  : [box.boxWidth, box.boxWidth],
              }),
          silent: !tooltip.present && !box.isClickable,
          cursor: box.isClickable ? "pointer" : "default",
          itemStyle: {
            color: box.variant === "blocks" ? blockBoxPaint(colors) : defaultBoxPaint(colors),
            borderColor: base,
            borderWidth: box.variant === "blocks" ? 1.5 : 1.25,
            opacity: selected ? 1 : SELECTION_DIM,
          },
          emphasis: {
            disabled: !box.isClickable,
            itemStyle: {
              borderColor: resolved.tokens.foreground,
              borderWidth: 2,
              shadowBlur: 6,
              shadowColor: withAlpha(resolved.tokens.foreground, 0.14),
            },
          },
        };
      }),
    };
  }, [
    animation,
    boxes,
    categories,
    config,
    data,
    isLoading,
    legend,
    loadingBoxes,
    selectedDataKey,
    shouldReduceMotion,
    showGrid,
    tooltip,
    xAxis,
    yAxis,
  ]);

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
      });
    });
    resizeObserver.observe(mount);
    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    chart.on("click", (params) => {
      const key = String((params as { seriesId?: string }).seriesId ?? "");
      if (liveRef.current.clickability.get(key)) toggleSelection(key);
    });
    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      chart.dispose();
      chartRef.current = null;
    };
  }, [toggleSelection]);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;
    liveRef.current.resolved = resolveColors(container, config, seriesKeys);
    const push = () => {
      const option = buildOption();
      chart.setOption((chartOptions ? { ...option, ...chartOptions } : option) as EChartsOption, {
        notMerge: true,
      });
    };
    push();
    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, seriesKeys);
      push();
    };
  }, [buildOption, chartOptions, config, seriesKeys]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || isLoading || !tooltip.present || tooltip.defaultIndex == null || !data.length)
      return;
    const timer = setTimeout(() => {
      chart.dispatchAction({
        type: "showTip",
        seriesIndex: 0,
        dataIndex: Math.min(Math.max(tooltip.defaultIndex ?? 0, 0), data.length - 1),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [data.length, isLoading, tooltip.defaultIndex, tooltip.present]);

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legend.verticalAlign === "top"
      ? { top: 12 }
      : legend.verticalAlign === "bottom"
        ? { bottom: 12 }
        : { top: "50%", transform: "translateY(-50%)" }),
  };

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      role="img"
      aria-label={ariaLabel ?? defaultAriaLabel}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="relative min-h-0 w-full flex-1">
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {legend.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legend.variant}
          align={legend.align}
          verticalAlign={legend.verticalAlign}
          selectedKey={selectedDataKey}
          hoveredKey={null}
          isClickable={legend.isClickable}
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

BoxPlot.Box = Box;
BoxPlot.XAxis = XAxis;
BoxPlot.YAxis = YAxis;
BoxPlot.Grid = Grid;
BoxPlot.Tooltip = Tooltip;
BoxPlot.Legend = Legend;
