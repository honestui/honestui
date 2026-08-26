"use client"

import * as React from "react"
import {
  eachDayOfInterval,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns"
import type { Locale } from "date-fns"
import {
  Calendar as CalendarIcon,
  X as CloseIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/default/ui/popover"
import { Separator } from "@/registry/default/ui/separator"

import {
  formatDateLabel,
  formatTriggerText,
  isRangeComplete,
} from "./date-range-utils"
import type { DateRange } from "./date-range-utils"
import {
  DateRangeCalendar,
  type DateRangeCalendarLabels,
} from "./date-range-calendar"
import {
  DateRangePresets,
  getDateRangePresets,
} from "./date-range-presets"
import type { DateRangePreset } from "./date-range-presets"

export type { DateRange, DateRangePreset }
export { getDateRangePresets }

export interface DateRangePickerLabels extends DateRangeCalendarLabels {
  /** Accessible name for the trigger clear action. */
  clearAction: string
  /** Shown in the trigger while only the start date is picked. */
  selectEndDate: string
  /** Accessible name for the preset group. */
  presetsGroup?: string | undefined
  /** Announced when the start date has been picked. */
  startSelected?: ((formattedStartDate: string) => string) | undefined
  /** Announced when a complete range is picked or applied. */
  rangeSelected?: ((formattedFrom: string, formattedTo: string) => string) | undefined
  /** Announced when the value clears. */
  cleared?: string | undefined
}

const DEFAULT_LABELS: DateRangePickerLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  todayLabel: (formatted) => `Today, ${formatted}`,
  clearAction: "Clear date range",
  selectEndDate: "Select end date",
  presetsGroup: "Quick ranges",
  startSelected: (formatted) =>
    `Start date selected, ${formatted}. Choose an end date.`,
  rangeSelected: (from, to) => `Date range selected, ${from} through ${to}.`,
  cleared: "Date range cleared.",
}

export interface DateRangePickerProps
  extends Omit<
    React.ComponentProps<typeof Button>,
    | "onChange"
    | "value"
    | "defaultValue"
    | "children"
    | "disabled"
    | "required"
    | "type"
    | "variant"
    | "size"
    | "appearance"
  > {
  /** Controlled range. Omit to let the picker manage its own value. */
  value?: DateRange | undefined
  /** Initial range for uncontrolled use. */
  defaultValue?: DateRange | undefined
  /** Called with the committed range, or undefined once cleared. */
  onValueChange?: ((range: DateRange | undefined) => void) | undefined
  /** Controlled popover state. */
  open?: boolean | undefined
  /** Initial popover state for uncontrolled use. */
  defaultOpen?: boolean | undefined
  /** Called whenever the popover opens or closes. */
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Earliest selectable date; navigation stops here too. */
  minDate?: Date | undefined
  /** Latest selectable date; navigation stops here too. */
  maxDate?: Date | undefined
  /** Extra availability rules beyond min and max. */
  isDateDisabled?: ((date: Date) => boolean) | undefined
  /** Visible calendar months. One month is used on narrow screens. */
  numberOfMonths?: number
  /** A date-fns locale used for formatting and week starts. */
  locale?: Locale | undefined
  /** Overrides the locale's first day of the week. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined
  /** Shows dates from adjacent months. */
  showOutsideDays?: boolean
  /** Optional quick ranges shown beside the calendar. */
  presets?: DateRangePreset[] | undefined
  /** Requires Apply before the value commits. */
  confirmMode?: boolean
  /** Allows clearing the value from the trigger and footer. */
  clearable?: boolean
  /** Prevents all interaction. */
  disabled?: boolean
  /** Shows the value without allowing edits. */
  readOnly?: boolean
  /** Marks the value as required; hides the clear action. */
  required?: boolean
  /** Applies the invalid treatment to the trigger. */
  invalid?: boolean
  /** Trigger text while empty. */
  placeholder?: string
  /** Replaces the visible formatting for complete ranges. */
  formatRange?: ((range: DateRange) => string) | undefined
  /** Overrides built-in strings for localization. */
  labels?: Partial<DateRangePickerLabels>
}

/**
 * Picks a date range from a popover of quick ranges and calendars. Values
 * stay incomplete until the second endpoint arrives, so applications never
 * receive half a range.
 */
function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  minDate,
  maxDate,
  isDateDisabled,
  numberOfMonths = 2,
  locale,
  weekStartsOn,
  showOutsideDays = true,
  presets,
  confirmMode = false,
  clearable = true,
  disabled = false,
  readOnly = false,
  required = false,
  invalid = false,
  placeholder = "Select date range",
  formatRange,
  labels: labelsProp,
  className,
  ...triggerProps
}: DateRangePickerProps) {
  const labels: DateRangePickerLabels = React.useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp]
  )

  const [internalValue, setInternalValue] = React.useState<DateRange | undefined>(defaultValue)
  const isControlledValue = value !== undefined
  // An absent controlled value reads the same as a cleared value, which is
  // correct either way: both mean no committed range.
  const committed = (isControlledValue ? value : internalValue) ?? undefined

  const [openUncontrolled, setOpenUncontrolled] = React.useState(defaultOpen)
  const isOpen = open !== undefined ? open : openUncontrolled

  // Draft records work in progress while the popover is open. When it is
  // inactive the trigger falls back to the committed value.
  const [draftActive, setDraftActive] = React.useState(false)
  const [draftValue, setDraftValue] = React.useState<DateRange | undefined>(undefined)

  const [monthSync, setMonthSync] = React.useState<{ date: Date; nonce: number } | undefined>(
    undefined
  )

  const [announcement, setAnnouncement] = React.useState("")

  const displayed: DateRange | undefined = draftActive ? draftValue : committed

  const effectiveMonths = useEffectiveMonths(numberOfMonths)

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) {
        setOpenUncontrolled(next)
      }
      onOpenChange?.(next)
      // Discarding the draft on both edges covers cancel, outside clicks,
      // and Escape without dedicated paths.
      setDraftActive(false)
      setDraftValue(undefined)
    },
    [open, onOpenChange]
  )

  const commit = React.useCallback(
    (range: DateRange | undefined) => {
      if (!isControlledValue) {
        setInternalValue(range)
      }
      onValueChange?.(range)
    },
    [isControlledValue, onValueChange]
  )

  const announce = React.useCallback((message: string | undefined) => {
    if (message) {
      setAnnouncement(message)
    }
  }, [])

  const announceSelection = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from) {
        return
      }
      if (!range.to) {
        announce(labels.startSelected?.(formatDateLabel(range.from, locale)))
        return
      }
      announce(
        labels.rangeSelected?.(
          formatDateLabel(range.from, locale),
          formatDateLabel(range.to, locale)
        )
      )
    },
    [announce, labels, locale]
  )

  const isAvailable = React.useCallback(
    (date: Date) => {
      const day = startOfDay(date)
      if (minDate && isBefore(day, startOfDay(minDate))) {
        return false
      }
      if (maxDate && isAfter(day, startOfDay(maxDate))) {
        return false
      }
      return isDateDisabled ? !isDateDisabled(day) : true
    },
    [minDate, maxDate, isDateDisabled]
  )

  const spansUnavailableDay = React.useCallback(
    (range: DateRange): boolean => {
      if (!range.from || !range.to) {
        return false
      }
      const days = eachDayOfInterval({ start: startOfDay(range.from), end: startOfDay(range.to) })
      return days.some((day) => !isAvailable(day))
    },
    [isAvailable]
  )

  const handleDaySelect = React.useCallback(
    (day: Date) => {
      const base: DateRange = displayed ?? { from: undefined }
      let next: DateRange
      if (base.from && base.to) {
        // Starting another range never asks users to clear first.
        next = { from: day }
      } else if (base.from) {
        const completed =
          day.getTime() >= base.from.getTime() ? { from: base.from, to: day } : { from: day, to: base.from }
        next = completed
      } else {
        next = { from: day }
      }

      if (next.to && spansUnavailableDay(next)) {
        // A range would cross an unavailable date; restart from this day.
        next = { from: day }
      }

      setDraftActive(true)
      setDraftValue(next)
      setMonthSync((current) => ({ date: next.from ?? day, nonce: (current?.nonce ?? 0) + 1 }))

      if (isRangeComplete(next)) {
        announceSelection(next)
        if (!confirmMode) {
          commit(next)
          setOpen(false)
        }
      } else {
        announce(labels.startSelected?.(formatDateLabel(day, locale)))
      }
    },
    [
      displayed,
      spansUnavailableDay,
      announce,
      announceSelection,
      labels,
      locale,
      confirmMode,
      commit,
      setOpen,
    ]
  )

  const handlePresetSelect = React.useCallback(
    (range: DateRange) => {
      setDraftActive(true)
      setDraftValue(range)
      setMonthSync((current) => ({ date: range.from ?? new Date(), nonce: (current?.nonce ?? 0) + 1 }))
      announceSelection(range)
      if (!confirmMode) {
        if (isRangeComplete(range)) {
          commit(range)
        }
        setOpen(false)
      }
    },
    [announceSelection, confirmMode, commit, setOpen]
  )

  const handleClear = React.useCallback(() => {
    setDraftActive(true)
    setDraftValue(undefined)
    announce(labels.cleared)
  }, [announce, labels])

  const canClear = clearable && !required

  const triggerText = formatTriggerText(displayed, {
    locale,
    placeholder,
    selectEndDateLabel: labels.selectEndDate,
    formatRange,
  })

  const showFooter = confirmMode && !readOnly

  if (readOnly) {
    return (
      <div
        data-slot="date-range-trigger"
        data-readonly
        aria-disabled={true}
        className={cn(triggerClassNames({ invalid }), "cursor-default hover:bg-inherit", className)}
      >
        <CalendarIcon aria-hidden className="size-4 shrink-0 text-[var(--hui-color-foreground-base-secondary)]" />
        <span className="truncate">{triggerText}</span>
      </div>
    )
  }

  return (
    <div data-slot="date-range-picker-root" className="relative inline-flex w-full">
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              data-slot="date-range-trigger"
              data-size="default"
              data-open={isOpen || undefined}
              variant="link"
              className={cn(
                triggerClassNames({ invalid }),
                "justify-start px-[var(--hui-space-3)] shadow-none",
                canClear && committed && "pe-[var(--hui-space-9)]",
                className
              )}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              {...triggerProps}
            />
          }
        >
          <CalendarIcon
            aria-hidden
            className="pointer-events-none size-4 shrink-0 text-[var(--hui-color-foreground-base-secondary)]"
          />
          <span
            className={cn(
              "truncate",
              !displayed &&
                "text-[var(--hui-color-foreground-base-secondary)] [font-weight:var(--hui-font-weight-regular)]"
            )}
          >
            {triggerText}
          </span>
        </PopoverTrigger>

        {canClear && committed !== undefined && (
          <Button
            type="button"
            size="icon-sm"
            variant="link"
            aria-label={labels.clearAction}
            disabled={disabled}
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              setDraftActive(false)
              setDraftValue(undefined)
              setInternalValue(undefined)
              onValueChange?.(undefined)
              announce(labels.cleared)
            }}
            className="absolute end-[var(--hui-space-2)] top-1/2 z-10 -translate-y-1/2 rounded-full opacity-72 transition-opacity hover:opacity-100"
          >
            <CloseIcon />
          </Button>
        )}

        <PopoverContent
          align="start"
          sideOffset={6}
          className="max-w-[calc(100vw_-_var(--hui-space-8))] p-[var(--hui-space-4)]"
        >
          <div className="flex flex-col gap-y-[var(--hui-space-3)] min-[52rem]:flex-row min-[52rem]:gap-x-[var(--hui-space-3)]">
            {presets && presets.length > 0 && (
              <>
                <DateRangePresets
                  presets={presets}
                  value={displayed}
                  onSelect={handlePresetSelect}
                  ariaLabel={labels.presetsGroup}
                  disabled={disabled}
                  className="flex-row overflow-x-auto pb-[var(--hui-space-1)] min-[52rem]:w-36 min-[52rem]:shrink-0 min-[52rem]:flex-col min-[52rem]:overflow-visible"
                />
                <Separator
                  orientation="vertical"
                  size="full"
                  variant="tertiary"
                  className="hidden min-[52rem]:block"
                />
                <Separator
                  orientation="horizontal"
                  size="full"
                  variant="tertiary"
                  className="min-[52rem]:hidden"
                />
              </>
            )}

            <div className="flex-1">
              <DateRangeCalendar
                selected={draftActive ? draftValue : committed}
                onDaySelect={handleDaySelect}
                minDate={minDate}
                maxDate={maxDate}
                isDateDisabled={isDateDisabled}
                numberOfMonths={effectiveMonths}
                locale={locale}
                weekStartsOn={weekStartsOn}
                showOutsideDays={showOutsideDays}
                monthSync={monthSync}
                labels={labels}
              />
            </div>
          </div>

          {showFooter && (
            <>
              <Separator size="full" variant="tertiary" className="mt-[var(--hui-space-4)] mb-[var(--hui-space-3)]" />
              <div className="flex items-center justify-between">
                {canClear ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                    Clear
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-[var(--hui-space-2)]">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!isRangeComplete(draftActive ? draftValue : committed)}
                    onClick={() => {
                      const pending = draftActive ? draftValue : committed
                      if (!isRangeComplete(pending)) {
                        return
                      }
                      commit(pending)
                      setOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}

interface TriggerStyleInput {
  invalid: boolean
}

function triggerClassNames({ invalid }: TriggerStyleInput): string {
  return cn(
    "inline-flex h-[var(--hui-space-10)] w-full min-w-0 items-center gap-[var(--hui-space-3)] rounded-[var(--hui-radius-2)] border-[0.5px] bg-[var(--hui-color-background-base-primary)] text-left text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-small)] [transition:var(--hui-transition-interactive)]",
    invalid
      ? "border-[var(--hui-color-border-danger-emphasis)]"
      : "border-[var(--hui-color-border-base-tertiary)]"
  )
}

/**
 * Keeps one calendar on phones and the requested count elsewhere. Media
 * queries alone cannot change how many months DayPicker renders.
 */
function useEffectiveMonths(requested: number): number {
  const query = "(max-width: 47.99rem)"
  const subscribeNarrow = React.useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener("change", onStoreChange)
      return () => {
        mediaQueryList.removeEventListener("change", onStoreChange)
      }
    },
    []
  )
  const getServerSnapshot = React.useCallback(() => false, [])
  const getSnapshot = React.useCallback(() => window.matchMedia(query).matches, [])

  const narrow = React.useSyncExternalStore(subscribeNarrow, getSnapshot, getServerSnapshot)
  if (!Number.isFinite(requested) || requested < 1) {
    return 2
  }
  return narrow ? Math.min(requested, 1) : requested
}

// Re-exported for consumers composing their own surface around the calendar.
export { DateRangeCalendar }
export type { DateRangeCalendarProps } from "./date-range-calendar"
export { DateRangePicker }
