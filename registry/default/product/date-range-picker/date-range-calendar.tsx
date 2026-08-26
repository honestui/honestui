"use client"

import * as React from "react"
import { DayPicker, dateMatchModifiers } from "react-day-picker"
import type { ClassNames, DateRange as DayPickerDateRange, Matcher } from "react-day-picker"
import { format } from "date-fns"
import type { Locale } from "date-fns"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

import { completeRange, type DateRange } from "./date-range-utils"

/**
 * Shared day button styles. The button fills its grid cell so the clickable
 * area and the range fill cover the whole square.
 */
const DAY_BUTTON_CLASS =
  "inline-flex h-full w-full cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-[var(--hui-radius-1)] p-0 text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] outline-none motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:[outline-offset:-1px]"

/*
 * Range states arrive as class names on the cell (RDP's `range_start`,
 * `range_end`, and `range_middle` keys), never as data attributes. Each key
 * targets its own button so the fill reads as one object: middle cells stay
 * square while endpoints round only their outer edge. Committed ranges use
 * the solid accent; the hover and keyboard preview keeps the same shape
 * with lighter fills.
 */
/*
 * Range states arrive as class names on the cell (RDP's `range_start`,
 * `range_end`, and `range_middle` keys), never as data attributes. Each key
 * targets its own button so the fill reads as one object: middle cells stay
 * square while endpoints round only their outer edge. Committed ranges use
 * the solid accent; the hover and keyboard preview keeps the same shape
 * with lighter fills. Marker classes let the base cell exclude selected
 * days from today-ring and muted-outside treatments.
 */
const CELL_BASE_CLASSES =
  "h-(--hui-space-10) w-(--hui-space-10) p-0 text-center align-middle [&[data-today]:not([data-disabled]):not(.hui-range-endpoint):not(.hui-range-midpoint)>button]:shadow-[inset_0_0_0_1px_var(--hui-color-border-accent-primary)] [&[data-disabled]>button]:pointer-events-none [&[data-disabled]>button]:cursor-not-allowed [&[data-disabled]>button]:text-[var(--hui-color-foreground-base-tertiary)]! [&[data-outside]:not([data-disabled]):not(.hui-range-endpoint):not(.hui-range-midpoint)>button:not(:disabled)]:text-[var(--hui-color-foreground-base-secondary)]"

function buildRangeClassNames(previewing: boolean): Partial<ClassNames> {
  const fill = previewing
    ? "[&>button]:bg-[var(--hui-color-background-accent-primary)]! [&>button]:text-[var(--hui-color-foreground-accent-primary-hover)]!"
    : "[&>button]:bg-[var(--hui-color-background-accent-emphasis)]! [&>button]:text-[var(--hui-color-foreground-accent-emphasis)]! [&>button:hover]:bg-[var(--hui-color-background-accent-emphasis-hover)]!"
  const emphasis = cn(
    "hui-range-endpoint [&>button]:[font-weight:var(--hui-font-weight-medium)]",
    fill
  )
  return {
    range_start: cn(
      "[&>button]:rounded-s-[var(--hui-radius-2)]! [&>button]:rounded-e-none!",
      emphasis
    ),
    range_end: cn(
      "[&>button]:rounded-e-[var(--hui-radius-2)]! [&>button]:rounded-s-none!",
      emphasis
    ),
    // A single-day range carries both keys; the opposite-side resets cancel
    // out, leaving one square-cornered accented cell without tails.
    range_middle:
      "hui-range-midpoint [&>button]:rounded-none! [&>button]:bg-[var(--hui-color-background-accent-primary)]! [&>button]:text-[var(--hui-color-foreground-base-secondary)]!",
  }
}

export interface DateRangeCalendarLabels {
  previousMonth: string
  nextMonth: string
  todayLabel: (formattedDate: string) => string
}

export interface DateRangeCalendarProps {
  /** The committed or temporary range rendered as selected. */
  selected?: DateRange | undefined
  /** Called for every selectable day the user activates. */
  onDaySelect: (date: Date) => void
  /** Earliest selectable date; navigation stops here too. */
  minDate?: Date | undefined
  /** Latest selectable date; navigation stops here too. */
  maxDate?: Date | undefined
  /** Extra availability rules beyond min and max. */
  isDateDisabled?: ((date: Date) => boolean) | undefined
  numberOfMonths?: number
  locale?: Locale | undefined
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined
  showOutsideDays?: boolean
  labels: DateRangeCalendarLabels
  /**
   * When the value changes while the picker stays open, the parent bumps a
   * nonce anchored to the month that should become visible, such as after
   * picking a preset from another month.
   */
  monthSync?: { date: Date; nonce: number } | undefined
}

export function DateRangeCalendar({
  selected,
  onDaySelect,
  minDate,
  maxDate,
  isDateDisabled,
  numberOfMonths = 2,
  locale,
  weekStartsOn,
  showOutsideDays = true,
  labels,
  monthSync,
}: DateRangeCalendarProps) {
  // The calendar mounts once per popover session, so starting from the
  // current selection is enough. No sync effects needed.
  const initialMonth = React.useMemo(() => resolveInitialMonth(selected), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [month, setMonth] = React.useState<Date>(initialMonth)
  const [previewEnd, setPreviewEnd] = React.useState<Date | undefined>(undefined)

  const disabledMatchers = buildDisabledMatchers(minDate, maxDate, isDateDisabled)
  const startNavigationMonth = minDate ? firstOfMonth(minDate) : undefined
  const endNavigationMonth = maxDate ? firstOfMonth(maxDate) : undefined

  // Adjusting state during render is the React-approved way to react to a
  // parent-driven "show this month" signal without effect cascades.
  const [syncedNonce, setSyncedNonce] = React.useState(monthSync?.nonce)
  if (monthSync && monthSync.nonce !== syncedNonce) {
    setSyncedNonce(monthSync.nonce)
    setMonth(
      clampToNavigation(
        firstOfMonth(monthSync.date),
        startNavigationMonth,
        endNavigationMonth
      )
    )
    if (previewEnd) {
      setPreviewEnd(undefined)
    }
  }
  const selectingEnd = Boolean(selected?.from && !selected?.to)
  const displayed: DayPickerDateRange | undefined =
    selectingEnd && selected?.from && previewEnd && !isSameCalendarDay(selected.from, previewEnd)
      ? completeRange(selected.from, previewEnd)
      : selected

  const previewing = Boolean(
    displayed && displayed.from && displayed.to && !isSameCalendarDay(displayed.from, displayed.to) && selectingEnd
  )
  const rangeClassNames = buildRangeClassNames(previewing)

  const previousDisabled = startNavigationMonth ? month.getTime() <= startNavigationMonth.getTime() : false
  const nextDisabled = endNavigationMonth
    ? addMonths(firstOfMonth(month), numberOfMonths - 1).getTime() >= endNavigationMonth.getTime()
    : false

  // Hover and keyboard focus preview the proposed range while only the
  // start date exists. Unavailable dates never become the previewed end.
  const updatePreviewEnd = (date: Date, unavailable: boolean) => {
    if (!selectingEnd || unavailable) {
      return
    }
    setPreviewEnd(date)
  }

  const clearPreviewEnd = () => {
    setPreviewEnd(undefined)
  }

  return (
    <div className="flex flex-col gap-[var(--hui-space-3)]">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="link"
          size="icon-sm"
          aria-label={labels.previousMonth}
          disabled={previousDisabled}
          onClick={() => setMonth(shiftMonth(month, -1, startNavigationMonth, endNavigationMonth))}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          variant="link"
          size="icon-sm"
          aria-label={labels.nextMonth}
          disabled={nextDisabled}
          onClick={() => setMonth(shiftMonth(month, 1, startNavigationMonth, endNavigationMonth))}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <DayPicker
        mode="range"
        excludeDisabled
        selected={displayed}
        onSelect={(range, triggerDate) => {
          void range
          if (!triggerDate || matchersReject(disabledMatchers, triggerDate)) {
            return
          }
          onDaySelect(triggerDate)
        }}
        onDayMouseEnter={(date, modifiers) => {
          updatePreviewEnd(date, modifiers.disabled === true)
        }}
        onDayMouseLeave={() => {
          clearPreviewEnd()
        }}
        onDayFocus={(date, modifiers) => {
          updatePreviewEnd(date, modifiers.disabled === true)
        }}
        onDayBlur={() => {
          clearPreviewEnd()
        }}
        month={month}
        onMonthChange={(nextMonthValue) => {
          setMonth(
            clampToNavigation(nextMonthValue, startNavigationMonth, endNavigationMonth)
          )
        }}
        numberOfMonths={numberOfMonths}
        hideNavigation
        showOutsideDays={showOutsideDays}
        autoFocus
        locale={locale}
        weekStartsOn={weekStartsOn}
        disabled={disabledMatchers}
        classNames={{
          months: "flex items-start gap-x-[var(--hui-space-8)]",
          month: "flex flex-col",
          month_caption:
            "flex h-(--hui-space-9) items-center justify-center text-center text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)]",
          caption_label: "",
          nav: "hidden",
          button_previous: "hidden",
          button_next: "hidden",
          weekdays: "",
          weekday:
            "w-(--hui-space-10) pb-(--hui-space-2) text-center text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-mini)]",
          week: "min-w-max",
          weeks: "border-collapse",
          month_grid: "border-collapse",
          day: CELL_BASE_CLASSES,
          day_button: DAY_BUTTON_CLASS,
          today: "",
          outside: "",
          disabled: "",
          range_middle: rangeClassNames.range_middle ?? "",
          range_start: rangeClassNames.range_start ?? "",
          range_end: rangeClassNames.range_end ?? "",
          selected: "",
          footer: "sr-only",
        }}
        labels={{
          labelDayButton: (date, modifiers, options) =>
            buildDayLabel(date, modifiers, options ?? {}, locale, labels.todayLabel),
        }}
      />
    </div>
  )
}

function buildDisabledMatchers(
  minDate: Date | undefined,
  maxDate: Date | undefined,
  isDateDisabled: ((date: Date) => boolean) | undefined
): Matcher[] {
  const matchers: Matcher[] = []
  if (minDate) {
    matchers.push({ before: minDate })
  }
  if (maxDate) {
    matchers.push({ after: maxDate })
  }
  if (isDateDisabled) {
    matchers.push(isDateDisabled)
  }
  return matchers
}

function matchersReject(matchers: Matcher[], date: Date): boolean {
  return matchers.length > 0 && dateMatchModifiers(date, matchers)
}

function resolveInitialMonth(selected: DateRange | undefined): Date {
  const anchor = selected?.from ?? selected?.to ?? new Date()
  return firstOfMonth(anchor)
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function shiftMonth(
  month: Date,
  amount: number,
  startLimit: Date | undefined,
  endLimit: Date | undefined
): Date {
  let candidate = addMonths(month, amount)
  if (startLimit && candidate < startLimit) {
    candidate = startLimit
  }
  if (endLimit && candidate > endLimit) {
    candidate = endLimit
  }
  return candidate
}

function clampToNavigation(
  month: Date,
  startMonth: Date | undefined,
  endMonth: Date | undefined
): Date {
  return shiftMonth(month, 0, startMonth, endMonth)
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function buildDayLabel(
  date: Date,
  modifiers: Record<string, boolean | undefined>,
  options: { locale?: Locale },
  locale: Locale | undefined,
  todayLabel: (formattedDate: string) => string
): string {
  let label = format(date, "EEEE, MMMM d, yyyy", { ...(options ?? {}), locale })
  if (modifiers.range_start && modifiers.range_end) {
    label += ", single day range"
  } else if (modifiers.range_start) {
    label += ", start of range"
  } else if (modifiers.range_end) {
    label += ", end of range"
  } else if (modifiers.range_middle) {
    label += ", within range"
  }
  if (modifiers.today) {
    label = todayLabel(label)
  }
  return label
}
