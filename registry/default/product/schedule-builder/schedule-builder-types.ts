/** A time of day on a 24-hour clock. */
export type ScheduleTime = {
  /** 0 to 23. */
  hour: number
  /** 0 to 59. */
  minute: number
}

/** 0 is Sunday and 6 is Saturday, as in cron. */
export type ScheduleWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * A schedule in the shapes the friendly controls can edit. Anything else is
 * kept as a raw cron expression.
 */
export type Schedule =
  /** Every `interval` minutes, starting on the hour. `interval` divides 60. */
  | { kind: "minutes"; interval: number }
  /** Every `interval` hours at `minute` past, starting at midnight. `interval` divides 24. */
  | { kind: "hours"; interval: number; minute: number }
  | { kind: "daily"; time: ScheduleTime }
  | { kind: "weekly"; days: readonly ScheduleWeekday[]; time: ScheduleTime }
  /** On `day` of every month. Months without that day are skipped. */
  | { kind: "monthly"; day: number; time: ScheduleTime }
  | { kind: "cron"; expression: string }

export type ScheduleKind = Schedule["kind"]

export type CronFieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek"

/** A parsed five-field cron expression. Every set is sorted and free of duplicates. */
export type CronSchedule = {
  minutes: readonly number[]
  hours: readonly number[]
  daysOfMonth: readonly number[]
  months: readonly number[]
  /** 0 to 6, Sunday first. A 7 in the expression is read as Sunday. */
  daysOfWeek: readonly number[]
  /**
   * Whether the day-of-month field started with `*`. When either day field
   * does, a day must match both fields; when neither does, either one is enough.
   */
  dayOfMonthStar: boolean
  dayOfWeekStar: boolean
}

export type CronError =
  | { code: "fieldCount"; count: number }
  | { code: "invalidValue"; field: CronFieldName; token: string }
  | { code: "outOfRange"; field: CronFieldName; value: number; min: number; max: number }
  | { code: "invalidStep"; field: CronFieldName; token: string }

export type CronParseResult =
  | { ok: true; schedule: CronSchedule }
  | { ok: false; error: CronError }

export type ScheduleRun = {
  /** The instant the job runs. */
  date: Date
  /**
   * Set when the wall-clock time did not exist on that day because the clocks
   * moved forward, so the run happens that much later.
   */
  shifted: boolean
}

export type ScheduleBuilderLabels = {
  frequency: string
  kinds: Record<ScheduleKind, string>
  every: string
  minutesUnit: (interval: number) => string
  hoursUnit: (interval: number) => string
  atMinute: string
  minutePast: (minute: number) => string
  at: string
  on: string
  onDay: string
  dayOfMonth: (day: number) => string
  days: string
  expression: string
  expressionHint: string
  cronFieldNames: Record<CronFieldName, string>
  summary: string
  timeZone: string
  nextRuns: (count: number) => string
  noRuns: string
  /** The full reason a run is later than its wall-clock time. */
  shifted: string
  /** The short tag beside a shifted run. */
  shiftedShort: string
  skipsShortMonths: (day: number) => string
  error: (error: CronError) => string
  /* Sentences. */
  everyMinute: string
  everyMinutes: (interval: number) => string
  everyHourAt: (minute: number) => string
  everyHoursAt: (interval: number, minute: number) => string
  atTimes: (times: string) => string
  atMinutesPastHours: (minutes: string, hours: string) => string
  everyDay: string
  onWeekdays: string
  onWeekends: string
  onDaysOfWeek: (days: string) => string
  /** Leads the sentence when a list of times follows, as in "Every weekday at 9:00 AM". */
  everyWeekday: string
  everyWeekendDay: string
  everyDaysOfWeek: (days: string) => string
  onDaysOfMonth: (days: string, count: number) => string
  dayOfMonthOrWeek: (daysOfMonth: string, daysOfWeek: string) => string
  dayOfMonthAndWeek: (daysOfMonth: string, daysOfWeek: string) => string
  inMonths: (months: string) => string
}
