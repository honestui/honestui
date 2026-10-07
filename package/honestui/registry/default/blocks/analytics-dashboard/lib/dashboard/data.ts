import type {
  AcquisitionChannel,
  ActivityEvent,
  Customer,
  DateRangeKey,
  DateRangeOption,
  FunnelStage,
  Insight,
  Metric,
  RetentionCell,
  RevenueMetricKey,
  RevenueMetricOption,
  RevenuePoint,
} from "./types";

/**
 * All dashboard data is deterministic mock data. Series are generated once at
 * module load from fixed seeds, so values never change between renders.
 * Replace this module with real data access when building on the template.
 */

/** Fixed "today" for the mock data set, so dates are stable. */
const ANCHOR = new Date("2026-08-31T00:00:00");

const DAY = 24 * 60 * 60 * 1000;

/** Small deterministic PRNG (mulberry32). */
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  return new Date(ANCHOR.getTime() - days * DAY);
}

export const dateRangeOptions: DateRangeOption[] = [
  { key: "7d", label: "Last 7 days", comparisonLabel: "previous 7 days" },
  { key: "30d", label: "Last 30 days", comparisonLabel: "previous 30 days" },
  { key: "90d", label: "Last 90 days", comparisonLabel: "previous 90 days" },
  { key: "ytd", label: "This year", comparisonLabel: "last year" },
];

export const defaultDateRangeKey: DateRangeKey = "30d";

export const revenueMetricOptions: RevenueMetricOption[] = [
  { key: "revenue", label: "Revenue" },
  { key: "new-mrr", label: "New MRR" },
  { key: "expansion", label: "Expansion" },
  { key: "churned", label: "Churned" },
];

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

function buildMetrics(
  mrrChange: string,
  customersChange: string,
  nrr: string,
  nrrChange: string,
  churn: string,
  churnChange: string,
): Metric[] {
  return [
    {
      id: "mrr",
      label: "Monthly recurring revenue",
      value: "$84,240",
      change: mrrChange,
      sentiment: "positive",
    },
    {
      id: "customers",
      label: "Active customers",
      value: "1,842",
      change: customersChange,
      sentiment: "positive",
    },
    {
      id: "nrr",
      label: "Net revenue retention",
      value: nrr,
      change: nrrChange,
      sentiment: "positive",
    },
    // Churn falling is good news — sentiment is not the sign of the number.
    {
      id: "churn",
      label: "Churn",
      value: churn,
      change: churnChange,
      sentiment: "positive",
    },
  ];
}

export const metricsByRange: Record<DateRangeKey, Metric[]> = {
  "7d": buildMetrics("+1.8%", "+0.9%", "107.2%", "+0.4%", "0.6%", "-0.1%"),
  "30d": buildMetrics("+12.4%", "+8.2%", "108.6%", "+2.1%", "2.4%", "-0.6%"),
  "90d": buildMetrics("+28.6%", "+19.4%", "109.4%", "+3.2%", "6.9%", "-1.1%"),
  ytd: buildMetrics("+64.2%", "+47.8%", "110.2%", "+4.7%", "15.8%", "-2.9%"),
};

/* ------------------------------------------------------------------ */
/* Revenue series                                                      */
/* ------------------------------------------------------------------ */

interface RangeShape {
  points: number;
  /** Distance in days between points. */
  stepDays: number;
}

const rangeShapes: Record<DateRangeKey, RangeShape> = {
  "7d": { points: 7, stepDays: 1 },
  "30d": { points: 30, stepDays: 1 },
  "90d": { points: 13, stepDays: 7 },
  ytd: { points: 8, stepDays: 30 },
};

function seriesDates(
  shape: RangeShape,
): Array<{ date: string; label: string }> {
  const monthly = shape.stepDays >= 28;
  const dates: Array<{ date: string; label: string }> = [];
  for (let i = shape.points - 1; i >= 0; i--) {
    const day = daysAgo(i * shape.stepDays);
    dates.push({
      date: isoDate(day),
      label: day.toLocaleDateString("en-US", {
        month: "short",
        ...(monthly ? {} : { day: "numeric" }),
      }),
    });
  }
  return dates;
}

/**
 * Generates a series that trends from `start` to `end` with seeded noise, so
 * the line rises overall but keeps a few believable dips.
 */
function trendSeries(
  seed: number,
  points: number,
  start: number,
  end: number,
  noise: number,
): number[] {
  const random = seededRandom(seed);
  const values: number[] = [];
  for (let i = 0; i < points; i++) {
    const progress = points === 1 ? 1 : i / (points - 1);
    const wobble = (random() - 0.42) * noise;
    const value = start + (end - start) * progress + wobble;
    values.push(Math.round(Math.max(0, value)));
  }
  return values;
}

function buildRevenueSeries(
  seed: number,
  shape: RangeShape,
  current: { start: number; end: number },
  previousScale: number,
  noise: number,
): RevenuePoint[] {
  const dates = seriesDates(shape);
  const currentValues = trendSeries(
    seed,
    shape.points,
    current.start,
    current.end,
    noise,
  );
  const previousValues = trendSeries(
    seed + 1,
    shape.points,
    current.start * previousScale,
    current.end * previousScale,
    noise,
  );
  return dates.map(({ date, label }, i) => ({
    date,
    label,
    current: currentValues[i],
    previous: previousValues[i],
  }));
}

/** Per-day flow rates (new, expansion, churned MRR) used to scale ranges. */
const flowRates: Record<
  Exclude<RevenueMetricKey, "revenue">,
  { start: number; end: number; noise: number }
> = {
  "new-mrr": { start: 380, end: 640, noise: 260 },
  expansion: { start: 150, end: 320, noise: 150 },
  churned: { start: 210, end: 140, noise: 110 },
};

function buildRangeSeries(
  rangeKey: DateRangeKey,
  seed: number,
): Record<RevenueMetricKey, RevenuePoint[]> {
  const shape = rangeShapes[rangeKey];
  // MRR endpoints per range: always ends at ~$84.2k, starts further back the
  // longer the window is.
  const mrrStart: Record<DateRangeKey, number> = {
    "7d": 82760,
    "30d": 74950,
    "90d": 65510,
    ytd: 51300,
  };

  const series = {
    revenue: buildRevenueSeries(
      seed,
      shape,
      { start: mrrStart[rangeKey], end: 84240 },
      0.87,
      rangeKey === "7d" ? 350 : 1400,
    ),
  } as Record<RevenueMetricKey, RevenuePoint[]>;

  for (const key of ["new-mrr", "expansion", "churned"] as const) {
    const rate = flowRates[key];
    series[key] = buildRevenueSeries(
      seed + revenueMetricOptions.findIndex((o) => o.key === key) * 7,
      shape,
      {
        start: rate.start * shape.stepDays,
        end: rate.end * shape.stepDays,
      },
      key === "churned" ? 1.18 : 0.85,
      rate.noise * shape.stepDays,
    );
  }

  return series;
}

const revenueSeries: Record<
  DateRangeKey,
  Record<RevenueMetricKey, RevenuePoint[]>
> = {
  "7d": buildRangeSeries("7d", 11),
  "30d": buildRangeSeries("30d", 23),
  "90d": buildRangeSeries("90d", 37),
  ytd: buildRangeSeries("ytd", 53),
};

export function getRevenueSeries(
  range: DateRangeKey,
  metric: RevenueMetricKey,
): RevenuePoint[] {
  return revenueSeries[range][metric];
}

/* ------------------------------------------------------------------ */
/* Acquisition                                                         */
/* ------------------------------------------------------------------ */

const acquisitionBase: AcquisitionChannel[] = [
  { channel: "Organic search", sessions: 9840, conversionRate: 3.1, customers: 148 },
  { channel: "Direct", sessions: 6420, conversionRate: 2.4, customers: 87 },
  { channel: "Referral", sessions: 3980, conversionRate: 4.2, customers: 96 },
  { channel: "Social", sessions: 2860, conversionRate: 1.1, customers: 22 },
  { channel: "Paid search", sessions: 1720, conversionRate: 3.8, customers: 41 },
];

function scaleAcquisition(
  factor: number,
  conversionShift: number,
  seed: number,
): AcquisitionChannel[] {
  const random = seededRandom(seed);
  return acquisitionBase.map((channel) => {
    const jitter = 0.9 + random() * 0.2;
    const sessions = Math.round((channel.sessions * factor * jitter) / 10) * 10;
    const conversionRate =
      Math.round((channel.conversionRate + conversionShift) * 10) / 10;
    return {
      channel: channel.channel,
      sessions,
      conversionRate,
      customers: Math.round(sessions * (conversionRate / 100)),
    };
  });
}

export const acquisitionByRange: Record<DateRangeKey, AcquisitionChannel[]> = {
  "7d": scaleAcquisition(0.24, -0.2, 71),
  "30d": acquisitionBase,
  "90d": scaleAcquisition(2.9, -0.3, 73),
  ytd: scaleAcquisition(7.6, -0.5, 79),
};

/* ------------------------------------------------------------------ */
/* Conversion funnel                                                   */
/* ------------------------------------------------------------------ */

export const funnelStages: FunnelStage[] = [
  { stage: "Visitors", value: 24820 },
  { stage: "Signed up", value: 4930 },
  { stage: "Activated", value: 3160 },
  { stage: "Started trial", value: 1420 },
  { stage: "Converted", value: 682 },
];

/* ------------------------------------------------------------------ */
/* Retention cohorts                                                   */
/* ------------------------------------------------------------------ */

/** Baseline weekly retention curve, percent of cohort still active. */
const retentionCurve = [100, 78, 69, 64, 61, 59, 57.5, 56.5, 56];

export const retentionWeeks = retentionCurve.map((_, i) => `W${i}`);

function buildRetentionCohorts(): RetentionCell[] {
  const cells: RetentionCell[] = [];
  const cohortCount = 8;
  const random = seededRandom(97);

  for (let c = 0; c < cohortCount; c++) {
    const cohortStart = daysAgo((cohortCount - c + 1) * 7);
    const cohort = cohortStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    // Newer cohorts retain slightly better — and have fewer observed weeks.
    const cohortLift = c * 0.9;
    const observedWeeks = Math.min(retentionCurve.length, cohortCount + 1 - c);

    for (let w = 0; w < observedWeeks; w++) {
      const jitter = (random() - 0.5) * 3.4;
      const retention =
        w === 0 ? 100 : Math.min(99, retentionCurve[w] + cohortLift + jitter);
      cells.push({
        cohort,
        week: retentionWeeks[w],
        retention: Math.round(retention * 10) / 10,
      });
    }
  }

  return cells;
}

export const retentionCohorts: RetentionCell[] = buildRetentionCohorts();

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export const customers: Customer[] = [
  { id: "linear-labs", name: "Linear Labs", plan: "Enterprise", mrr: 8900, seats: 164, health: "Healthy", lastActive: "12m ago" },
  { id: "atlas-systems", name: "Atlas Systems", plan: "Business", mrr: 3420, seats: 58, health: "Healthy", lastActive: "1h ago" },
  { id: "mercury-works", name: "Mercury Works", plan: "Business", mrr: 2760, seats: 44, health: "Watch", lastActive: "2d ago" },
  { id: "northwind", name: "Northwind", plan: "Business", mrr: 2510, seats: 39, health: "Healthy", lastActive: "36m ago" },
  { id: "acme-studio", name: "Acme Studio", plan: "Pro", mrr: 890, seats: 18, health: "Healthy", lastActive: "3h ago" },
  { id: "vanta-labs", name: "Vanta Labs", plan: "Enterprise", mrr: 6240, seats: 112, health: "Watch", lastActive: "5d ago" },
  { id: "relay", name: "Relay", plan: "Pro", mrr: 740, seats: 15, health: "Healthy", lastActive: "22m ago" },
  { id: "summit", name: "Summit", plan: "Starter", mrr: 240, seats: 6, health: "At risk", lastActive: "3w ago" },
  { id: "fieldstone", name: "Fieldstone", plan: "Pro", mrr: 620, seats: 12, health: "Healthy", lastActive: "1h ago" },
  { id: "cobalt-systems", name: "Cobalt Systems", plan: "Business", mrr: 1980, seats: 31, health: "Healthy", lastActive: "4h ago" },
  { id: "juniper-health", name: "Juniper Health", plan: "Enterprise", mrr: 5480, seats: 96, health: "Healthy", lastActive: "55m ago" },
  { id: "beacon-analytics", name: "Beacon Analytics", plan: "Pro", mrr: 810, seats: 16, health: "Watch", lastActive: "6d ago" },
  { id: "driftwood", name: "Driftwood", plan: "Starter", mrr: 180, seats: 4, health: "Healthy", lastActive: "2h ago" },
  { id: "halcyon-media", name: "Halcyon Media", plan: "Pro", mrr: 560, seats: 11, health: "At risk", lastActive: "2w ago" },
  { id: "orbital", name: "Orbital", plan: "Business", mrr: 2140, seats: 35, health: "Healthy", lastActive: "18m ago" },
  { id: "pinewheel", name: "Pinewheel", plan: "Starter", mrr: 290, seats: 7, health: "Healthy", lastActive: "1d ago" },
  { id: "quartz-digital", name: "Quartz Digital", plan: "Pro", mrr: 980, seats: 21, health: "Healthy", lastActive: "40m ago" },
  { id: "riverbed-labs", name: "Riverbed Labs", plan: "Business", mrr: 1650, seats: 27, health: "Watch", lastActive: "3d ago" },
  { id: "solstice", name: "Solstice", plan: "Starter", mrr: 120, seats: 3, health: "Watch", lastActive: "1w ago" },
  { id: "tandem-hq", name: "Tandem HQ", plan: "Pro", mrr: 720, seats: 14, health: "Healthy", lastActive: "5h ago" },
  { id: "umbra-security", name: "Umbra Security", plan: "Enterprise", mrr: 4120, seats: 73, health: "Healthy", lastActive: "1h ago" },
  { id: "waypoint", name: "Waypoint", plan: "Starter", mrr: 210, seats: 5, health: "At risk", lastActive: "4w ago" },
];

export const planNames = ["Starter", "Pro", "Business", "Enterprise"] as const;
export const healthStatuses = ["Healthy", "Watch", "At risk"] as const;

/* ------------------------------------------------------------------ */
/* Activity + insight                                                  */
/* ------------------------------------------------------------------ */

export const recentActivity: ActivityEvent[] = [
  { id: "a1", kind: "upgrade", event: "Upgraded to Business", customer: "Northwind", time: "2h ago" },
  { id: "a2", kind: "expansion", event: "Added 14 seats", customer: "Atlas Systems", time: "5h ago" },
  { id: "a3", kind: "renewal", event: "Renewed annual plan", customer: "Relay", time: "Yesterday" },
  { id: "a4", kind: "contraction", event: "Cancelled 2 seats", customer: "Mercury Works", time: "Yesterday" },
  { id: "a5", kind: "trial", event: "Started a Pro trial", customer: "Acme Studio", time: "2d ago" },
  { id: "a6", kind: "expansion", event: "Added 6 seats", customer: "Juniper Health", time: "3d ago" },
];

export const quickInsight: Insight = {
  headline: "Expansion revenue is up 18%",
  detail:
    "Business plan upgrades generated $4,280 in expansion MRR this month, the best upgrade month this year.",
  breakdown: [
    { label: "Business", mrr: 4280 },
    { label: "Enterprise", mrr: 1360 },
    { label: "Pro", mrr: 940 },
    { label: "Starter", mrr: 210 },
  ],
};
