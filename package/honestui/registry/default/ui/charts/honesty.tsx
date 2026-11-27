import { escapeHtml } from "@/registry/default/ui/charts/tooltip";
import type { PointQuality, PointRange } from "@/registry/default/ui/charts/data-quality";
import type { CustomSeriesOption } from "echarts/charts";
import { Children, isValidElement, type FC, type ReactNode } from "react";

/*
 * Chart honesty: marks that keep a chart from overstating what the data says.
 *
 * - PartialPeriod: the period that is still open is drawn as provisional and
 *   shaded, instead of reading as a sudden drop.
 * - Band: an interval the app supplies (a confidence or forecast range),
 *   filled only between rows that both have bounds.
 * - Gaps: an absent value is a gap, never a zero and never interpolated.
 *   With an interval, rows missing from a time series are found and shown.
 * - Truncated axis: a value axis that does not reach zero is flagged.
 * - Sample size: `n` beside each value, with small samples marked.
 *
 * Every mark is drawn from values the app supplies. Nothing is inferred
 * except where the app opts in (gap detection, partial-period detection).
 */

// ---------------------------------------------------------------------------
// Text

export type ChartHonestyText = {
  /** Label for a partial period when its part sets none. */
  partialPeriodLabel?: string;
  partialPeriodDescription?: string;
  /** Tooltip note for a partial period with a known progress, 0–1. */
  partialProgress?: (progress: number) => string;
  /** Default label for a Band without one. */
  intervalLabel?: string;
  intervalDescription?: string;
  noDataLabel?: string;
  noDataDescription?: string;
  /** Short notice under the plot, given the formatted axis start. */
  axisStartsAt?: (value: string) => string;
  /** The notice when every value is below zero and the axis stops short of it. */
  axisEndsAt?: (value: string) => string;
  /** Full explanation, used for screen readers and the notice's title. */
  axisDescription?: (value: string) => string;
  /** The sample-size label beside a value, given the formatted size. */
  sampleSize?: (n: string) => string;
  sampleSizeLabel?: string;
  sampleSizeDescription?: string;
  /** Key and tooltip label for values below `minSampleSize`. */
  lowSampleLabel?: (min: string) => string;
  lowSampleDescription?: string;
};

export type ResolvedChartHonestyText = Required<ChartHonestyText>;

const DEFAULT_HONESTY_TEXT: ResolvedChartHonestyText = {
  partialPeriodLabel: "In progress",
  partialPeriodDescription: "This period is not over. Its value is still coming in and will change.",
  partialProgress: (progress) => `${Math.round(progress * 100)}% of this period has passed.`,
  intervalLabel: "Interval",
  intervalDescription: "The range supplied with the values. The true value may fall anywhere inside it.",
  noDataLabel: "No data",
  noDataDescription: "Nothing was recorded here, so the line is not drawn across it.",
  axisStartsAt: (value) => `Axis starts at ${value}`,
  axisEndsAt: (value) => `Axis ends at ${value}`,
  axisDescription: (value) =>
    `The value axis stops at ${value} instead of zero, so differences look larger than they are.`,
  sampleSize: (n) => `n=${n}`,
  sampleSizeLabel: "Sample size",
  sampleSizeDescription: "The number of observations behind each value.",
  lowSampleLabel: (min) => `Fewer than ${min}`,
  lowSampleDescription: "Few observations stand behind this value. Treat it with caution.",
};

export function resolveHonestyText(text?: ChartHonestyText): ResolvedChartHonestyText {
  if (!text) return DEFAULT_HONESTY_TEXT;
  const resolved = { ...DEFAULT_HONESTY_TEXT };
  for (const key of Object.keys(text) as (keyof ChartHonestyText)[]) {
    const value = text[key];
    if (value !== undefined) (resolved as Record<string, unknown>)[key] = value;
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Parts

export type PartialPeriodUnit = "hour" | "day" | "week" | "month" | "quarter" | "year";

export interface PartialPeriodProps {
  /**
   * The first category that is still open, as it appears in the data. It and
   * every later category are drawn as provisional.
   */
  x?: string | number;
  /**
   * Find the open period instead of naming it: the row whose period contains
   * `now`. Needs ISO date strings, timestamps, or Date objects on the x axis.
   */
  period?: PartialPeriodUnit;
  /** The current time for `period`. Defaults to the time of render. */
  now?: Date | number;
  /** How much of the period has passed, 0–1. Computed when `period` is set. */
  progress?: number;
  /** Shown over the shaded region and in the key, e.g. "Month to date". */
  label?: string;
  /** Replaces the tooltip note. */
  note?: string;
}

export interface BandProps {
  /** The row field with the lower bound. */
  lowerKey: string;
  /** The row field with the upper bound. */
  upperKey: string;
  /** The series the band belongs to: its color, its tooltip row, and its dimming. */
  dataKey?: string;
  /** Names the band in the key and tooltip, e.g. "80% interval". */
  label?: string;
  /** A chart config key or any CSS color. Defaults to the series color. */
  color?: string;
}

export const PartialPeriod: FC<PartialPeriodProps> = () => null;
PartialPeriod.displayName = "PartialPeriod";
export const Band: FC<BandProps> = () => null;
Band.displayName = "Band";

export type HonestySlots = {
  partial: PartialPeriodProps | null;
  bands: BandProps[];
};

function isSlot(type: unknown, slot: unknown, name: string) {
  if (type === slot) return true;
  if (typeof type !== "function") return false;
  const candidate = (type as FC).displayName ?? type.name;
  return candidate === name || (typeof candidate === "string" && candidate.endsWith(`.${name}`));
}

export function collectHonesty(children: ReactNode): HonestySlots {
  const slots: HonestySlots = { partial: null, bands: [] };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (isSlot(child.type, PartialPeriod, "PartialPeriod")) {
      slots.partial = child.props as PartialPeriodProps;
    } else if (isSlot(child.type, Band, "Band")) {
      slots.bands.push(child.props as BandProps);
    }
  });
  return slots;
}

// ---------------------------------------------------------------------------
// Values

export function readValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "" || typeof raw === "boolean") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

// ---------------------------------------------------------------------------
// Time

export type GapInterval = "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";

/** `gaps` on a chart root: true shades stretches with no values; an interval also finds absent rows. */
export type GapsOption = boolean | { interval?: GapInterval; label?: string };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Milliseconds for a timestamp, Date, or ISO date string; null otherwise. */
export function parseTime(raw: unknown): number | null {
  if (raw instanceof Date) return Number.isFinite(raw.getTime()) ? raw.getTime() : null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string" || !/^\d{4}-\d{2}/.test(raw)) return null;
  const iso = /^\d{4}-\d{2}$/.test(raw) ? `${raw}-01` : raw;
  const time = Date.parse(iso);
  return Number.isFinite(time) ? time : null;
}

export function addInterval(time: number, interval: GapInterval, count = 1): number {
  const date = new Date(time);
  switch (interval) {
    case "minute":
      return time + count * MINUTE;
    case "hour":
      return time + count * HOUR;
    case "day":
      return time + count * DAY;
    case "week":
      return time + count * 7 * DAY;
    case "month":
    case "quarter":
    case "year": {
      const months = interval === "month" ? count : interval === "quarter" ? 3 * count : 12 * count;
      const day = date.getUTCDate();
      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth() + months);
      const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
      date.setUTCDate(Math.min(day, lastDay));
      return date.getTime();
    }
  }
}

/** The start and end (exclusive) of the period that contains `time`, in UTC. */
export function periodBounds(time: number, period: PartialPeriodUnit): [number, number] {
  const date = new Date(time);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  switch (period) {
    case "hour": {
      const start = Math.floor(time / HOUR) * HOUR;
      return [start, start + HOUR];
    }
    case "day": {
      const start = Date.UTC(y, m, d);
      return [start, start + DAY];
    }
    case "week": {
      // ISO weeks start on Monday.
      const start = Date.UTC(y, m, d) - ((date.getUTCDay() + 6) % 7) * DAY;
      return [start, start + 7 * DAY];
    }
    case "month":
      return [Date.UTC(y, m, 1), Date.UTC(y, m + 1, 1)];
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return [Date.UTC(y, q, 1), Date.UTC(y, q + 3, 1)];
    }
    case "year":
      return [Date.UTC(y, 0, 1), Date.UTC(y + 1, 0, 1)];
  }
}

function formatLike(sample: unknown, time: number): unknown {
  if (typeof sample === "number") return time;
  const iso = new Date(time).toISOString();
  if (typeof sample === "string") {
    if (/^\d{4}-\d{2}$/.test(sample)) return iso.slice(0, 7);
    if (/^\d{4}-\d{2}-\d{2}$/.test(sample)) return iso.slice(0, 10);
  }
  return iso;
}

const MAX_INSERTED_ROWS = 1000;

/**
 * Inserts a row with only the x value for every step of `interval` that is
 * absent between two rows of a time series. Rows that are not times are left
 * alone. Returns the indexes of the inserted rows in the new array.
 */
export function fillMissingRows<T extends Record<string, unknown>>(
  data: T[],
  xKey: string,
  interval: GapInterval,
): { data: Record<string, unknown>[]; inserted: number[] } {
  const out: Record<string, unknown>[] = [];
  const inserted: number[] = [];
  let previous: number | null = null;
  for (const row of data) {
    const time = parseTime(row[xKey]);
    if (time !== null && previous !== null) {
      const step = addInterval(previous, interval) - previous;
      // Clock changes and month lengths move a step by a little; a quarter of a
      // step of slack keeps them from reading as a gap.
      const slack = step / 4;
      let next = addInterval(previous, interval);
      while (next < time - slack && inserted.length < MAX_INSERTED_ROWS) {
        inserted.push(out.length);
        out.push({ [xKey]: formatLike(row[xKey], next) });
        next = addInterval(next, interval);
      }
    }
    out.push(row);
    if (time !== null) previous = time;
  }
  return { data: out, inserted };
}

/**
 * The index where the open period starts: `x` when given, otherwise the row
 * whose `period` contains `now`, with the share of that period that has passed.
 */
export function resolvePartialPeriod(
  props: PartialPeriodProps,
  xValues: unknown[],
  fallbackNow: number,
): { start: number; progress: number | null } | null {
  if (props.x !== undefined) {
    const start = xValues.findIndex((value) => String(value) === String(props.x));
    if (start < 0) return null;
    return { start, progress: clampProgress(props.progress) };
  }
  if (!props.period) return null;
  const now = props.now === undefined ? fallbackNow : Number(props.now);
  const [periodStart, periodEnd] = periodBounds(now, props.period);
  for (let i = xValues.length - 1; i >= 0; i--) {
    const time = parseTime(xValues[i]);
    if (time === null) continue;
    if (time >= periodStart && time < periodEnd) {
      const progress = props.progress ?? (now - periodStart) / (periodEnd - periodStart);
      return { start: i, progress: clampProgress(progress) };
    }
    if (time < periodStart) break;
  }
  return null;
}

function clampProgress(progress: number | undefined): number | null {
  if (progress === undefined || !Number.isFinite(progress)) return null;
  return Math.min(1, Math.max(0, progress));
}

/**
 * Values in the open period that claimed nothing, or claimed "measured", are
 * provisional. Estimated, forecast, and missing are kept: they already say more.
 */
export function applyPartialPeriod(points: PointQuality[], start: number): PointQuality[] {
  return points.map((point, index) =>
    index >= start && point.value !== null && (point.status === null || point.status === "measured")
      ? { ...point, status: "provisional" }
      : point,
  );
}

// ---------------------------------------------------------------------------
// Gaps

export type GapSpan = {
  /** First and last rows with no value in any series. */
  start: number;
  end: number;
  /** The rows the region is drawn between; -1 or the row count at the edges. */
  from: number;
  to: number;
};

/** Stretches where no series has a value. */
export function gapSpans(series: (number | null)[][], rowCount: number): GapSpan[] {
  const empty = (i: number) => series.every((values) => values[i] === null || values[i] === undefined);
  const spans: GapSpan[] = [];
  let i = 0;
  while (i < rowCount) {
    if (!empty(i)) {
      i++;
      continue;
    }
    const start = i;
    while (i + 1 < rowCount && empty(i + 1)) i++;
    spans.push({ start, end: i, from: start - 1, to: i + 1 });
    i++;
  }
  // A chart with no values at all is an empty state, not a gap.
  return spans.length === 1 && spans[0].start === 0 && spans[0].end === rowCount - 1 ? [] : spans;
}

// ---------------------------------------------------------------------------
// Bands

export type BandRun = { start: number; end: number };

export function readBand(
  data: Record<string, unknown>[],
  band: Pick<BandProps, "lowerKey" | "upperKey">,
): { bounds: (PointRange | null)[]; runs: BandRun[]; issues: string[] } {
  const issues: string[] = [];
  const bounds = data.map((row, index): PointRange | null => {
    const lower = readValue(row[band.lowerKey]);
    const upper = readValue(row[band.upperKey]);
    if (lower === null && upper === null) return null;
    if (lower === null || upper === null) {
      issues.push(`Band "${band.lowerKey}"–"${band.upperKey}" row ${index}: only one bound is set. The band skips it.`);
      return null;
    }
    if (lower > upper) {
      issues.push(`Band "${band.lowerKey}"–"${band.upperKey}" row ${index}: the lower bound ${lower} is above the upper bound ${upper}. The band skips it.`);
      return null;
    }
    return { lower, upper };
  });
  return { bounds, runs: bandRuns(bounds), issues };
}

/** Runs of consecutive rows that both have bounds. A lone row is a run of one. */
export function bandRuns(bounds: (PointRange | null)[]): BandRun[] {
  const runs: BandRun[] = [];
  let start = -1;
  for (let i = 0; i <= bounds.length; i++) {
    const has = i < bounds.length && bounds[i] !== null;
    if (has && start < 0) start = i;
    if (!has && start >= 0) {
      runs.push({ start, end: i - 1 });
      start = -1;
    }
  }
  return runs;
}

// ---------------------------------------------------------------------------
// Axis

const NICE_STEPS = [1, 2, 2.5, 5, 10];

export function niceStep(span: number, targetTicks = 5): number {
  if (!(span > 0)) return 1;
  const raw = span / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = NICE_STEPS.find((candidate) => candidate * magnitude >= raw) ?? 10;
  return step * magnitude;
}

/** A rounded domain that fits the values without forcing zero in. */
export function fitDomain(values: number[]): { min: number; max: number } | null {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return null;
  let low = Math.min(...finite);
  let high = Math.max(...finite);
  if (low === high) {
    const pad = Math.abs(low) * 0.1 || 1;
    low -= pad;
    high += pad;
  }
  const step = niceStep(high - low);
  // Round to the step's precision: 996 × 0.1 is 99.60000000000001, which the
  // axis then cannot divide into ticks.
  const digits = Math.max(0, Math.ceil(-Math.log10(step))) + 1;
  const round = (value: number) => Number(value.toFixed(digits));
  return { min: round(Math.floor(low / step) * step), max: round(Math.ceil(high / step) * step) };
}

/**
 * Where a value axis that does not reach zero starts: its lower end when all
 * of it is above zero, its upper end when all of it is below. Null when the
 * axis includes zero.
 */
export function axisTruncation(min: number | null, max: number | null): number | null {
  if (min !== null && min > 0) return min;
  if (max !== null && max < 0) return max;
  return null;
}

// ---------------------------------------------------------------------------
// Sample size

export type SampleSizeDisplay = "label" | "tooltip";

export function readSampleSizes(
  data: Record<string, unknown>[],
  key: string,
): (number | null)[] {
  return data.map((row) => {
    const n = readValue(row[key]);
    return n !== null && n >= 0 ? n : null;
  });
}

export function isLowSample(n: number | null, min: number | undefined): boolean {
  return n !== null && min !== undefined && n < min;
}

/** Show every `stride`th label so labels keep `minGap` pixels apart. */
export function labelStride(pixelsPerCategory: number, minGap = 30): number {
  if (!(pixelsPerCategory > 0)) return 1;
  return Math.max(1, Math.ceil(minGap / pixelsPerCategory));
}

export function formatCount(n: number): string {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Series

export const HONESTY_PREFIX = "__honesty-";

type RenderItem = NonNullable<CustomSeriesOption["renderItem"]>;
type RenderParams = Parameters<RenderItem>[0];
type RenderApi = Parameters<RenderItem>[1];
type GridRect = { x: number; y: number; width: number; height: number };

function gridOf(params: RenderParams): GridRect {
  return params.coordSys as unknown as GridRect;
}

const REGION_LABEL_SIZE = 10;

function regionLabel(
  text: string,
  x: number,
  y: number,
  color: string,
  align: "left" | "center" | "right",
) {
  return {
    type: "text" as const,
    silent: true,
    style: {
      text,
      x,
      y,
      fill: color,
      fontSize: REGION_LABEL_SIZE,
      align,
      verticalAlign: "top" as const,
    },
  };
}

/**
 * Shades the open period from halfway before its first row to the plot's
 * right edge, with its label at the top.
 */
export function partialPeriodSeries(params: {
  start: number;
  label: string;
  fill: string;
  labelColor: string;
  z: number;
}): CustomSeriesOption {
  const { start, label, fill, labelColor, z } = params;
  return {
    id: `${HONESTY_PREFIX}partial`,
    type: "custom",
    data: [[start]],
    encode: { x: 0 },
    silent: true,
    clip: true,
    z,
    tooltip: { show: false },
    renderItem: (itemParams, api) => {
      const grid = gridOf(itemParams);
      const index = api.value(0) as number;
      const [x] = api.coord([index, 0]);
      const [prev] = index > 0 ? api.coord([index - 1, 0]) : [grid.x];
      const left = Math.max(grid.x, index > 0 ? (prev + x) / 2 : grid.x);
      const right = grid.x + grid.width;
      const width = Math.max(right - left, 0);
      return {
        type: "group",
        children: [
          {
            type: "rect",
            shape: { x: left, y: grid.y, width, height: grid.height },
            style: { fill },
          },
          {
            type: "line",
            shape: { x1: left, y1: grid.y, x2: left, y2: grid.y + grid.height },
            style: { stroke: labelColor, lineWidth: 1, lineDash: [2, 3], opacity: 0.45 },
          },
          // A narrow region carries its label above the plot, against its right edge.
          width > label.length * 5.5 + 12
            ? regionLabel(label, left + 6, grid.y + 4, labelColor, "left")
            : regionLabel(label, right, grid.y - REGION_LABEL_SIZE - 4, labelColor, "right"),
        ],
      };
    },
  };
}

/** Hatches each stretch with no data between the rows on either side of it. */
export function gapRegionSeries(params: {
  spans: GapSpan[];
  rowCount: number;
  label: string;
  hatch: string;
  labelColor: string;
  z: number;
}): CustomSeriesOption | null {
  const { spans, rowCount, label, hatch, labelColor, z } = params;
  if (!spans.length) return null;
  return {
    id: `${HONESTY_PREFIX}gaps`,
    type: "custom",
    data: spans.map((span) => [span.from, span.to]),
    encode: { x: [0, 1] },
    silent: true,
    clip: true,
    z,
    tooltip: { show: false },
    renderItem: (itemParams, api) => {
      const grid = gridOf(itemParams);
      const from = api.value(0) as number;
      const to = api.value(1) as number;
      const left = from < 0 ? grid.x : api.coord([from, 0])[0];
      const right = to >= rowCount ? grid.x + grid.width : api.coord([to, 0])[0];
      const width = Math.max(right - left, 0);
      // Diagonal hatching, clipped to the region.
      const lines = [];
      const spacing = 6;
      for (let offset = -grid.height; offset < width; offset += spacing) {
        lines.push({
          type: "line" as const,
          shape: {
            x1: left + offset,
            y1: grid.y + grid.height,
            x2: left + offset + grid.height,
            y2: grid.y,
          },
          style: { stroke: hatch, lineWidth: 1 },
        });
      }
      return {
        type: "group",
        children: [
          {
            type: "group",
            clipPath: { type: "rect", shape: { x: left, y: grid.y, width, height: grid.height } },
            children: lines,
          },
          ...(width > label.length * 5.5 + 8
            ? [regionLabel(label, left + width / 2, grid.y + 4, labelColor, "center")]
            : []),
        ],
      };
    },
  };
}

export function bandSeriesId(index: number, dataKey?: string): string {
  return `${HONESTY_PREFIX}band-${index}${dataKey ? `-${dataKey}` : ""}`;
}

/**
 * A filled polygon for each run of rows with bounds. A run of one row is a
 * short bar, so a lone interval still shows. The run's extremes are encoded
 * on the value axis so the axis keeps the band in view.
 */
export function bandSeries(params: {
  id: string;
  bounds: (PointRange | null)[];
  runs: BandRun[];
  fill: string;
  edge: string;
  step?: boolean;
  smooth?: boolean;
  z: number;
}): CustomSeriesOption | null {
  const { id, bounds, runs, fill, edge, step = false, smooth = false, z } = params;
  if (!runs.length) return null;
  return {
    id,
    type: "custom",
    data: runs.map((run) => {
      let low = Infinity;
      let high = -Infinity;
      for (let i = run.start; i <= run.end; i++) {
        low = Math.min(low, (bounds[i] as PointRange).lower);
        high = Math.max(high, (bounds[i] as PointRange).upper);
      }
      return [run.start, run.end, low, high];
    }),
    encode: { x: [0, 1], y: [2, 3] },
    silent: true,
    clip: true,
    z,
    tooltip: { show: false },
    renderItem: (_params, api: RenderApi) => {
      const start = api.value(0) as number;
      const end = api.value(1) as number;
      const upper: number[][] = [];
      const lower: number[][] = [];
      if (start === end) {
        const range = bounds[start] as PointRange;
        const [x, yHigh] = api.coord([start, range.upper]);
        const [, yLow] = api.coord([start, range.lower]);
        return {
          type: "rect",
          shape: { x: x - 2, y: yHigh, width: 4, height: Math.max(yLow - yHigh, 1), r: 2 },
          style: { fill },
        };
      }
      for (let i = start; i <= end; i++) {
        const range = bounds[i] as PointRange;
        const top = api.coord([i, range.upper]);
        const bottom = api.coord([i, range.lower]);
        if (step && i > start) {
          // A step line changes value halfway between categories.
          const [prevX] = api.coord([i - 1, 0]);
          const mid = (prevX + top[0]) / 2;
          upper.push([mid, upper[upper.length - 1][1]], [mid, top[1]]);
          lower.push([mid, lower[lower.length - 1][1]], [mid, bottom[1]]);
        }
        upper.push(top);
        lower.push(bottom);
      }
      const smoothing = smooth ? 0.35 : 0;
      return {
        type: "group",
        children: [
          {
            type: "polygon",
            shape: { points: [...upper, ...lower.reverse()], smooth: smoothing },
            style: { fill },
          },
          {
            type: "polyline",
            shape: { points: upper, smooth: smoothing },
            style: { stroke: edge, lineWidth: 0.75, fill: "none" },
          },
          {
            type: "polyline",
            shape: { points: [...lower].reverse(), smooth: smoothing },
            style: { stroke: edge, lineWidth: 0.75, fill: "none" },
          },
        ],
      };
    },
  };
}

/**
 * A short break on the left of the baseline: the axis does not reach zero.
 * Drawn as two slanted strokes over a gap in the baseline.
 */
export function axisBreakSeries(params: {
  stroke: string;
  background: string;
  z: number;
}): CustomSeriesOption {
  const { stroke, background, z } = params;
  return {
    id: `${HONESTY_PREFIX}axis-break`,
    type: "custom",
    data: [[0]],
    encode: { x: 0 },
    silent: true,
    clip: false,
    z,
    tooltip: { show: false },
    renderItem: (itemParams) => {
      const grid = gridOf(itemParams);
      const x = grid.x + 6;
      const y = grid.y + grid.height;
      const slash = (dx: number) => ({
        type: "line" as const,
        shape: { x1: x + dx - 2.5, y1: y + 3.5, x2: x + dx + 2.5, y2: y - 3.5 },
        style: { stroke, lineWidth: 1, lineCap: "round" as const },
      });
      return {
        type: "group",
        children: [
          { type: "rect", shape: { x: x - 1, y: y - 1.5, width: 6, height: 3 }, style: { fill: background } },
          slash(0),
          slash(4),
        ],
      };
    },
  };
}

export function sampleSizeSeriesId(dataKey: string): string {
  return `${HONESTY_PREFIX}n-${dataKey}`;
}

/**
 * `n` above each point, thinned so labels never collide, and a ring around
 * values below the minimum. Low samples are always labelled.
 */
export function sampleSizeSeries(params: {
  dataKey: string;
  values: (number | null)[];
  sizes: (number | null)[];
  minSampleSize?: number;
  showLabels: boolean;
  format: (n: number) => string;
  labelColor: string;
  ringColor: string;
  background: string;
  opacity: number;
  z: number;
}): CustomSeriesOption | null {
  const {
    dataKey,
    values,
    sizes,
    minSampleSize,
    showLabels,
    format,
    labelColor,
    ringColor,
    background,
    opacity,
    z,
  } = params;
  const items = values.flatMap((value, index) => {
    const n = sizes[index];
    if (value === null || n === null) return [];
    const low = isLowSample(n, minSampleSize);
    if (!showLabels && !low) return [];
    return [[index, value, n, low ? 1 : 0]];
  });
  if (!items.length) return null;
  return {
    id: sampleSizeSeriesId(dataKey),
    type: "custom",
    data: items,
    encode: { x: 0, y: 1 },
    silent: true,
    // Labels at the first and last points reach past the plot edge.
    clip: false,
    z,
    tooltip: { show: false },
    renderItem: (itemParams, api) => {
      const grid = gridOf(itemParams);
      const index = api.value(0) as number;
      const value = api.value(1) as number;
      const n = api.value(2) as number;
      const low = api.value(3) === 1;
      const [x, y] = api.coord([index, value]);
      const pixels = (api.size?.([1, 0]) as number[] | undefined)?.[0] ?? 40;
      const stride = labelStride(pixels);
      const labelled = showLabels && (low || index % stride === 0);
      const children: unknown[] = [];
      if (low) {
        children.push({
          type: "circle",
          shape: { cx: x, cy: y, r: 4 },
          style: { fill: background, stroke: ringColor, lineWidth: 1.25, lineDash: [2, 1.5] },
        });
      }
      if (labelled) {
        // Labels at the plot's edges grow inward instead of past it.
        const edge = 18;
        const align =
          x - grid.x < edge ? "left" : grid.x + grid.width - x < edge ? "right" : "center";
        children.push({
          type: "text",
          style: {
            text: format(n),
            x: align === "left" ? x - 4 : align === "right" ? x + 4 : x,
            y: y - 8,
            fill: labelColor,
            fontSize: 9,
            align,
            verticalAlign: "bottom",
            opacity: low ? 1 : 0.9,
          },
        });
      }
      return { type: "group", children, style: { opacity } } as ReturnType<RenderItem>;
    },
  };
}

// ---------------------------------------------------------------------------
// Tooltip

export type HonestyNote = { label: string; description: string };

export function honestyNotesHtml(notes: HonestyNote[]): string {
  if (!notes.length) return "";
  const rows = notes.map(
    (note) =>
      `<div><span class="text-foreground font-medium">${escapeHtml(note.label)}:</span> ${escapeHtml(note.description)}</div>`,
  );
  return `<div class="text-muted-foreground border-border/50 grid max-w-56 gap-1 border-t pt-1.5 leading-snug whitespace-normal">${rows.join("")}</div>`;
}

// ---------------------------------------------------------------------------
// Key

export type HonestyKeyEntry =
  | { kind: "partial"; label: string; description: string }
  | { kind: "band"; label: string; description: string; color?: string }
  | { kind: "gap"; label: string; description: string }
  | { kind: "axis"; label: string; description: string }
  | { kind: "sample"; label: string; description: string }
  | { kind: "low-sample"; label: string; description: string };

const SWATCH = "h-2.5 w-2.5 shrink-0 overflow-visible";

function HonestySwatch({ entry }: { entry: HonestyKeyEntry }) {
  switch (entry.kind) {
    case "partial":
      return (
        <svg aria-hidden viewBox="0 0 10 10" className={SWATCH} fill="none" stroke="currentColor">
          <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" fill="currentColor" fillOpacity="0.14" stroke="none" />
          <path d="M0.5 0.5v9" strokeDasharray="1.5 1.5" strokeWidth="1" />
        </svg>
      );
    case "band":
      return (
        <svg aria-hidden viewBox="0 0 10 10" className={SWATCH} style={entry.color ? { color: entry.color } : undefined}>
          <path d="M0 3.5Q5 1.5 10 3.5V7Q5 9 0 7Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.75" />
        </svg>
      );
    case "gap":
      return (
        <svg aria-hidden viewBox="0 0 10 10" className={SWATCH} fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" strokeOpacity="0.5" />
          <path d="M1 6l5-5M4 9l5-5" strokeOpacity="0.8" />
        </svg>
      );
    case "axis":
      return (
        <svg aria-hidden viewBox="0 0 10 10" className={SWATCH} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
          <path d="M1.5 8.5l2.5-7M5.5 8.5l2.5-7" />
        </svg>
      );
    case "sample":
      // A small crowd: the count of observations behind a value.
      return (
        <svg aria-hidden viewBox="0 0 10 10" className={SWATCH} fill="currentColor">
          <circle cx="2" cy="6.5" r="1.25" />
          <circle cx="5" cy="3.5" r="1.25" />
          <circle cx="8" cy="6.5" r="1.25" />
        </svg>
      );
    case "low-sample":
      return (
        <svg aria-hidden viewBox="0 0 10 10" className={SWATCH} fill="none" stroke="currentColor" strokeWidth="1.25">
          <circle cx="5" cy="5" r="4" strokeDasharray="2 1.5" />
        </svg>
      );
  }
}

/** Key entries for a chart's honesty marks, rendered inside the data status key's list. */
export function HonestyKeyItems({ entries }: { entries: HonestyKeyEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <li
          key={`${entry.kind}-${entry.label}`}
          className="flex min-h-6 items-center gap-1.5"
          title={entry.description}
          data-honesty={entry.kind}
        >
          <HonestySwatch entry={entry} />
          {entry.label}
          <span className="sr-only">. {entry.description}</span>
        </li>
      ))}
    </>
  );
}
