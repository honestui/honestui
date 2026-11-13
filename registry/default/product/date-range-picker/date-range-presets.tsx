"use client"

import {
  endOfDay,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  endOfMonth,
} from "date-fns"

import { Check as CheckIcon } from "honestui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

import { type DateRange, isSameRange } from "./date-range-utils"

/**
 * A preset carries a label and returns its range when chosen. Calculating
 * the range at selection time keeps relative presets such as "Last 7 days"
 * correct after the component has been mounted for a while.
 */
export interface DateRangePreset {
  label: string
  getValue: () => DateRange
}

/**
 * The quick ranges recommended for a first configuration. Applications map
 * this list to localize the labels or replace entries with their own
 * ranges; nothing here is baked into the picker itself.
 */
export function getDateRangePresets(): DateRangePreset[] {
  return [
    { label: "Today", getValue: todayRange },
    { label: "Yesterday", getValue: yesterdayRange },
    { label: "Last 7 days", getValue: () => lastNDaysRange(7) },
    { label: "Last 30 days", getValue: () => lastNDaysRange(30) },
    { label: "This month", getValue: thisMonthRange },
    { label: "Last month", getValue: lastMonthRange },
  ]
}

function todayRange(): DateRange {
  const day = startOfDay(new Date())
  return { from: day, to: day }
}

function yesterdayRange(): DateRange {
  const day = subDays(startOfDay(new Date()), 1)
  return { from: day, to: day }
}

function lastNDaysRange(days: number): DateRange {
  const yesterday = subDays(startOfDay(new Date()), 1)
  return { from: subDays(yesterday, days - 1), to: yesterday }
}

function thisMonthRange(): DateRange {
  const now = new Date()
  return { from: startOfMonth(now), to: endOfDay(now) }
}

function lastMonthRange(): DateRange {
  const previous = subMonths(new Date(), 1)
  return { from: startOfMonth(previous), to: endOfMonth(previous) }
}

export interface DateRangePresetsProps {
  presets: DateRangePreset[]
  /** The range shown in the calendar; used for the selected state. */
  value?: DateRange | undefined
  onSelect: (range: DateRange) => void
  /** Accessible name for the preset group. */
  ariaLabel?: string | undefined
  disabled?: boolean | undefined
  className?: string | undefined
}

/**
 * The narrow column of quick ranges beside the calendar. Presets use quiet
 * text buttons so they never compete visually with the selected range.
 */
export function DateRangePresets({
  presets,
  value,
  onSelect,
  ariaLabel,
  disabled,
  className,
}: DateRangePresetsProps) {
  return (
    <div
      data-slot="date-range-presets"
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-col gap-px", className)}
    >
      {presets.map((preset) => {
        const isSelected = presetMatches(preset, value)
        return (
          <Button
            key={preset.label}
            type="button"
            variant="link"
            size="sm"
            disabled={disabled}
            aria-pressed={isSelected}
            data-selected={isSelected || undefined}
            className={cn(
              "h-(--hui-space-9) w-full shrink-0 justify-between gap-(--hui-space-3) rounded-[var(--hui-radius-1)] px-(--hui-space-3) text-[var(--hui-color-foreground-base-secondary)] shadow-none",
              "[font-size:13px] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]",
              "hover:bg-[var(--hui-color-background-base-primary-hover)]! hover:text-[var(--hui-color-foreground-base-primary)] active:bg-[var(--hui-color-background-base-primary-hover)]! active:scale-100!",
              "data-[selected]:bg-[var(--hui-color-background-neutral-primary)]! data-[selected]:text-[var(--hui-color-foreground-base-primary)]! data-[selected]:[font-weight:var(--hui-font-weight-medium)]!"
            )}
            onClick={() => onSelect(preset.getValue())}
          >
            <span className="truncate">{preset.label}</span>
            {isSelected ? (
              <CheckIcon aria-hidden className="size-3.5 shrink-0 text-[var(--hui-color-foreground-base-primary)]" />
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * A preset counts as selected only when it produces exactly the current
 * complete range, compared by calendar day.
 */
function presetMatches(preset: DateRangePreset, value: DateRange | undefined): boolean {
  if (!value?.from || !value.to) {
    return false
  }
  const target = preset.getValue()
  return isSameRange(target, value)
}
