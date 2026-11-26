"use client";

import {
  escapeHtml,
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
  buildChartCss,
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import {
  PolarComponent,
  TooltipComponent,
  type PolarComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { BarChart as BarChartModule, type BarSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, LegendVariant, TooltipPosition, TooltipRoundness, TooltipVariant };

echarts.use([BarChartModule, PolarComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<BarSeriesOption | PolarComponentOption | TooltipComponentOption>;

const REVEAL_DURATION = 900;
const DIMMED_OPACITY = 0.2;
const TRACK_OPACITY = 0.06;
const FALLBACK_COLOR = "rgba(120, 120, 120, 1)";
const LEGEND_SPACE = 40;
const EDGE_PADDING = 8;

export interface RadialChartProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  nameKey: keyof TData & string;
  dataKey?: keyof TData & string;
  max?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  className?: string;
  animation?: boolean;
  defaultSelectedKey?: string | null;
  selectedKey?: string | null;
  onSelectionChange?: (key: string | null) => void;
  isLoading?: boolean;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface BarProps {
  dataKey?: string;
  track?: boolean;
  cornerRadius?: number;
  stackId?: string;
  barSize?: number;
  isClickable?: boolean;
}

export interface LabelProps {
  dataKey?: string;
  formatter?: (value: string, index: number) => string;
}

export interface CenterProps {
  label?: ReactNode;
  value?: ReactNode;
  valueFormatter?: (value: number) => string;
  followHover?: boolean;
  className?: string;
}

export interface TooltipProps {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  position?: TooltipPosition;
  valueFormatter?: (value: number) => string;
}

export interface LegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom";
  isClickable?: boolean;
}

const Bar: FC<BarProps> = () => null;
Bar.displayName = "RadialChart.Bar";
const Label: FC<LabelProps> = () => null;
Label.displayName = "RadialChart.Label";
const Center: FC<CenterProps> = () => null;
Center.displayName = "RadialChart.Center";
const Tooltip: FC<TooltipProps> = () => null;
Tooltip.displayName = "RadialChart.Tooltip";
const Legend: FC<LegendProps> = () => null;
Legend.displayName = "RadialChart.Legend";

type BarSlot = {
  dataKey: string;
  track: boolean;
  cornerRadius: number;
  stackId?: string;
  barSize?: number;
  isClickable: boolean;
};

type CollectedConfig = {
  bars: (Omit<BarSlot, "dataKey"> & { dataKey?: string })[];
  label: ({ present: boolean } & LabelProps) | null;
  center: { present: boolean } & CenterProps;
  tooltip: {
    present: boolean;
    variant: TooltipVariant;
    roundness: TooltipRoundness;
    position: TooltipPosition;
    valueFormatter?: (value: number) => string;
  };
  legend: { present: boolean } & Required<LegendProps>;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const config: CollectedConfig = {
    bars: [],
    label: null,
    center: { present: false },
    tooltip: { present: false, variant: "default", roundness: "lg", position: "variable" },
    legend: {
      present: false,
      variant: "rounded-square",
      align: "center",
      verticalAlign: "bottom",
      isClickable: false,
    },
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Bar) {
      const props = child.props as BarProps;
      config.bars.push({
        dataKey: props.dataKey,
        track: props.track ?? true,
        cornerRadius: props.cornerRadius ?? 999,
        stackId: props.stackId,
        barSize: props.barSize,
        isClickable: props.isClickable ?? false,
      });
    } else if (child.type === Label) {
      config.label = { present: true, ...(child.props as LabelProps) };
    } else if (child.type === Center) {
      config.center = { present: true, ...(child.props as CenterProps) };
    } else if (child.type === Tooltip) {
      const props = child.props as TooltipProps;
      config.tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        valueFormatter: props.valueFormatter,
      };
    } else if (child.type === Legend) {
      const props = child.props as LegendProps;
      config.legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
        isClickable: props.isClickable ?? false,
      };
    }
  });

  return config;
}

export type ArcLayout = {
  cx: number;
  cy: number;
  r: number;
  /** True when the arc has no lower half, so centered text sits above the center. */
  openBelow: boolean;
};

/**
 * Fits an arc into the box. A half or three-quarter sweep is scaled to its own
 * bounds rather than to a full circle, so a gauge fills the space it is given.
 * Angles follow ECharts: degrees, 0 at 3 o'clock, counterclockwise positive.
 */
export function arcLayout(
  width: number,
  height: number,
  startAngle: number,
  endAngle: number,
  reserve: { top: number; bottom: number },
): ArcLayout {
  const availWidth = Math.max(width - EDGE_PADDING * 2, 1);
  const availHeight = Math.max(height - EDGE_PADDING * 2 - reserve.top - reserve.bottom, 1);
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const angle = ((startAngle + ((endAngle - startAngle) * i) / steps) * Math.PI) / 180;
    const x = Math.cos(angle);
    const y = -Math.sin(angle);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const r = Math.max(Math.min(availWidth / spanX, availHeight / spanY), 1);
  return {
    cx: EDGE_PADDING + (availWidth - spanX * r) / 2 - minX * r,
    cy: EDGE_PADDING + reserve.top + (availHeight - spanY * r) / 2 - minY * r,
    r,
    openBelow: maxY < 0.2,
  };
}

function toPixels(value: number | string, outer: number): number {
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) return (Number.parseFloat(trimmed) / 100) * outer;
  return Number.parseFloat(trimmed) || 0;
}

function labelOf(config: ChartConfig, key: string): string {
  const label = config[key]?.label;
  return typeof label === "string" ? label : key;
}

type LiveState = {
  resolved: ResolvedColors | null;
  hasRevealed: boolean;
  repush: () => void;
  handlers: {
    isClickable: boolean;
    selected: string | null;
    select: (key: string | null) => void;
    hover: (key: string | null) => void;
    keyFor: (seriesId: string, dataIndex: number) => string | null;
  };
};

export function RadialChart<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  dataKey,
  max,
  innerRadius = "30%",
  outerRadius = "100%",
  startAngle = 90,
  endAngle = -270,
  className,
  animation = true,
  defaultSelectedKey = null,
  selectedKey: selectedProp,
  onSelectionChange,
  isLoading = false,
  ariaLabel,
  chartOptions,
  children,
}: RadialChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const collected = useMemo(() => collectConfig(children), [children]);
  const { label: labelSlot, center: centerSlot, tooltip: tooltipSlot, legend: legendSlot } = collected;
  const bars: BarSlot[] = useMemo(() => {
    const fromSlots = collected.bars
      .map((bar) => ({ ...bar, dataKey: bar.dataKey ?? (dataKey as string | undefined) }))
      .filter((bar): bar is BarSlot => typeof bar.dataKey === "string");
    if (fromSlots.length || !dataKey) return fromSlots;
    // A chart with no Bar part still draws its dataKey with the defaults.
    return [{ dataKey: dataKey as string, track: true, cornerRadius: 999, isClickable: false }];
  }, [collected.bars, dataKey]);

  const names = useMemo(() => data.map((row) => String(row[nameKey])), [data, nameKey]);
  // One series colors each ring by its row, like a pie; several series color by series.
  const colorBy: "row" | "series" = bars.length > 1 ? "series" : "row";
  const legendKeys = colorBy === "row" ? names : bars.map((bar) => bar.dataKey);
  const colorKeys = useMemo(
    () => Array.from(new Set([...names, ...bars.map((bar) => bar.dataKey)])),
    [names, bars],
  );

  const [internalSelected, setInternalSelected] = useState<string | null>(defaultSelectedKey);
  const selected = selectedProp !== undefined ? selectedProp : internalSelected;
  const select = useCallback(
    (key: string | null) => {
      setInternalSelected(key);
      onSelectionChange?.(key);
    },
    [onSelectionChange],
  );
  const [hovered, setHovered] = useState<{ row: number; key: string } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const scaleMax = useMemo(() => {
    if (max != null) return max;
    let top = 0;
    data.forEach((row) => {
      const totals = new Map<string, number>();
      bars.forEach((bar, index) => {
        const value = Math.max(Number(row[bar.dataKey]) || 0, 0);
        const group = bar.stackId ?? `__${index}`;
        totals.set(group, (totals.get(group) ?? 0) + value);
      });
      totals.forEach((total) => (top = Math.max(top, total)));
    });
    return top || 1;
  }, [max, data, bars]);

  const reserve = useMemo(
    () => ({
      top: legendSlot.present && legendSlot.verticalAlign === "top" ? LEGEND_SPACE : 0,
      bottom: legendSlot.present && legendSlot.verticalAlign === "bottom" ? LEGEND_SPACE : 0,
    }),
    [legendSlot.present, legendSlot.verticalAlign],
  );

  const liveRef = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    repush: () => {},
    handlers: {
      isClickable: false,
      selected: defaultSelectedKey,
      select: () => {},
      hover: () => {},
      keyFor: () => null,
    },
  });

  useEffect(() => {
    liveRef.current.handlers = {
      isClickable: bars.some((bar) => bar.isClickable),
      selected,
      select,
      hover: (key) => {
        if (key === null) return setHovered(null);
        const [series, row] = key.split("|");
        setHovered({ key: series, row: Number(row) });
      },
      keyFor: (seriesId, dataIndex) =>
        colorBy === "row" ? (names[dataIndex] ?? null) : seriesId,
    };
  });

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const buildOption = useCallback(
    (width: number, height: number): EChartsOption => {
      const resolved = liveRef.current.resolved;
      if (!resolved || width === 0 || height === 0) return {};
      const { tokens } = resolved;
      const layout = arcLayout(width, height, startAngle, endAngle, reserve);
      const outer = toPixels(outerRadius, layout.r);
      const inner = toPixels(innerRadius, outer);
      const trackColor = withAlpha(tokens.foreground, TRACK_OPACITY);
      const categories = isLoading ? ["a", "b", "c"] : names;

      const polar: PolarComponentOption = { center: [layout.cx, layout.cy], radius: [inner, outer] };
      const base = {
        polar,
        angleAxis: {
          type: "value" as const,
          min: 0,
          max: isLoading ? 1 : scaleMax,
          startAngle,
          endAngle,
          clockwise: endAngle < startAngle,
          show: false,
        },
        radiusAxis: {
          type: "category" as const,
          data: categories,
          // The first row is the outermost ring, so rings read in data order.
          inverse: true,
          show: false,
        },
      };
      const firstBar = bars[0];
      const barSize = firstBar?.barSize;
      const cornerRadius = firstBar?.cornerRadius ?? 999;

      const track = (id: string, value: number): BarSeriesOption => ({
        id,
        type: "bar",
        coordinateSystem: "polar",
        silent: true,
        barGap: "-100%",
        barWidth: barSize,
        barCategoryGap: "28%",
        z: 1,
        itemStyle: { color: trackColor, borderRadius: cornerRadius },
        data: categories.map(() => value),
      });

      if (isLoading) {
        return {
          animation: false,
          tooltip: { show: false },
          ...base,
          series: [track("__loading", 1)],
        };
      }

      const hasSelection = selected != null;
      const showTrack = bars.some((bar) => bar.track);
      const series: BarSeriesOption[] = bars.map((bar, barIndex) => {
        const seriesSlots = resolved.series[bar.dataKey] ?? [FALLBACK_COLOR];
        const seriesDimmed = colorBy === "series" && hasSelection && selected !== bar.dataKey;
        return {
          id: bar.dataKey,
          name: labelOf(config, bar.dataKey),
          type: "bar",
          coordinateSystem: "polar",
          stack: bar.stackId,
          barWidth: bar.barSize,
          barCategoryGap: "28%",
          cursor: bar.isClickable ? "pointer" : "default",
          z: 2,
          emphasis: { disabled: true },
          label:
            labelSlot && barIndex === 0
              ? {
                  show: true,
                  // Names sit before each ring's start, in the gap a partial sweep leaves.
                  position: "start",
                  distance: 8,
                  color: tokens.mutedForeground,
                  fontSize: 11,
                  formatter: (params: unknown) => {
                    const index = (params as { dataIndex: number }).dataIndex;
                    const raw = labelSlot.dataKey
                      ? String(data[index]?.[labelSlot.dataKey] ?? "")
                      : labelOf(config, names[index] ?? "");
                    return labelSlot.formatter ? labelSlot.formatter(raw, index) : raw;
                  },
                }
              : undefined,
          data: data.map((row, index) => {
            const name = names[index];
            const slots =
              colorBy === "row" ? (resolved.series[name] ?? seriesSlots) : seriesSlots;
            const rowDimmed = colorBy === "row" && hasSelection && selected !== name;
            const value = Number(row[bar.dataKey]);
            return {
              value: Number.isFinite(value) ? Math.max(value, 0) : 0,
              itemStyle: {
                color: seriesPaint(slots),
                borderRadius: bar.cornerRadius,
                opacity: rowDimmed || seriesDimmed ? DIMMED_OPACITY : 1,
                // Stacked segments are parted by a background-colored edge, like padded pie sectors.
                ...(bar.stackId ? { borderColor: tokens.background, borderWidth: 2 } : {}),
              },
            };
          }),
        };
      });

      return {
        animation: false,
        ...base,
        tooltip: {
          show: tooltipSlot.present,
          trigger: "item",
          confine: true,
          backgroundColor: "transparent",
          borderWidth: 0,
          padding: 0,
          extraCssText: "box-shadow:none;",
          transitionDuration: 0,
          position: resolveTooltipPosition(tooltipSlot.position),
          formatter: (params: unknown) => {
            const p = params as { seriesId?: string; dataIndex?: number };
            if (!p || String(p.seriesId ?? "").startsWith("__") || p.dataIndex == null) return "";
            const row = data[p.dataIndex];
            const name = names[p.dataIndex] ?? "";
            const body = bars
              .map((bar) => {
                const key = colorBy === "row" ? name : bar.dataKey;
                const item = config[key];
                const raw = Number(row?.[bar.dataKey]);
                const value = Number.isFinite(raw)
                  ? (tooltipSlot.valueFormatter?.(raw) ?? raw.toLocaleString())
                  : "—";
                return tooltipRow({
                  indicatorHtml: tooltipIndicatorHtml(key, item ? getColorsCount(item) : 1),
                  labelText: escapeHtml(labelOf(config, bar.dataKey)),
                  valueText: escapeHtml(value),
                  dimmed:
                    colorBy === "series" && bars.length > 1 && bar.dataKey !== p.seriesId
                      ? " opacity-30"
                      : "",
                });
              })
              .join("");
            return tooltipShell({
              label: escapeHtml(labelOf(config, name)),
              body,
              roundness: tooltipSlot.roundness,
              variant: tooltipSlot.variant,
            });
          },
        },
        series: [...(showTrack ? [track("__track", scaleMax)] : []), ...series],
      };
    },
    [
      startAngle,
      endAngle,
      reserve,
      outerRadius,
      innerRadius,
      isLoading,
      names,
      scaleMax,
      bars,
      selected,
      colorBy,
      config,
      labelSlot,
      data,
      tooltipSlot,
    ],
  );

  useEffect(() => {
    const mount = mountRef.current;
    const live = liveRef.current;
    if (!mount) return;
    const chart = echarts.init(mount);
    chartRef.current = chart;
    setSize({ width: chart.getWidth(), height: chart.getHeight() });

    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) return;
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        chart.resize({ animation: { duration: 0 } });
        setSize({ width: chart.getWidth(), height: chart.getHeight() });
      });
    });
    resizeObserver.observe(mount);

    const themeObserver = new MutationObserver(() => liveRef.current.repush());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    chart.on("click", (params) => {
      const p = params as { seriesId?: string; dataIndex?: number };
      const { isClickable, selected: current, select: choose, keyFor } = liveRef.current.handlers;
      if (!isClickable || String(p.seriesId ?? "").startsWith("__") || p.dataIndex == null) return;
      const key = keyFor(String(p.seriesId), p.dataIndex);
      if (key) choose(current === key ? null : key);
    });
    chart.on("mouseover", (params) => {
      const p = params as { seriesId?: string; dataIndex?: number };
      if (String(p.seriesId ?? "").startsWith("__") || p.dataIndex == null) return;
      liveRef.current.handlers.hover(`${p.seriesId}|${p.dataIndex}`);
    });
    chart.on("mouseout", () => liveRef.current.handlers.hover(null));
    chart.getZr().on("globalout", () => liveRef.current.handlers.hover(null));

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      chart.dispose();
      chartRef.current = null;
      live.hasRevealed = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container || size.width === 0) return;
    liveRef.current.resolved = resolveColors(container, config, colorKeys);

    const push = (withEntrance: boolean) => {
      const option = buildOption(chart.getWidth(), chart.getHeight());
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationEasing: "cubicOut",
        animationDurationUpdate: 0,
      });
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };

    if (isLoading) liveRef.current.hasRevealed = false;
    const shouldReveal = !liveRef.current.hasRevealed && !isLoading;
    if (shouldReveal) liveRef.current.hasRevealed = true;
    push(animation && shouldReveal && !shouldReduceMotion);

    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, colorKeys);
      push(false);
    };
  }, [buildOption, chartOptions, config, colorKeys, isLoading, animation, shouldReduceMotion, size]);

  const layout = arcLayout(size.width, size.height, startAngle, endAngle, reserve);
  const holeRadius = toPixels(innerRadius, toPixels(outerRadius, layout.r));

  const centerNode = (() => {
    if (!centerSlot.present || isLoading || size.width === 0) return null;
    const format = (value: number) => centerSlot.valueFormatter?.(value) ?? value.toLocaleString();
    const focusRow =
      centerSlot.followHover === false
        ? null
        : hovered
          ? hovered
          : selected != null && colorBy === "row" && names.includes(selected)
            ? { row: names.indexOf(selected), key: bars[0]?.dataKey ?? "" }
            : null;

    let valueText: ReactNode;
    let labelText: ReactNode;
    if (focusRow) {
      const raw = Number(data[focusRow.row]?.[focusRow.key]);
      valueText = Number.isFinite(raw) ? format(raw) : "—";
      labelText =
        colorBy === "row"
          ? (config[names[focusRow.row]]?.label ?? names[focusRow.row])
          : (config[focusRow.key]?.label ?? focusRow.key);
    } else {
      const single = data.length === 1 && bars.length === 1;
      const total = data.reduce(
        (sum, row) =>
          sum + bars.reduce((acc, bar) => acc + (Number(row[bar.dataKey]) || 0), 0),
        0,
      );
      valueText = centerSlot.value ?? format(total);
      labelText =
        centerSlot.label ??
        (single ? (config[names[0]]?.label ?? config[bars[0].dataKey]?.label ?? "Total") : "Total");
    }

    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-center ${
          layout.openBelow ? "-translate-y-full pb-1" : "-translate-y-1/2"
        } ${centerSlot.className ?? ""}`}
        style={{ left: layout.cx, top: layout.cy }}
      >
        <span
          className="text-foreground leading-none font-semibold tracking-tight tabular-nums"
          // The readout scales with the hole, between the text-base and text-3xl sizes.
          style={{ fontSize: Math.round(Math.min(Math.max(holeRadius * 0.36, 16), 30)) }}
        >
          {valueText}
        </span>
        <span className="text-muted-foreground max-w-28 truncate text-xs">{labelText}</span>
      </div>
    );
  })();

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top" ? { top: 12 } : { bottom: 12 }),
  };

  const defaultAriaLabel = `Radial bar chart showing ${bars
    .map((bar) => labelOf(config, bar.dataKey))
    .join(", ")} for ${names.map((name) => labelOf(config, name)).join(", ")}${
    max != null ? `, out of ${max.toLocaleString()}` : ""
  }.`;

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
      aria-busy={isLoading}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="relative min-h-0 w-full flex-1"
        role="img"
        aria-label={ariaLabel ?? defaultAriaLabel}
      >
        <div ref={mountRef} className="h-full min-h-0 w-full" />
        {centerNode}
      </div>

      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={legendKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={selected}
          hoveredKey={null}
          isClickable={legendSlot.isClickable}
          onToggle={(key) => select(selected === key ? null : key)}
          style={legendStyle}
        />
      )}

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

RadialChart.Bar = Bar;
RadialChart.Label = Label;
RadialChart.Center = Center;
RadialChart.Tooltip = Tooltip;
RadialChart.Legend = Legend;
