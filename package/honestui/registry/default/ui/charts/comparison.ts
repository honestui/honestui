import { escapeHtml } from "@/registry/default/ui/charts/tooltip";
import type { ChartConfig } from "@/registry/default/ui/charts/chart";

/**
 * Period-over-period comparison. A series names a second data key holding
 * the same measure for an earlier period; the chart draws it as a quiet
 * ghost of the series and the tooltip shows the earlier value and the change.
 */

export const COMPARE_PREFIX = "__compare-";
/** A finer dash than the dashed stroke variant, so the ghost never reads as a forecast. */
export const COMPARE_DASH: [number, number] = [2, 3];
export const COMPARE_OPACITY = 0.45;

export function compareSeriesId(key: string) {
  return `${COMPARE_PREFIX}${key}`;
}

export function readCompareValue(row: Record<string, unknown> | undefined, key: string) {
  const raw = row?.[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function compareValues(
  data: Record<string, unknown>[],
  key: string,
): (number | null)[] {
  return data.map((row) => readCompareValue(row, key));
}

/** Change as a signed percentage, or null when it has no meaning. */
export function percentChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatChange(change: number | null) {
  if (change === null || !Number.isFinite(change)) return "—";
  const rounded = Math.abs(change) >= 10 ? change.toFixed(0) : change.toFixed(1);
  if (Number(rounded) === 0) return "0%";
  return `${change > 0 ? "+" : "−"}${rounded.replace("-", "")}%`;
}

export function compareLabel(config: ChartConfig, compareKey: string) {
  const label = config[compareKey]?.label;
  return typeof label === "string" ? label : "Previous";
}

/**
 * The tooltip line under a series row: the earlier period's label and value,
 * then the change. The change stays in the tooltip's own ink; the arrow and
 * sign carry direction, so the row does not lean on red and green.
 */
export function comparisonDetailHtml(params: {
  current: number | null;
  previous: number | null;
  label: string;
  format?: (value: number) => string;
  dimmed?: string;
}): string {
  const { current, previous, label, dimmed = "" } = params;
  const format = params.format ?? ((value: number) => value.toLocaleString());
  const change = percentChange(current, previous);
  const arrow = change === null || Math.abs(change) < 0.05 ? "" : change > 0 ? "↑ " : "↓ ";
  const previousText = previous === null ? "—" : format(previous);
  return `<div class="flex w-full items-center justify-between gap-4 pl-[18px] leading-none${dimmed}">
          <span class="text-muted-foreground">${escapeHtml(label)}</span>
          <span class="flex items-center gap-1.5 font-mono tabular-nums">
            <span class="text-muted-foreground">${escapeHtml(previousText)}</span>
            <span class="text-foreground font-medium">${escapeHtml(arrow + formatChange(change))}</span>
          </span>
        </div>`;
}
