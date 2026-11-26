"use client";

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
  resolveColors,
  seriesPaint,
  withAlpha,
  withChartFont,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/default/ui/charts/chart";
import { LegendOverlay, type LegendVariant } from "@/registry/default/ui/charts/legend";
import { GaugeChart as GaugeChartModule, type GaugeSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

export type { ChartConfig, LegendVariant };

echarts.use([GaugeChartModule, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = ComposeOption<GaugeSeriesOption>;

const REVEAL_DURATION = 900;
const UPDATE_DURATION = 500;
const TRACK_OPACITY = 0.06;
const FALLBACK_COLOR = "rgba(120, 120, 120, 1)";
const LEGEND_SPACE = 40;
const EDGE_PADDING = 8;
const BAND_GAP = 4;
const NEEDLE_TEXT_SPACE = 52;

export type GaugeArcType = "semi" | "arc" | "full";

const ARC_ANGLES: Record<GaugeArcType, [number, number]> = {
  semi: [180, 0],
  arc: [225, -45],
  full: [90, -270],
};

export type GaugeBand = { to: number; dataKey: string };

export interface GaugeChartProps {
  value: number | null;
  config: ChartConfig;
  dataKey: string;
  min?: number;
  max?: number;
  className?: string;
  animation?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  chartOptions?: Record<string, unknown>;
  children?: ReactNode;
}

export interface ArcProps {
  type?: GaugeArcType;
  thickness?: number;
  roundCap?: boolean;
  track?: boolean;
}

export interface BandsProps {
  bands: GaugeBand[];
  thickness?: number;
  colorProgress?: boolean;
}

export interface TicksProps {
  count?: number;
  showLabels?: boolean;
  formatter?: (value: number) => string;
}

export interface NeedleProps {
  length?: number | string;
}

export interface CenterProps {
  label?: ReactNode;
  value?: ReactNode;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export interface LegendProps {
  variant?: LegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom";
}

const Arc: FC<ArcProps> = () => null;
Arc.displayName = "GaugeChart.Arc";
const Bands: FC<BandsProps> = () => null;
Bands.displayName = "GaugeChart.Bands";
const Ticks: FC<TicksProps> = () => null;
Ticks.displayName = "GaugeChart.Ticks";
const Needle: FC<NeedleProps> = () => null;
Needle.displayName = "GaugeChart.Needle";
const Center: FC<CenterProps> = () => null;
Center.displayName = "GaugeChart.Center";
const Legend: FC<LegendProps> = () => null;
Legend.displayName = "GaugeChart.Legend";

type CollectedConfig = {
  arc: Required<ArcProps>;
  bands: ({ present: boolean } & Required<BandsProps>) | null;
  ticks: ({ present: boolean } & TicksProps) | null;
  needle: NeedleProps | null;
  center: ({ present: boolean } & CenterProps) | null;
  legend: ({ present: boolean } & Required<LegendProps>) | null;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const config: CollectedConfig = {
    arc: { type: "semi", thickness: 12, roundCap: true, track: true },
    bands: null,
    ticks: null,
    needle: null,
    center: null,
    legend: null,
  };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Arc) {
      const props = child.props as ArcProps;
      config.arc = {
        type: props.type ?? "semi",
        thickness: props.thickness ?? 12,
        roundCap: props.roundCap ?? true,
        track: props.track ?? true,
      };
    } else if (child.type === Bands) {
      const props = child.props as BandsProps;
      config.bands = {
        present: true,
        bands: [...props.bands].sort((a, b) => a.to - b.to),
        thickness: props.thickness ?? 3,
        colorProgress: props.colorProgress ?? true,
      };
    } else if (child.type === Ticks) {
      config.ticks = { present: true, ...(child.props as TicksProps) };
    } else if (child.type === Needle) {
      config.needle = child.props as NeedleProps;
    } else if (child.type === Center) {
      config.center = { present: true, ...(child.props as CenterProps) };
    } else if (child.type === Legend) {
      const props = child.props as LegendProps;
      config.legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
      };
    }
  });
  return config;
}

type ArcLayout = { cx: number; cy: number; r: number; openBelow: boolean };

/**
 * Fits the sweep into the box: a semicircle is scaled to its own half-height
 * bounds rather than a full circle, so the gauge fills the space it is given.
 */
function arcLayout(
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
    minX = Math.min(minX, Math.cos(angle));
    maxX = Math.max(maxX, Math.cos(angle));
    minY = Math.min(minY, -Math.sin(angle));
    maxY = Math.max(maxY, -Math.sin(angle));
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

function labelOf(config: ChartConfig, key: string): string {
  const label = config[key]?.label;
  return typeof label === "string" ? label : key;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type LiveState = {
  resolved: ResolvedColors | null;
  hasRevealed: boolean;
  repush: () => void;
};

export function GaugeChart({
  value,
  config,
  dataKey,
  min = 0,
  max = 100,
  className,
  animation = true,
  isLoading = false,
  ariaLabel,
  chartOptions,
  children,
}: GaugeChartProps) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const liveRef = useRef<LiveState>({ resolved: null, hasRevealed: false, repush: () => {} });
  const [size, setSize] = useState({ width: 0, height: 0 });

  const collected = useMemo(() => collectConfig(children), [children]);
  const { arc, bands, ticks, needle, center, legend } = collected;
  const [startAngle, endAngle] = ARC_ANGLES[arc.type];

  const bandKeys = useMemo(() => bands?.bands.map((band) => band.dataKey) ?? [], [bands]);
  const colorKeys = useMemo(() => Array.from(new Set([dataKey, ...bandKeys])), [dataKey, bandKeys]);
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const reserve = useMemo(
    () => ({
      top: legend?.verticalAlign === "top" ? LEGEND_SPACE : 0,
      // A needle pivots on the center, so its readout moves below the pivot; a
      // semicircle has nothing below its center, so it makes room there.
      bottom:
        (legend?.verticalAlign === "bottom" ? LEGEND_SPACE : 0) +
        (needle && center && arc.type === "semi" ? NEEDLE_TEXT_SPACE : 0),
    }),
    [legend, needle, center, arc.type],
  );

  const safeValue = value == null || !Number.isFinite(value) ? null : clamp(value, min, max);
  // The band a value falls in names its color and its state in the label.
  const activeBand =
    bands && safeValue != null
      ? (bands.bands.find((band) => safeValue <= band.to) ?? bands.bands[bands.bands.length - 1])
      : null;

  const buildOption = useCallback(
    (width: number, height: number): EChartsOption => {
      const resolved = liveRef.current.resolved;
      if (!resolved || width === 0 || height === 0) return {};
      const { tokens } = resolved;
      const layout = arcLayout(width, height, startAngle, endAngle, reserve);
      const outer = layout.r;
      const bandWidth = bands ? bands.thickness : 0;
      const mainRadius = bands ? outer - bandWidth - BAND_GAP : outer;
      const span = max - min || 1;
      const trackColor = withAlpha(tokens.foreground, TRACK_OPACITY);

      const progressKey =
        bands?.colorProgress && activeBand ? activeBand.dataKey : dataKey;
      const progressPaint = seriesPaint(resolved.series[progressKey] ?? [FALLBACK_COLOR]);

      const common: GaugeSeriesOption = {
        type: "gauge",
        center: [layout.cx, layout.cy],
        startAngle,
        endAngle,
        min,
        max,
        silent: true,
        title: { show: false },
        detail: { show: false },
        anchor: { show: false },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
      };

      const series: GaugeSeriesOption[] = [];

      if (bands && !isLoading) {
        series.push({
          ...common,
          id: "__bands",
          radius: outer,
          axisLine: {
            roundCap: arc.roundCap,
            lineStyle: {
              width: bandWidth,
              color: bands.bands.map((band) => [
                clamp((band.to - min) / span, 0, 1),
                resolved.series[band.dataKey]?.[0] ?? FALLBACK_COLOR,
              ]) as [number, string][],
            },
          },
          progress: { show: false },
          data: [{ value: min }],
        });
      }

      series.push({
        ...common,
        id: "value",
        name: labelOf(config, dataKey),
        radius: mainRadius,
        axisLine: {
          roundCap: arc.roundCap,
          lineStyle: {
            width: arc.thickness,
            color: [[1, arc.track || isLoading ? trackColor : "rgba(0, 0, 0, 0)"]],
          },
        },
        progress: {
          show: !isLoading && safeValue != null,
          roundCap: arc.roundCap,
          width: arc.thickness,
          itemStyle: { color: progressPaint },
        },
        splitNumber: ticks?.count ?? 5,
        axisTick: { show: false },
        splitLine: {
          show: Boolean(ticks?.present) && !isLoading,
          // Ticks and their values sit just inside the arc, clear of the bands outside it.
          distance: 4,
          length: 4,
          lineStyle: { color: withAlpha(tokens.border, 1), width: 1 },
        },
        axisLabel: {
          show: Boolean(ticks?.present) && ticks?.showLabels !== false && !isLoading,
          distance: 6,
          color: tokens.mutedForeground,
          fontSize: 10,
          formatter: (tick: number) => ticks?.formatter?.(tick) ?? tick.toLocaleString(),
        },
        pointer: needle
          ? {
              show: !isLoading && safeValue != null,
              icon: "path://M2.1 0 L4.2 100 L0 100 Z",
              length: needle.length ?? "72%",
              width: 4,
              offsetCenter: [0, 0],
              itemStyle: { color: tokens.foreground },
            }
          : { show: false },
        anchor: needle
          ? {
              show: !isLoading && safeValue != null,
              size: 10,
              showAbove: true,
              itemStyle: {
                color: tokens.background,
                borderColor: tokens.foreground,
                borderWidth: 2,
              },
            }
          : { show: false },
        data: [{ value: safeValue ?? min }],
      });

      return { series };
    },
    [startAngle, endAngle, reserve, ticks, bands, max, min, activeBand, dataKey, arc, isLoading, config, safeValue, needle],
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

    // The first draw sweeps in from the minimum. Later values ease from the
    // previous one: series keep their ids, so ECharts tweens the arc.
    const push = (mode: "reveal" | "update" | "instant") => {
      const option = buildOption(chart.getWidth(), chart.getHeight());
      const merged = withChartFont(chartOptions ? { ...option, ...chartOptions } : option, container);
      const animate = animation && !shouldReduceMotion && mode !== "instant";
      Object.assign(merged, {
        animation: animate,
        animationDuration: REVEAL_DURATION,
        animationEasing: "cubicOut",
        animationDurationUpdate: mode === "update" ? UPDATE_DURATION : 0,
        animationEasingUpdate: "cubicOut",
      });
      chart.setOption(merged as EChartsOption, mode === "reveal" ? { notMerge: true } : { replaceMerge: ["series"] });
    };

    if (isLoading) liveRef.current.hasRevealed = false;
    const shouldReveal = !liveRef.current.hasRevealed && !isLoading;
    if (shouldReveal) liveRef.current.hasRevealed = true;
    push(shouldReveal ? "reveal" : isLoading ? "instant" : "update");

    liveRef.current.repush = () => {
      liveRef.current.resolved = resolveColors(container, config, colorKeys);
      push("instant");
    };
  }, [buildOption, chartOptions, config, colorKeys, isLoading, animation, shouldReduceMotion, size]);

  const layout = arcLayout(size.width, size.height, startAngle, endAngle, reserve);
  const format = (input: number) => center?.valueFormatter?.(input) ?? input.toLocaleString();
  const valueText = value == null || !Number.isFinite(value) ? "—" : format(value);
  const labelText =
    center?.label ?? (activeBand ? labelOf(config, activeBand.dataKey) : labelOf(config, dataKey));

  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legend?.verticalAlign === "top" ? { top: 12 } : { bottom: 12 }),
  };

  const defaultAriaLabel = `${labelOf(config, dataKey)}: ${valueText} on a scale from ${format(
    min,
  )} to ${format(max)}${activeBand ? `, ${labelOf(config, activeBand.dataKey)}` : ""}.`;

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
        role="meter"
        aria-label={ariaLabel ?? defaultAriaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={safeValue ?? undefined}
        aria-valuetext={`${valueText}${activeBand ? `, ${labelOf(config, activeBand.dataKey)}` : ""}`}
      >
        <div ref={mountRef} className="h-full min-h-0 w-full" />
        {center && !isLoading && size.width > 0 && (
          <div
            aria-hidden
            className={`pointer-events-none absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-center ${
              needle ? "" : layout.openBelow ? "-translate-y-full pb-1" : "-translate-y-1/2"
            } ${center.className ?? ""}`}
            style={{ left: layout.cx, top: needle ? layout.cy + 16 : layout.cy }}
          >
            <span
              className="text-foreground leading-none font-semibold tracking-tight tabular-nums"
              // The readout scales with the arc, between the text-xl and text-4xl sizes.
              style={{ fontSize: Math.round(Math.min(Math.max(layout.r * 0.16, 20), 36)) }}
            >
              {center.value ?? valueText}
            </span>
            <span className="text-muted-foreground max-w-28 truncate text-xs">{labelText}</span>
          </div>
        )}
      </div>

      {legend && bands && !isLoading && (
        <LegendOverlay
          seriesKeys={bandKeys}
          config={config}
          variant={legend.variant}
          align={legend.align}
          verticalAlign={legend.verticalAlign}
          selectedKey={null}
          hoveredKey={null}
          isClickable={false}
          onToggle={() => {}}
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

GaugeChart.Arc = Arc;
GaugeChart.Bands = Bands;
GaugeChart.Ticks = Ticks;
GaugeChart.Needle = Needle;
GaugeChart.Center = Center;
GaugeChart.Legend = Legend;
