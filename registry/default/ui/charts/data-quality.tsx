import { escapeHtml } from "@/registry/default/ui/charts/tooltip";
import type { CustomSeriesOption } from "echarts/charts";
import type { ImagePatternObject } from "echarts/core";
import * as echarts from "echarts/core";

export const DATA_STATUSES = ["measured", "estimated", "provisional", "forecast", "missing"] as const;
export type DataStatus = (typeof DATA_STATUSES)[number];

export type DataStatusText = {
  statuses?: Partial<Record<DataStatus, { label?: string; description?: string }>>;
  keyLabel?: string;
  rangeLabel?: string;
  rangeDescription?: string;
  noValueLabel?: string;
  notShownLabel?: (count: number) => string;
};

export type ResolvedDataStatusText = {
  statuses: Record<DataStatus, { label: string; description: string }>;
  keyLabel: string;
  rangeLabel: string;
  rangeDescription: string;
  noValueLabel: string;
  notShownLabel: (count: number) => string;
};

const DEFAULT_TEXT: ResolvedDataStatusText = {
  statuses: {
    measured: { label: "Measured", description: "Recorded from the source." },
    estimated: {
      label: "Estimated",
      description: "Calculated or modelled, not recorded directly.",
    },
    provisional: {
      label: "Provisional",
      description: "Incomplete or unconfirmed. This value can still change.",
    },
    forecast: {
      label: "Forecast",
      description: "A projection for a period that has not been recorded yet.",
    },
    missing: { label: "Missing", description: "No value was recorded for this point." },
  },
  keyLabel: "Data status",
  rangeLabel: "Range",
  rangeDescription: "The span between the lower and upper bounds supplied with the value.",
  noValueLabel: "No value",
  notShownLabel: (count) => `${count} not shown`,
};

export function resolveDataStatusText(text?: DataStatusText): ResolvedDataStatusText {
  if (!text) return DEFAULT_TEXT;
  const statuses = { ...DEFAULT_TEXT.statuses };
  for (const status of DATA_STATUSES) {
    statuses[status] = { ...DEFAULT_TEXT.statuses[status], ...text.statuses?.[status] };
  }
  return {
    statuses,
    keyLabel: text.keyLabel ?? DEFAULT_TEXT.keyLabel,
    rangeLabel: text.rangeLabel ?? DEFAULT_TEXT.rangeLabel,
    rangeDescription: text.rangeDescription ?? DEFAULT_TEXT.rangeDescription,
    noValueLabel: text.noValueLabel ?? DEFAULT_TEXT.noValueLabel,
    notShownLabel: text.notShownLabel ?? DEFAULT_TEXT.notShownLabel,
  };
}

export type DataQualityKeys = {
  statusKey?: string;
  lowerKey?: string;
  upperKey?: string;
};

export type PointRange = { lower: number; upper: number };

// `status: null` means the row made no claim. It is never promoted to "measured".
export type PointQuality = {
  value: number | null;
  status: DataStatus | null;
  range: PointRange | null;
};

function readNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function isDataStatus(raw: unknown): raw is DataStatus {
  return typeof raw === "string" && (DATA_STATUSES as readonly string[]).includes(raw);
}

export function readSeriesQuality(
  data: Record<string, unknown>[],
  dataKey: string,
  keys: DataQualityKeys,
): { points: PointQuality[]; issues: string[] } {
  const { statusKey, lowerKey, upperKey } = keys;
  const issues: string[] = [];
  const hasBothBounds = Boolean(lowerKey && upperKey);
  if (Boolean(lowerKey) !== Boolean(upperKey)) {
    issues.push(`"${dataKey}": set lowerKey and upperKey together. The single bound is ignored.`);
  }

  const points = data.map((row, index): PointQuality => {
    let value = readNumber(row[dataKey]);

    let status: DataStatus | null = null;
    const rawStatus = statusKey ? row[statusKey] : undefined;
    if (isDataStatus(rawStatus)) {
      status = rawStatus;
    } else if (rawStatus !== undefined && rawStatus !== null) {
      issues.push(
        `"${dataKey}" row ${index}: ${JSON.stringify(rawStatus)} is not a data status. The point is drawn without one.`,
      );
    }

    if (status === "missing" && value !== null) {
      issues.push(
        `"${dataKey}" row ${index}: marked missing but has the value ${value}. The value is not drawn.`,
      );
      value = null;
    }

    let range: PointRange | null = null;
    if (hasBothBounds && status !== "missing") {
      const lower = readNumber(row[lowerKey as string]);
      const upper = readNumber(row[upperKey as string]);
      if (lower !== null && upper !== null) {
        const containsValue = value === null || (lower <= value && value <= upper);
        if (lower <= upper && containsValue) range = { lower, upper };
        else {
          issues.push(
            `"${dataKey}" row ${index}: bounds ${lower} and ${upper} are out of order or exclude the value. The range is not drawn.`,
          );
        }
      } else if (lower !== null || upper !== null) {
        issues.push(`"${dataKey}" row ${index}: only one bound is set. The range is not drawn.`);
      }
    }

    return { value, status, range };
  });

  return { points, issues };
}

export type ChartDataQuality = {
  points: Record<string, PointQuality[]>;
  issues: string[];
  summary: DataQualitySummary;
};

export function collectDataQuality(
  data: Record<string, unknown>[],
  series: { dataKey: string; quality: DataQualityKeys | null }[],
  options: { dropRanges?: boolean } = {},
): ChartDataQuality {
  const points: Record<string, PointQuality[]> = {};
  const issues: string[] = [];
  for (const { dataKey, quality } of series) {
    if (!quality) continue;
    const result = readSeriesQuality(data, dataKey, quality);
    points[dataKey] = options.dropRanges
      ? result.points.map((point) => ({ ...point, range: null }))
      : result.points;
    issues.push(...result.issues);
  }
  return { points, issues, summary: summarizeDataQuality(Object.values(points)) };
}

export function dataQualityKeys(props: DataQualityKeys): DataQualityKeys | null {
  if (!props.statusKey && !props.lowerKey && !props.upperKey) return null;
  return { statusKey: props.statusKey, lowerKey: props.lowerKey, upperKey: props.upperKey };
}

// A share of a total is unknown when any part of that total is unknown, so a
// row with a missing value has no total.
export function shareTotals(
  data: Record<string, unknown>[],
  seriesKeys: string[],
  quality: Record<string, PointQuality[]>,
): (number | null)[] {
  return data.map((row, i) => {
    let total = 0;
    for (const key of seriesKeys) {
      const points = quality[key];
      const value = points ? points[i].value : Number(row[key]) || 0;
      if (value === null) return null;
      total += value;
    }
    return total;
  });
}

const MAX_REPORTED_ISSUES = 5;

export function reportDataQualityIssues(chartName: string, issues: string[]): void {
  if (!issues.length) return;
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return;
  const shown = issues.slice(0, MAX_REPORTED_ISSUES).join("\n  ");
  const rest = issues.length - MAX_REPORTED_ISSUES;
  console.warn(`[${chartName}] Data status input:\n  ${shown}${rest > 0 ? `\n  …and ${rest} more.` : ""}`);
}

export type StrokeStatus = "plain" | "estimated" | "provisional" | "forecast";
export type StrokeRun = { stroke: StrokeStatus; start: number; end: number };

function strokeOf(point: PointQuality): StrokeStatus {
  const { status } = point;
  return status === "estimated" || status === "provisional" || status === "forecast"
    ? status
    : "plain";
}

// A segment is solid only when both of its ends are. Otherwise it takes the
// status of its later point, or of its earlier point when the later one is solid.
export function strokeRuns(points: PointQuality[]): StrokeRun[] {
  const runs: StrokeRun[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    if (from.value === null || to.value === null) continue;
    const later = strokeOf(to);
    const stroke = later !== "plain" ? later : strokeOf(from);
    const last = runs[runs.length - 1];
    if (last && last.end === i && last.stroke === stroke) last.end = i + 1;
    else runs.push({ stroke, start: i, end: i + 1 });
  }
  return runs;
}

const UNFOCUSED_RUN_OPACITY = 0.3;

// Run strokes hold one opacity across the emphasis and blur states, because the
// axis pointer emphasises every series at once. Hover dimming is patched in here.
export function runFocusPatch(
  companionIdsByKey: Map<string, string[]>,
  hoveredKey: string | null,
  strokeOpacity: (dataKey: string) => number,
) {
  const patch = [];
  for (const [dataKey, ids] of companionIdsByKey) {
    const unfocused = hoveredKey !== null && hoveredKey !== dataKey;
    const opacity = strokeOpacity(dataKey) * (unfocused ? UNFOCUSED_RUN_OPACITY : 1);
    for (const id of ids) {
      if (!isQualityRunId(id)) continue;
      patch.push({
        id,
        lineStyle: { opacity },
        emphasis: { lineStyle: { opacity } },
        blur: { lineStyle: { opacity } },
      });
    }
  }
  return patch;
}

export function runValues(values: (number | null)[], run: StrokeRun): (number | null)[] {
  return values.map((value, i) => (i >= run.start && i <= run.end ? value : null));
}

export const STROKE_DASH: Record<StrokeStatus, "solid" | [number, number]> = {
  plain: "solid",
  estimated: [1, 3],
  provisional: [4, 3],
  forecast: [9, 4],
};

const QUALITY_RUN_PREFIX = "__quality-";
const QUALITY_RANGE_PREFIX = "__range-";
const QUALITY_MISSING_PREFIX = "__missing-";

export function qualityRunId(dataKey: string, runIndex: number): string {
  return `${QUALITY_RUN_PREFIX}${runIndex}-${dataKey}`;
}

export function qualityRangeId(dataKey: string): string {
  return `${QUALITY_RANGE_PREFIX}${dataKey}`;
}

export function isQualityRunId(seriesId: string): boolean {
  return seriesId.startsWith(QUALITY_RUN_PREFIX);
}

// The data key of the series that a run or range companion belongs to.
export function qualitySeriesOwner(seriesId: string): string | null {
  if (seriesId.startsWith(QUALITY_RANGE_PREFIX)) return seriesId.slice(QUALITY_RANGE_PREFIX.length);
  if (seriesId.startsWith(QUALITY_MISSING_PREFIX)) {
    return seriesId.slice(QUALITY_MISSING_PREFIX.length);
  }
  return seriesId.match(/^__quality-\d+-(.*)$/)?.[1] ?? null;
}

const WHISKER_WIDTH = 1.25;
const WHISKER_CAP = 3;

type RenderItem = NonNullable<CustomSeriesOption["renderItem"]>;
export type RenderItemApi = Parameters<RenderItem>[1];

export type PlottedRange = { index: number; lower: number; upper: number };

export function rangeWhiskerSeries(params: {
  dataKey: string;
  ranges: PlottedRange[];
  color: string;
  opacity: number;
  z: number;
  isHorizontal?: boolean;
  categoryOffset?: (api: RenderItemApi) => number;
}): CustomSeriesOption {
  const { dataKey, ranges, color, opacity, z, isHorizontal = false, categoryOffset } = params;
  const style = { stroke: color, lineWidth: WHISKER_WIDTH, opacity };
  const line = (x1: number, y1: number, x2: number, y2: number) => ({
    type: "line" as const,
    shape: { x1, y1, x2, y2 },
    style,
    emphasis: { style },
  });

  return {
    id: qualityRangeId(dataKey),
    type: "custom",
    data: ranges.map(({ index, lower, upper }) => [index, lower, upper]),
    encode: isHorizontal ? { y: 0, x: [1, 2] } : { x: 0, y: [1, 2] },
    silent: true,
    clip: true,
    z,
    tooltip: { show: false },
    renderItem: (_params, api) => {
      const index = api.value(0);
      const lower = api.value(1);
      const upper = api.value(2);
      const shift = categoryOffset?.(api) ?? 0;

      if (isHorizontal) {
        const [x1, baseY] = api.coord([lower, index]);
        const [x2] = api.coord([upper, index]);
        const y = baseY + shift;
        return {
          type: "group",
          children: [
            line(x1, y, x2, y),
            line(x1, y - WHISKER_CAP, x1, y + WHISKER_CAP),
            line(x2, y - WHISKER_CAP, x2, y + WHISKER_CAP),
          ],
        };
      }

      const [baseX, y1] = api.coord([index, lower]);
      const [, y2] = api.coord([index, upper]);
      const x = baseX + shift;
      return {
        type: "group",
        children: [
          line(x, y1, x, y2),
          line(x - WHISKER_CAP, y1, x + WHISKER_CAP, y1),
          line(x - WHISKER_CAP, y2, x + WHISKER_CAP, y2),
        ],
      };
    },
  };
}

const STATUS_OUTLINE_WIDTH = 1;

function statusPattern(kind: "dots" | "hatch", color: string): ImagePatternObject | null {
  if (typeof document === "undefined") return null;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = 5 * dpr;
  canvas.height = 5 * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = color;
  if (kind === "dots") {
    ctx.beginPath();
    ctx.arc(2.5, 2.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, 1, 5);
  }
  return {
    image: canvas,
    repeat: "repeat",
    rotation: kind === "hatch" ? -Math.PI / 4 : 0,
    scaleX: 1 / dpr,
    scaleY: 1 / dpr,
  };
}

export type StatusItemStyle = {
  color: string | ImagePatternObject | echarts.graphic.LinearGradient | echarts.graphic.RadialGradient;
  borderColor: string;
  borderWidth: number;
  borderType?: [number, number];
};

export type StatusItemStyles = Partial<Record<DataStatus, StatusItemStyle>>;

// Filled marks (bars and pie sectors): dotted for estimated, hatched for
// provisional, and an empty dashed outline for forecast. Measured keeps its own fill.
export function statusFillStyles(base: string): StatusItemStyles {
  const outline = { borderColor: base, borderWidth: STATUS_OUTLINE_WIDTH };
  return {
    estimated: { color: statusPattern("dots", base) ?? "transparent", ...outline },
    provisional: { color: statusPattern("hatch", base) ?? "transparent", ...outline },
    forecast: { color: "transparent", ...outline, borderType: [4, 3] },
  };
}

// Point marks are too small for patterns: a ring with a centre dot for estimated,
// half filled for provisional, and an empty ring for forecast.
export function statusPointStyles(base: string): StatusItemStyles {
  const outline = { borderColor: base, borderWidth: 1.25 };
  const clear = "rgba(0, 0, 0, 0)";
  return {
    estimated: {
      color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
        { offset: 0, color: base },
        { offset: 0.4, color: base },
        { offset: 0.4, color: clear },
        { offset: 1, color: clear },
      ]),
      ...outline,
    },
    provisional: {
      color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: base },
        { offset: 0.5, color: base },
        { offset: 0.5, color: clear },
        { offset: 1, color: clear },
      ]),
      ...outline,
    },
    forecast: { color: clear, ...outline },
  };
}

const CELL_STATUS_CODE: Partial<Record<DataStatus, number>> = {
  estimated: 1,
  provisional: 2,
  forecast: 3,
  missing: 4,
};
const CELL_MARK_INSET = 3;
const CELL_HALO_WIDTH = 3;

// A heatmap cell's colour is its value, so status is an overlay that leaves the
// colour alone: a corner dot for estimated, a corner slash for provisional, a
// dashed outline for forecast, and a dashed ring in the empty cell for missing.
// Each mark is drawn over a halo so it stays visible on any cell colour.
export function cellStatusSeries(params: {
  dataKey: string;
  cells: { x: number; y: number; status: DataStatus | null }[];
  foreground: string;
  background: string;
  z: number;
}): CustomSeriesOption | null {
  const { dataKey, cells, foreground, background, z } = params;
  const marked = cells.flatMap((cell) => {
    const code = cell.status ? CELL_STATUS_CODE[cell.status] : undefined;
    return code ? [[cell.x, cell.y, code]] : [];
  });
  if (!marked.length) return null;

  const stroke = (color: string, lineWidth: number, lineDash?: number[]) => ({
    fill: "none",
    stroke: color,
    lineWidth,
    lineDash,
    lineCap: "round" as const,
  });
  const haloed = <T extends { style: unknown }>(make: (halo: boolean) => T): T[] => [
    make(true),
    make(false),
  ];

  return {
    id: `__cellstatus-${dataKey}`,
    type: "custom",
    data: marked,
    encode: { x: 0, y: 1 },
    silent: true,
    z,
    tooltip: { show: false },
    renderItem: (_params, api) => {
      const [cx, cy] = api.coord([api.value(0), api.value(1)]);
      const [width, height] = api.size?.([1, 1]) as number[];
      const code = api.value(2);
      const right = cx + width / 2 - CELL_MARK_INSET;
      const top = cy - height / 2 + CELL_MARK_INSET;
      const glyph = Math.max(4, Math.min(8, Math.min(width, height) * 0.28));

      if (code === CELL_STATUS_CODE.estimated) {
        const dot = { cx: right - glyph / 2, cy: top + glyph / 2 };
        return {
          type: "group",
          children: [
            { type: "circle", shape: { ...dot, r: glyph / 3 + 1.25 }, style: { fill: background } },
            { type: "circle", shape: { ...dot, r: glyph / 3 }, style: { fill: foreground } },
          ],
        };
      }

      if (code === CELL_STATUS_CODE.provisional) {
        const shape = { x1: right - glyph, y1: top + glyph, x2: right, y2: top };
        return {
          type: "group",
          children: haloed((halo) => ({
            type: "line" as const,
            shape,
            style: halo ? stroke(background, CELL_HALO_WIDTH) : stroke(foreground, WHISKER_WIDTH),
          })),
        };
      }

      if (code === CELL_STATUS_CODE.forecast) {
        const shape = {
          x: cx - width / 2 + CELL_MARK_INSET,
          y: top,
          width: Math.max(width - CELL_MARK_INSET * 2, 1),
          height: Math.max(height - CELL_MARK_INSET * 2, 1),
        };
        return {
          type: "group",
          children: haloed((halo) => ({
            type: "rect" as const,
            shape,
            style: halo
              ? stroke(background, CELL_HALO_WIDTH)
              : stroke(foreground, WHISKER_WIDTH, [3, 3]),
          })),
        };
      }

      return {
        type: "circle",
        shape: { cx, cy, r: MISSING_RADIUS },
        style: stroke(foreground, WHISKER_WIDTH, MISSING_DASH),
      };
    },
  };
}

const MISSING_RADIUS = 3.5;
const MISSING_DASH = [2, 2];
const MISSING_INSET = 3;

// A value that is marked missing has no height to plot, so its marker sits on
// the category baseline: the slot is shown as empty instead of left blank.
// `anchors` moves a marker to where its series would start in a stack.
export function missingMarkerSeries(params: {
  dataKey: string;
  points: PointQuality[];
  color: string;
  opacity: number;
  z: number;
  isHorizontal?: boolean;
  categoryOffset?: (api: RenderItemApi) => number;
  anchors?: number[] | null;
}): CustomSeriesOption | null {
  const { dataKey, points, color, opacity, z, isHorizontal = false, categoryOffset, anchors } =
    params;
  const indices = points.flatMap((point, index) => (point.status === "missing" ? [index] : []));
  if (!indices.length) return null;
  const style = {
    fill: "none",
    stroke: color,
    lineWidth: WHISKER_WIDTH,
    lineDash: MISSING_DASH,
    opacity,
  };

  return {
    id: `${QUALITY_MISSING_PREFIX}${dataKey}`,
    type: "custom",
    data: indices.map((index) => [index, anchors?.[index] ?? 0]),
    encode: isHorizontal ? { y: 0 } : { x: 0 },
    silent: true,
    z,
    tooltip: { show: false },
    renderItem: (itemParams, api) => {
      const index = api.value(0);
      const grid = itemParams.coordSys as unknown as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      const shift = categoryOffset?.(api) ?? 0;
      const anchor = api.value(1);
      const reach = MISSING_RADIUS + MISSING_INSET;
      const [anchorX, anchorY] = api.coord(isHorizontal ? [anchor, index] : [index, anchor]);
      const [cx, cy] = isHorizontal
        ? [(anchors ? anchorX : grid.x) + reach, anchorY + shift]
        : [anchorX + shift, (anchors ? anchorY : grid.y + grid.height) - reach];
      return {
        type: "circle",
        shape: { cx, cy, r: MISSING_RADIUS },
        style,
        emphasis: { style },
      };
    },
  };
}

// Tooltip rows are assembled as HTML, so replacement text is escaped on the way in.
export function noValueHtml(text: ResolvedDataStatusText): string {
  return escapeHtml(text.noValueLabel);
}

export function statusLabelHtml(status: DataStatus | null, text: ResolvedDataStatusText): string {
  return status ? escapeHtml(text.statuses[status].label) : "";
}

export function statusDetailText(
  point: PointQuality,
  text: ResolvedDataStatusText,
  formatValue: (value: number) => string,
): string {
  const parts: string[] = [];
  if (point.status) parts.push(text.statuses[point.status].label);
  if (point.range) {
    parts.push(
      `${text.rangeLabel} ${formatValue(point.range.lower)} – ${formatValue(point.range.upper)}`,
    );
  }
  return parts.join(" · ");
}

// "Measured" needs no caveat, so it is labelled on its row but not explained again.
export function statusNotesHtml(present: Set<DataStatus>, text: ResolvedDataStatusText): string {
  const notes = DATA_STATUSES.filter((status) => status !== "measured" && present.has(status)).map(
    (status) =>
      `<div><span class="text-foreground font-medium">${escapeHtml(text.statuses[status].label)}:</span> ${escapeHtml(text.statuses[status].description)}</div>`,
  );
  if (!notes.length) return "";
  return `<div class="text-muted-foreground border-border/50 grid max-w-56 gap-1 border-t pt-1.5 leading-snug whitespace-normal">${notes.join("")}</div>`;
}

export type DataQualitySummary = { statuses: DataStatus[]; hasRanges: boolean };

export function summarizeDataQuality(series: PointQuality[][]): DataQualitySummary {
  const present = new Set<DataStatus>();
  let hasRanges = false;
  for (const points of series) {
    for (const point of points) {
      if (point.status) present.add(point.status);
      if (point.range) hasRanges = true;
    }
  }
  return { statuses: DATA_STATUSES.filter((status) => present.has(status)), hasRanges };
}

export function dataQualityAriaSummary(
  summary: DataQualitySummary,
  text: ResolvedDataStatusText,
): string {
  if (!summary.statuses.length) return "";
  const labels = summary.statuses.map((status) => text.statuses[status].label).join(", ");
  return ` ${text.keyLabel}: ${labels}.`;
}

export type DataStatusMark = "line" | "fill" | "point" | "cell";

const SWATCH = "h-2.5 w-5 shrink-0 overflow-visible";

const NARROW_SWATCH = "h-2.5 w-2.5 shrink-0 overflow-visible";

function MissingSwatch() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={NARROW_SWATCH} fill="none" stroke="currentColor" strokeWidth="1.25">
      <circle cx="5" cy="5" r="4" strokeDasharray={MISSING_DASH.join(" ")} />
    </svg>
  );
}

function LineSwatch({ status }: { status: DataStatus }) {
  if (status === "missing") return <MissingSwatch />;
  const dash = STROKE_DASH[status === "measured" ? "plain" : status];
  return (
    <svg aria-hidden viewBox="0 0 20 10" className={SWATCH} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M0 5h20"
        strokeDasharray={dash === "solid" ? undefined : dash.join(" ")}
        strokeLinecap={status === "estimated" ? "round" : undefined}
      />
    </svg>
  );
}

function PointSwatch({ status }: { status: DataStatus }) {
  if (status === "missing") return <MissingSwatch />;
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={NARROW_SWATCH} fill="none" stroke="currentColor" strokeWidth="1.25">
      <circle cx="5" cy="5" r="4" fill={status === "measured" ? "currentColor" : undefined} />
      {status === "estimated" && <circle cx="5" cy="5" r="1.6" fill="currentColor" stroke="none" />}
      {status === "provisional" && <path d="M5 1a4 4 0 0 0 0 8z" fill="currentColor" stroke="none" />}
    </svg>
  );
}

function CellSwatch({ status }: { status: DataStatus }) {
  if (status === "missing") return <MissingSwatch />;
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={NARROW_SWATCH} fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0" y="0" width="10" height="10" rx="1.5" fill="currentColor" fillOpacity="0.28" stroke="none" />
      {status === "estimated" && <circle cx="7" cy="3" r="1.5" fill="currentColor" stroke="none" />}
      {status === "provisional" && <path d="M5 5.5l3.5-3.5" strokeWidth="1.25" strokeLinecap="round" />}
      {status === "forecast" && (
        <rect x="1.5" y="1.5" width="7" height="7" strokeDasharray="2 1.5" />
      )}
    </svg>
  );
}

const SWATCHES = { line: LineSwatch, fill: FillSwatch, point: PointSwatch, cell: CellSwatch };

function FillSwatch({ status }: { status: DataStatus }) {
  if (status === "missing") return <MissingSwatch />;
  const frame = { x: 0.5, y: 0.5, width: 9, height: 9 };
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={NARROW_SWATCH} fill="none" stroke="currentColor" strokeWidth="1">
      {status === "measured" && <rect {...frame} fill="currentColor" />}
      {status === "estimated" && (
        <>
          <rect {...frame} />
          <path d="M3 3h.01M7 3h.01M5 5h.01M3 7h.01M7 7h.01" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {status === "provisional" && (
        <>
          <rect {...frame} />
          <path d="M0.5 5.5l5-5M0.5 9.5l9-9M4.5 9.5l5-5" />
        </>
      )}
      {status === "forecast" && <rect {...frame} strokeDasharray="2.5 2" />}
    </svg>
  );
}

function RangeSwatch() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className={NARROW_SWATCH} fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M5 0.5v9M2 0.5h6M2 9.5h6" />
    </svg>
  );
}

export function DataStatusKey({
  summary,
  mark,
  text,
  missingNote,
}: {
  summary: DataQualitySummary;
  mark: DataStatusMark;
  text: ResolvedDataStatusText;
  // Names or a count for missing values that the chart has no place to draw.
  missingNote?: string;
}) {
  if (!summary.statuses.length && !summary.hasRanges) return null;
  const Swatch = SWATCHES[mark];
  const itemClass = "flex min-h-6 items-center gap-1.5";

  return (
    <ul
      aria-label={text.keyLabel}
      className="text-muted-foreground m-0 flex shrink-0 list-none flex-wrap items-center gap-x-4 px-2 pt-1"
    >
      {summary.statuses.map((status) => (
        <li key={status} className={itemClass} title={text.statuses[status].description}>
          <Swatch status={status} />
          {text.statuses[status].label}
          {status === "missing" && missingNote ? `: ${missingNote}` : null}
          <span className="sr-only">. {text.statuses[status].description}</span>
        </li>
      ))}
      {summary.hasRanges && (
        <li className={itemClass} title={text.rangeDescription}>
          <RangeSwatch />
          {text.rangeLabel}
          <span className="sr-only">. {text.rangeDescription}</span>
        </li>
      )}
    </ul>
  );
}
