"use client"

import * as React from "react"
import { CircleAlert as CircleAlertIcon, Clock as ClockIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Input } from "@/registry/default/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Toggle, ToggleGroup } from "@/registry/default/ui/toggle"

import type {
  CronError,
  Schedule,
  ScheduleBuilderLabels,
  ScheduleKind,
  ScheduleRun,
  ScheduleTime,
  ScheduleWeekday,
} from "./schedule-builder-types"
import {
  HOUR_INTERVALS,
  MINUTE_INTERVALS,
  convertSchedule,
  defaultScheduleBuilderLabels,
  describeCron,
  formatWeekday,
  getNextRuns,
  isValidTimeZone,
  parseCron,
  scheduleFromCron,
  scheduleToCron,
} from "./schedule-builder-utils"

export type {
  CronError,
  CronFieldName,
  CronParseResult,
  CronSchedule,
  Schedule,
  ScheduleBuilderLabels,
  ScheduleKind,
  ScheduleRun,
  ScheduleTime,
  ScheduleWeekday,
} from "./schedule-builder-types"
export {
  convertSchedule,
  defaultScheduleBuilderLabels,
  describeCron,
  getNextRuns,
  parseCron,
  scheduleFromCron,
  scheduleToCron,
} from "./schedule-builder-utils"

/** 12px meta text. */
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"
/** 13px control and label text. */
const labelText =
  "[font-size:var(--hui-font-size-control,13px)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:20px]"
const bodyText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]"

const KIND_ORDER: readonly ScheduleKind[] = ["minutes", "hours", "daily", "weekly", "monthly", "cron"]
const WEEK_ORDER: readonly ScheduleWeekday[] = [1, 2, 3, 4, 5, 6, 0]
const COMMON_TIME_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
]

export type ScheduleBuilderChangeDetails = {
  /** The schedule as the controls see it. */
  schedule: Schedule
  /** Whether the expression parses. An invalid one is still reported, so a form can say why it cannot save. */
  valid: boolean
  error: CronError | null
  /** The sentence the summary shows, or `null` while the expression is invalid. */
  description: string | null
}

type ScheduleBuilderContextValue = {
  id: string
  schedule: Schedule
  expression: string
  error: CronError | null
  description: string | null
  timeZone: string
  timeZones: readonly string[]
  setTimeZone: (timeZone: string) => void
  update: (schedule: Schedule) => void
  locale: Intl.LocalesArgument | undefined
  now: Date | null
  runCount: number
  disabled: boolean
  labels: ScheduleBuilderLabels
}

const ScheduleBuilderContext = React.createContext<ScheduleBuilderContextValue | null>(null)

function useScheduleBuilder(part: string) {
  const context = React.useContext(ScheduleBuilderContext)
  if (!context) throw new Error(`${part} must be used within a ScheduleBuilder.`)
  return context
}

function useControllableState<T>(controlled: T | undefined, initial: T) {
  const [internal, setInternal] = React.useState(initial)
  return [controlled === undefined ? internal : controlled, setInternal] as const
}

/** The viewer's zone is unknown on the server, so it is read after mounting. */
function useViewerTimeZone() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null
  )
}
const noopSubscribe = () => () => {}

let clockReading: Date | null = null

/** The current time, refreshed every minute. Read after mounting, so the server and browser render the same markup. */
function useMinuteClock() {
  return React.useSyncExternalStore(subscribeToClock, readClock, () => null)
}
function readClock() {
  if (clockReading === null || Date.now() - clockReading.getTime() >= 60_000) clockReading = new Date()
  return clockReading
}
function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(timer)
}

const expressionOf = (schedule: Schedule) =>
  schedule.kind === "cron" ? schedule.expression : scheduleToCron(schedule)

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export type ScheduleBuilderProps = Omit<React.ComponentProps<"section">, "defaultValue" | "onChange"> & {
  /** A five-field cron expression. Friendly shapes open in the friendly controls; anything else opens as cron. */
  value?: string | undefined
  defaultValue?: string | undefined
  /** Runs on every edit, including while a typed expression is invalid. Check `details.valid` before saving. */
  onValueChange?: ((expression: string, details: ScheduleBuilderChangeDetails) => void) | undefined
  /** The IANA zone the schedule runs in and the preview is shown in. */
  timeZone?: string | undefined
  /** Defaults to the viewer's zone. */
  defaultTimeZone?: string | undefined
  onTimeZoneChange?: ((timeZone: string) => void) | undefined
  /** Zones offered in the menu. Defaults to the viewer's zone, UTC, and a few large cities. */
  timeZones?: readonly string[] | undefined
  /** How many upcoming runs the preview lists. Defaults to 5. */
  runCount?: number | undefined
  /** The instant the preview counts from. Defaults to the current time, refreshed every minute. */
  now?: Date | undefined
  locale?: Intl.LocalesArgument | undefined
  disabled?: boolean | undefined
  labels?: Partial<ScheduleBuilderLabels> | undefined
}

/**
 * Edits a recurring schedule as one cron expression. Common shapes get
 * friendly controls; the summary says the schedule in a sentence, and the
 * preview lists the next runs in the chosen time zone.
 */
function ScheduleBuilder({
  value,
  defaultValue = "0 9 * * 1-5",
  onValueChange,
  timeZone: timeZoneProp,
  defaultTimeZone,
  onTimeZoneChange,
  timeZones: timeZonesProp,
  runCount = 5,
  now: nowProp,
  locale,
  disabled = false,
  labels: labelsProp,
  className,
  children,
  ...props
}: ScheduleBuilderProps) {
  const id = React.useId()
  const labels = React.useMemo(
    () => ({ ...defaultScheduleBuilderLabels, ...labelsProp }),
    [labelsProp]
  )

  const [expression, setExpression] = useControllableState(value, defaultValue)
  const [schedule, setSchedule] = React.useState<Schedule>(() => scheduleFromCron(expression))

  // A new expression from outside replaces the draft; the draft's own expression does not.
  const [syncedExpression, setSyncedExpression] = React.useState(expression)
  if (expression !== syncedExpression) {
    setSyncedExpression(expression)
    if (expression !== expressionOf(schedule)) setSchedule(scheduleFromCron(expression))
  }

  const viewerTimeZone = useViewerTimeZone()
  const [chosenTimeZone, setChosenTimeZone] = useControllableState<string | undefined>(
    timeZoneProp,
    defaultTimeZone
  )
  const timeZone = chosenTimeZone ?? viewerTimeZone ?? "UTC"
  const timeZones = React.useMemo(() => {
    const zones = timeZonesProp ?? [viewerTimeZone, ...COMMON_TIME_ZONES]
    return [...new Set([timeZone, ...zones].filter((zone): zone is string => !!zone))].filter(
      isValidTimeZone
    )
  }, [timeZonesProp, viewerTimeZone, timeZone])

  const clock = useMinuteClock()
  const now = nowProp ?? clock

  const parsed = parseCron(expression)
  const error = parsed.ok ? null : parsed.error
  const description = parsed.ok ? describeCron(parsed.schedule, { locale, labels }) : null

  const update = (next: Schedule) => {
    const nextExpression = expressionOf(next)
    const result = parseCron(nextExpression)
    setSchedule(next)
    setSyncedExpression(nextExpression)
    setExpression(nextExpression)
    onValueChange?.(nextExpression, {
      schedule: next,
      valid: result.ok,
      error: result.ok ? null : result.error,
      description: result.ok ? describeCron(result.schedule, { locale, labels }) : null,
    })
  }

  const context: ScheduleBuilderContextValue = {
    id,
    schedule,
    expression,
    error,
    description,
    timeZone,
    timeZones,
    setTimeZone: (next) => {
      setChosenTimeZone(next)
      onTimeZoneChange?.(next)
    },
    update,
    locale,
    now,
    runCount,
    disabled,
    labels,
  }

  return (
    <ScheduleBuilderContext.Provider value={context}>
      <section
        data-slot="schedule-builder"
        data-invalid={error ? "" : undefined}
        aria-labelledby={props["aria-label"] || props["aria-labelledby"] ? undefined : `${id}-summary-label`}
        className={cn(
          "@container flex w-full min-w-0 flex-col overflow-hidden rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-[var(--hui-color-foreground-base-primary)]",
          "[&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <ScheduleBuilderControls />
            <ScheduleBuilderSummary />
            <ScheduleBuilderPreview />
          </>
        )}
      </section>
    </ScheduleBuilderContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

function Row({
  label,
  labelId,
  alignStart = false,
  children,
}: {
  label: string
  labelId: string
  alignStart?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-wrap items-center gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-2)]",
        alignStart && "flex-1 basis-80 items-start"
      )}
    >
      <span
        id={labelId}
        className={cn(
          "shrink-0 text-[var(--hui-color-foreground-base-secondary)]",
          alignStart && "pt-2",
          labelText
        )}
      >
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[var(--hui-space-3)]">{children}</div>
    </div>
  )
}

const toTimeValue = (time: ScheduleTime) =>
  `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`

function TimeInput({
  time,
  labelledBy,
  onChange,
}: {
  time: ScheduleTime
  labelledBy: string
  onChange: (time: ScheduleTime) => void
}) {
  const { disabled } = useScheduleBuilder("ScheduleBuilderControls")
  return (
    <Input
      type="time"
      step={60}
      required
      value={toTimeValue(time)}
      disabled={disabled}
      aria-labelledby={labelledBy}
      onChange={(event) => {
        const match = /^(\d{2}):(\d{2})/.exec(event.currentTarget.value)
        if (match) onChange({ hour: Number(match[1]), minute: Number(match[2]) })
      }}
      className="w-32 tabular-nums [&_input]:[color-scheme:light_dark]"
    />
  )
}

function NumberSelect({
  value,
  options,
  format,
  labelledBy,
  onChange,
  width = "w-20",
}: {
  value: number
  options: readonly number[]
  format: (value: number) => string
  labelledBy: string
  onChange: (value: number) => void
  width?: string
}) {
  const { disabled } = useScheduleBuilder("ScheduleBuilderControls")
  const values = options.includes(value) ? options : [...options, value].sort((a, b) => a - b)
  const items = values.map((option) => ({ value: String(option), label: format(option) }))
  return (
    <Select
      items={items}
      value={String(value)}
      onValueChange={(next) => next !== null && onChange(Number(next))}
      disabled={disabled}
    >
      <SelectTrigger aria-labelledby={labelledBy} className={cn(width, "tabular-nums")}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

const MINUTES_OF_HOUR = Array.from({ length: 12 }, (_, index) => index * 5)
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, index) => index + 1)

/** The kind menu and the controls for the chosen kind. */
function ScheduleBuilderControls({ className, ...props }: React.ComponentProps<"div">) {
  const { id, schedule, update, disabled, labels, locale, error } =
    useScheduleBuilder("ScheduleBuilderControls")
  const kindItems = KIND_ORDER.map((kind) => ({ value: kind, label: labels.kinds[kind] }))

  return (
    <div
      data-slot="schedule-builder-controls"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-[var(--hui-space-6)] gap-y-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-5)]",
        className
      )}
      {...props}
    >
      <Row label={labels.frequency} labelId={`${id}-kind`}>
        <Select
          items={kindItems}
          value={schedule.kind}
          onValueChange={(kind) => kind && update(convertSchedule(schedule, kind as ScheduleKind))}
          disabled={disabled}
        >
          <SelectTrigger aria-labelledby={`${id}-kind`} className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {kindItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Row>

      {schedule.kind === "minutes" && (
        <Row label={labels.every} labelId={`${id}-every`}>
          <NumberSelect
            value={schedule.interval}
            options={MINUTE_INTERVALS}
            format={String}
            labelledBy={`${id}-every ${id}-unit`}
            onChange={(interval) => update({ kind: "minutes", interval })}
          />
          <span id={`${id}-unit`} className={cn("text-[var(--hui-color-foreground-base-secondary)]", labelText)}>
            {labels.minutesUnit(schedule.interval)}
          </span>
        </Row>
      )}

      {schedule.kind === "hours" && (
        <>
          <Row label={labels.every} labelId={`${id}-every`}>
            <NumberSelect
              value={schedule.interval}
              options={HOUR_INTERVALS}
              format={String}
              labelledBy={`${id}-every ${id}-unit`}
              onChange={(interval) => update({ ...schedule, interval })}
            />
            <span id={`${id}-unit`} className={cn("text-[var(--hui-color-foreground-base-secondary)]", labelText)}>
              {labels.hoursUnit(schedule.interval)}
            </span>
          </Row>
          <Row label={labels.atMinute} labelId={`${id}-minute`}>
            <NumberSelect
              value={schedule.minute}
              options={MINUTES_OF_HOUR}
              format={labels.minutePast}
              labelledBy={`${id}-minute`}
              onChange={(minute) => update({ ...schedule, minute })}
            />
          </Row>
        </>
      )}

      {schedule.kind === "weekly" && (
        <Row label={labels.on} labelId={`${id}-days`}>
          <ToggleGroup
            multiple
            aria-labelledby={`${id}-days`}
            value={schedule.days.map(String)}
            disabled={disabled}
            onValueChange={(next: unknown[]) => {
              const days = (next as string[]).map(Number) as ScheduleWeekday[]
              // A weekly schedule needs at least one day; the last one stays pressed.
              if (days.length > 0) update({ ...schedule, days: [...days].sort((a, b) => a - b) })
            }}
            className="max-w-full flex-wrap"
          >
            {WEEK_ORDER.map((day) => (
              <Toggle
                key={day}
                value={String(day)}
                aria-label={formatWeekday(day, locale)}
                className="min-w-8 px-[var(--hui-space-2)] @sm:min-w-10"
              >
                <span aria-hidden="true" className="@max-sm:hidden">{formatWeekday(day, locale, "short")}</span>
                <span aria-hidden="true" className="@sm:hidden">{formatWeekday(day, locale, "narrow")}</span>
              </Toggle>
            ))}
          </ToggleGroup>
        </Row>
      )}

      {schedule.kind === "monthly" && (
        <Row label={labels.onDay} labelId={`${id}-day`}>
          <NumberSelect
            value={schedule.day}
            options={DAYS_OF_MONTH}
            format={labels.dayOfMonth}
            labelledBy={`${id}-day`}
            onChange={(day) => update({ ...schedule, day })}
          />
        </Row>
      )}

      {(schedule.kind === "daily" || schedule.kind === "weekly" || schedule.kind === "monthly") && (
        <Row label={labels.at} labelId={`${id}-time`}>
          <TimeInput
            time={schedule.time}
            labelledBy={`${id}-time`}
            onChange={(time) => update({ ...schedule, time })}
          />
        </Row>
      )}

      {schedule.kind === "cron" && (
        <Row label={labels.expression} labelId={`${id}-expression`} alignStart>
          <div className="flex w-full min-w-0 flex-col gap-[var(--hui-space-2)]">
            <Input
              value={schedule.expression}
              disabled={disabled}
              spellCheck={false}
              autoComplete="off"
              aria-labelledby={`${id}-expression`}
              aria-describedby={`${id}-hint ${id}-error`}
              aria-invalid={error ? true : undefined}
              onChange={(event) => update({ kind: "cron", expression: event.currentTarget.value })}
              className="w-full max-w-72 [&_input]:font-mono [&_input]:tabular-nums"
            />
            <p
              id={`${id}-hint`}
              className={cn("m-0 font-mono text-[var(--hui-color-foreground-base-secondary)]", metaText)}
            >
              {labels.expressionHint}
            </p>
          </div>
        </Row>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

/** The schedule in a sentence and as cron, or why the expression cannot be read. */
function ScheduleBuilderSummary({ className, ...props }: React.ComponentProps<"div">) {
  const { id, expression, description, error, schedule, labels } =
    useScheduleBuilder("ScheduleBuilderSummary")
  const note =
    schedule.kind === "monthly" && schedule.day > 28 ? labels.skipsShortMonths(schedule.day) : null

  return (
    <div
      data-slot="schedule-builder-summary"
      data-state={error ? "error" : "valid"}
      className={cn(
        "flex min-w-0 flex-col gap-[var(--hui-space-1)] bg-[var(--hui-color-background-base-secondary)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-[var(--hui-space-3)] gap-y-[var(--hui-space-1)]">
        <span
          id={`${id}-summary-label`}
          className={cn("shrink-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}
        >
          {labels.summary}
        </span>
        {/* Announced as the schedule changes. Kept mounted so the first change is read. */}
        <p
          id={`${id}-error`}
          role="status"
          className={cn(
            "m-0 flex min-w-0 flex-1 basis-48 items-start gap-[var(--hui-space-2)] [font-weight:var(--hui-font-weight-medium)]",
            bodyText
          )}
        >
          {error ? (
            <>
              <CircleAlertIcon
                aria-hidden="true"
                className="mt-[3px] size-3.5 shrink-0 text-[var(--hui-color-foreground-danger-primary)]"
              />
              <span className="min-w-0 break-words [font-weight:var(--hui-font-weight-regular)]">
                {labels.error(error)}
              </span>
            </>
          ) : (
            <span className="min-w-0 break-words">{description}</span>
          )}
        </p>
        <code
          data-slot="schedule-builder-expression"
          className={cn(
            "min-w-0 break-all font-mono text-[var(--hui-color-foreground-base-secondary)] tabular-nums",
            metaText
          )}
        >
          {expression.trim() || "—"}
        </code>
      </div>
      {note && (
        <p className={cn("m-0 text-[var(--hui-color-foreground-base-secondary)]", metaText)}>{note}</p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                    */
/* -------------------------------------------------------------------------- */

function zoneLabel(timeZone: string, locale: Intl.LocalesArgument | undefined, at: Date) {
  const offset =
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value ?? ""
  const name = timeZone === "UTC" ? "UTC" : (timeZone.split("/").pop() ?? timeZone).replaceAll("_", " ")
  return offset && offset !== "GMT" && name !== "UTC" ? `${name} (${offset})` : name
}

function relativeTime(target: Date, now: Date, locale: Intl.LocalesArgument | undefined) {
  const format = new Intl.RelativeTimeFormat(locale as string | undefined, { numeric: "auto" })
  const minutes = Math.round((target.getTime() - now.getTime()) / 60_000)
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 48) return format.format(hours, "hour")
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 60) return format.format(days, "day")
  return format.format(Math.round(days / 30), "month")
}

/** The time zone menu and the next runs, read in that zone. */
function ScheduleBuilderPreview({ className, ...props }: React.ComponentProps<"div">) {
  const { id, expression, error, timeZone, timeZones, setTimeZone, locale, now, runCount, disabled, labels } =
    useScheduleBuilder("ScheduleBuilderPreview")

  const runs: ScheduleRun[] = React.useMemo(
    () => (now && !error ? getNextRuns(expression, { from: now, count: runCount, timeZone }) : []),
    [expression, error, now, runCount, timeZone]
  )
  const zoneItems = timeZones.map((zone) => ({
    value: zone,
    label: zoneLabel(zone, locale, now ?? new Date(0)),
  }))
  const dateFormat = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  })
  const yearFormat = new Intl.DateTimeFormat(locale, { year: "numeric", timeZone })
  const timeFormat = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone })
  const thisYear = now ? yearFormat.format(now) : null

  return (
    <div
      data-slot="schedule-builder-preview"
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-[var(--hui-space-4)] gap-y-[var(--hui-space-2)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]">
        <span
          id={`${id}-runs`}
          className={cn("[font-weight:var(--hui-font-weight-medium)]", labelText)}
        >
          {labels.nextRuns(runCount)}
        </span>
        <div className="flex items-center gap-[var(--hui-space-3)]">
          <span id={`${id}-zone`} className="sr-only">
            {labels.timeZone}
          </span>
          <Select
            items={zoneItems}
            value={timeZone}
            onValueChange={(zone) => zone && setTimeZone(zone)}
            disabled={disabled}
          >
            <SelectTrigger size="sm" aria-labelledby={`${id}-zone`} className="min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {zoneItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {now !== null && !error && runs.length === 0 ? (
        <p className={cn("m-0 px-[var(--hui-space-5)] pb-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)]", labelText)}>
          {labels.noRuns}
        </p>
      ) : (
        <ol
          aria-labelledby={`${id}-runs`}
          aria-busy={now === null || undefined}
          className="m-0 flex list-none flex-col p-0 pb-[var(--hui-space-2)]"
        >
          {(now === null || error ? Array.from({ length: runCount }, () => null) : runs).map((run, index) => (
            <li
              key={run ? run.date.getTime() : index}
              data-slot="schedule-builder-run"
              className={cn(
                "grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-[var(--hui-space-4)] px-[var(--hui-space-5)] tabular-nums @sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]",
                labelText
              )}
            >
              {run && now ? (
                <>
                  <span className="min-w-0 truncate text-[var(--hui-color-foreground-base-primary)]">
                    {dateFormat.format(run.date)}
                    {yearFormat.format(run.date) !== thisYear && `, ${yearFormat.format(run.date)}`}
                  </span>
                  <span className="flex min-w-0 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] [font-weight:var(--hui-font-weight-medium)] @max-sm:hidden">
                    {timeFormat.format(run.date)}
                    {run.shifted && (
                      <span
                        data-slot="schedule-builder-shifted"
                        title={labels.shifted}
                        className={cn(
                          "inline-flex items-center gap-[var(--hui-space-1)] text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-regular)]",
                          metaText
                        )}
                      >
                        <ClockIcon
                          aria-hidden="true"
                          className="size-3.5 text-[var(--hui-color-foreground-attention-primary)]"
                        />
                        <span className="sr-only">. </span>
                        {labels.shiftedShort}
                      </span>
                    )}
                  </span>
                  <span className={cn("text-end text-[var(--hui-color-foreground-base-secondary)]", metaText)}>
                    <span className="@sm:hidden">{timeFormat.format(run.date)} · </span>
                    {relativeTime(run.date, now, locale)}
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="h-2.5 w-24 rounded-full bg-[var(--hui-color-background-neutral-secondary)]" />
                  <span aria-hidden="true" className="h-2.5 w-14 rounded-full bg-[var(--hui-color-background-neutral-secondary)] @max-sm:hidden" />
                  <span aria-hidden="true" className="h-2.5 w-16 justify-self-end rounded-full bg-[var(--hui-color-background-neutral-secondary)]" />
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export { ScheduleBuilder, ScheduleBuilderControls, ScheduleBuilderPreview, ScheduleBuilderSummary }
