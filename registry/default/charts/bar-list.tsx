"use client";

import {
  buildChartCss,
  getColorsCount,
  indicatorBackground,
  type ChartConfig,
} from "@/registry/default/ui/charts/chart";
import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, type ComponentType, type ReactNode } from "react";

export type { ChartConfig };

export type BarListSortOrder = "descending" | "ascending" | "none";
export type BarListVariant = "tinted" | "track";

export type BarListItem<TData extends Record<string, unknown>> = {
  name: string;
  value: number;
  datum: TData;
  index: number;
};

export interface BarListProps<TData extends Record<string, unknown>> {
  data: TData[];
  config: ChartConfig;
  /** The label of each row. A row whose name is also a `config` key takes that entry's label, icon, and colors. */
  nameKey: keyof TData & string;
  /** The numeric value of each row. Its `config` entry supplies the default bar color. */
  valueKey: keyof TData & string;
  /** Optional link for each row. Rows with a link render as anchors. */
  hrefKey?: keyof TData & string;
  className?: string;
  variant?: BarListVariant;
  sortOrder?: BarListSortOrder;
  /** Upper bound of the bar scale. Defaults to the largest value. */
  max?: number;
  /** Show at most this many rows. */
  limit?: number;
  valueFormatter?: (value: number) => string;
  /** Column headings shown above the rows. */
  nameLabel?: ReactNode;
  valueLabel?: ReactNode;
  /** The selected row name. Other rows are dimmed. */
  selectedName?: string | null;
  /** Makes rows buttons and reports the clicked row. */
  onValueChange?: (item: BarListItem<TData>) => void;
  animation?: boolean;
  isLoading?: boolean;
  loadingRows?: number;
  ariaLabel?: string;
}

const ROW_HEIGHT = "h-8";
const VALUE_FILL_ALPHA = "22%";

type Row<TData extends Record<string, unknown>> = BarListItem<TData> & {
  colorKey: string;
  colorsCount: number;
  icon?: ComponentType;
  label: ReactNode;
  href?: string;
};

function barFill(key: string, colorsCount: number, variant: BarListVariant): string {
  const base = indicatorBackground(key, colorsCount);
  if (variant === "track" || colorsCount > 1) return base;
  // A light wash keeps the row label readable on top of the bar in both themes.
  return `color-mix(in oklab, var(--color-${key}-0) ${VALUE_FILL_ALPHA}, transparent)`;
}

export function BarList<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  valueKey,
  hrefKey,
  className,
  variant = "tinted",
  sortOrder = "descending",
  max,
  limit,
  valueFormatter,
  nameLabel,
  valueLabel,
  selectedName = null,
  onValueChange,
  animation = true,
  isLoading = false,
  loadingRows = 5,
  ariaLabel,
}: BarListProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;
  const shouldReduceMotion = useReducedMotion();
  const animate = animation && !shouldReduceMotion;
  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const format = (value: number) => valueFormatter?.(value) ?? value.toLocaleString();

  const rows = useMemo(() => {
    const mapped: Row<TData>[] = data.map((datum, index) => {
      const name = String(datum[nameKey] ?? "");
      const own = config[name];
      const colorKey = own?.colors ? name : valueKey;
      const value = Number(datum[valueKey]);
      return {
        name,
        value: Number.isFinite(value) ? value : 0,
        datum,
        index,
        colorKey,
        colorsCount: getColorsCount(config[colorKey] ?? {}),
        icon: own?.icon,
        label: own?.label ?? name,
        href: hrefKey ? String(datum[hrefKey] ?? "") || undefined : undefined,
      };
    });
    if (sortOrder !== "none") {
      const direction = sortOrder === "descending" ? -1 : 1;
      mapped.sort((a, b) => (a.value - b.value) * direction);
    }
    return limit != null ? mapped.slice(0, Math.max(0, limit)) : mapped;
  }, [data, config, nameKey, valueKey, hrefKey, sortOrder, limit]);

  const scaleMax = max ?? Math.max(0, ...rows.map((row) => row.value));
  const valueName = String(config[valueKey]?.label ?? valueKey);
  const defaultAriaLabel = `${valueName} by ${nameKey}`;
  const hasSelection = selectedName !== null;

  const header =
    nameLabel != null || valueLabel != null ? (
      <div className="text-muted-foreground flex items-center justify-between gap-4 pb-1 font-medium">
        <span>{nameLabel}</span>
        <span>{valueLabel}</span>
      </div>
    ) : null;

  if (isLoading) {
    return (
      <div
        data-chart={chartId}
        className={`relative flex flex-col gap-1.5 text-xs ${className ?? ""}`}
        aria-busy
      >
        {header}
        {Array.from({ length: loadingRows }, (_, index) => (
          <div key={index} className={`flex items-center gap-4 ${ROW_HEIGHT}`}>
            <div
              className="bg-foreground/5 h-full rounded-[3px]"
              style={{ width: `${88 - ((index * 17) % 56)}%` }}
            />
            <div className="bg-foreground/5 ml-auto h-2 w-8 rounded-[3px]" />
          </div>
        ))}
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
      </div>
    );
  }

  return (
    <div data-chart={chartId} className={`relative flex flex-col gap-1.5 text-xs ${className ?? ""}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {header}
      <ul aria-label={ariaLabel ?? defaultAriaLabel} className="m-0 flex list-none flex-col gap-1.5 p-0">
        {rows.map((row, position) => {
          const width = scaleMax > 0 ? Math.max(0, Math.min(1, row.value / scaleMax)) * 100 : 0;
          const isDimmed = hasSelection && selectedName !== row.name;
          const isSelected = hasSelection && selectedName === row.name;
          const Icon = row.icon;
          const bar = (
            <motion.span
              aria-hidden
              className={`absolute inset-y-0 left-0 ${variant === "track" ? "rounded-full" : "rounded-[3px]"}`}
              style={{ background: barFill(row.colorKey, row.colorsCount, variant) }}
              initial={animate ? { width: 0 } : false}
              animate={{ width: `${width}%` }}
              transition={{
                duration: 0.48,
                ease: [0.22, 1, 0.36, 1],
                delay: animate ? Math.min(position * 0.03, 0.24) : 0,
              }}
            />
          );
          const name = (
            <span className="flex min-w-0 items-center gap-2">
              {Icon && (
                <span aria-hidden className="text-muted-foreground flex shrink-0 [&_svg]:size-3.5">
                  <Icon />
                </span>
              )}
              <span className="text-foreground truncate">{row.label}</span>
            </span>
          );
          const value = (
            <span className="text-foreground shrink-0 font-mono font-medium tabular-nums">
              {format(row.value)}
            </span>
          );
          // Tinted rows put the label on a light bar; track rows put a thin bar
          // on a muted track under the label, for long names or dense lists.
          const content =
            variant === "track" ? (
              <span className="flex w-full flex-col gap-1.5">
                <span className="flex items-center justify-between gap-4">
                  {name}
                  {value}
                </span>
                <span className="bg-foreground/5 relative block h-1 w-full overflow-hidden rounded-full">
                  {bar}
                </span>
              </span>
            ) : (
              <>
                <span className={`relative flex min-w-0 flex-1 items-center ${ROW_HEIGHT}`}>
                  {bar}
                  <span className="relative min-w-0 px-2">{name}</span>
                </span>
                {value}
              </>
            );
          const rowClass = `flex w-full items-center gap-4 rounded-[3px] text-left transition-opacity ${
            variant === "track" ? "py-1" : "py-0"
          } ${
            isDimmed ? "opacity-30 hover:opacity-60" : ""
          }`;
          const interactiveClass =
            "cursor-pointer border-0 bg-transparent px-0 text-inherit outline-none hover:[&_[aria-hidden].absolute]:brightness-95 dark:hover:[&_[aria-hidden].absolute]:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

          return (
            <li key={`${row.name}-${row.index}`} className="m-0 p-0">
              {row.href ? (
                <a
                  href={row.href}
                  className={`${rowClass} ${interactiveClass} no-underline`}
                  onClick={onValueChange ? () => onValueChange(row) : undefined}
                >
                  {content}
                </a>
              ) : onValueChange ? (
                <button
                  type="button"
                  aria-pressed={hasSelection ? isSelected : undefined}
                  className={`${rowClass} ${interactiveClass}`}
                  onClick={() => onValueChange(row)}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
