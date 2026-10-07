export type DateRangeKey = "7d" | "30d" | "90d" | "ytd";

export interface DateRangeOption {
  key: DateRangeKey;
  label: string;
  /** Label used in "vs." comparison copy, e.g. "previous 30 days". */
  comparisonLabel: string;
}

export type RevenueMetricKey = "revenue" | "new-mrr" | "expansion" | "churned";

export interface RevenueMetricOption {
  key: RevenueMetricKey;
  label: string;
}

/** Type alias (not interface) so it satisfies the chart data constraint. */
export type RevenuePoint = {
  /** ISO date (day the point represents, or period start for aggregates). */
  date: string;
  /** Display label used on the axis and in tooltips, e.g. "Aug 19". */
  label: string;
  current: number;
  previous: number;
};

export type MetricSentiment = "positive" | "negative";

export interface Metric {
  id: string;
  label: string;
  value: string;
  /** Signed change vs. the previous period, e.g. "+12.4%". */
  change: string;
  /** Whether the change is good news — a falling churn rate is positive. */
  sentiment: MetricSentiment;
}

/** Type alias (not interface) so it satisfies the chart data constraint. */
export type AcquisitionChannel = {
  channel: string;
  sessions: number;
  /** Visitor → customer conversion rate, in percent. */
  conversionRate: number;
  customers: number;
};

export interface FunnelStage {
  stage: string;
  value: number;
}

/** Type alias (not interface) so it satisfies the chart data constraint. */
export type RetentionCell = {
  /** Cohort label, e.g. "Jul 6". */
  cohort: string;
  /** Week offset label, e.g. "W3". */
  week: string;
  /** Percentage of the cohort still active, 0–100. */
  retention: number;
};

export type PlanName = "Starter" | "Pro" | "Business" | "Enterprise";

export type HealthStatus = "Healthy" | "Watch" | "At risk";

export interface Customer {
  id: string;
  name: string;
  plan: PlanName;
  mrr: number;
  seats: number;
  health: HealthStatus;
  lastActive: string;
}

export type ActivityKind =
  | "upgrade"
  | "expansion"
  | "renewal"
  | "contraction"
  | "trial";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  event: string;
  customer: string;
  time: string;
}

export interface Insight {
  headline: string;
  detail: string;
  /** Expansion MRR this month by plan, largest first. */
  breakdown: Array<{ label: string; mrr: number }>;
}
