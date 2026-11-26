"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import type { ChevronProps, DropdownProps } from "react-day-picker"
import {
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "honestui/icons"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/default/ui/button"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

/**
 * The day button fills its 36px grid cell so the clickable area and any
 * selection fill cover the whole square. These are the same cell metrics as
 * the Date Range Picker, so a calendar and a range picker on one screen line
 * up exactly.
 */
const DAY_BUTTON_CLASS =
  "relative inline-flex h-full w-full cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-[var(--hui-radius-1)] border-0 bg-transparent p-0 text-[var(--hui-color-foreground-base-primary)] tabular-nums [font-size:13px] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)] outline-none motion-safe:[transition:background-color_var(--hui-duration-fast)_var(--hui-ease-out),color_var(--hui-duration-fast)_var(--hui-ease-out)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] focus-visible:[outline-offset:-1px] disabled:cursor-not-allowed forced-colors:border forced-colors:border-transparent"

/*
 * Day states arrive as class names and data attributes on the grid cell, so
 * every state targets the cell's button. Today carries a small dot under the
 * number instead of a ring, so it never competes with the selection.
 */
const DAY_CELL_CLASS = cn(
  "size-(--hui-space-9) p-0 text-center align-middle",
  "[&[data-today]>button]:after:pointer-events-none [&[data-today]>button]:after:absolute [&[data-today]>button]:after:bottom-[3px] [&[data-today]>button]:after:left-1/2 [&[data-today]>button]:after:size-1 [&[data-today]>button]:after:-translate-x-1/2 [&[data-today]>button]:after:rounded-full [&[data-today]>button]:after:bg-current [&[data-today]>button]:after:content-['']",
  "[&[data-today]:not([data-selected])>button]:[font-weight:var(--hui-font-weight-medium)]",
  "[&[data-disabled]>button]:pointer-events-none [&[data-disabled]>button]:text-[var(--hui-color-foreground-base-tertiary)]! [&[data-disabled]>button]:line-through [&[data-disabled]>button]:decoration-[var(--hui-color-foreground-base-tertiary)]",
  "[&[data-outside]:not([data-disabled]):not([data-selected])>button]:text-[var(--hui-color-foreground-base-secondary)]"
)

// Selected days are solid ink, the same fill as the default Button.
const SELECTED_CLASS =
  "[&>button]:bg-[var(--hui-color-background-neutral-emphasis)] [&>button]:text-[var(--hui-color-foreground-base-emphasis)] [&>button]:[font-weight:var(--hui-font-weight-medium)] [&>button:hover]:bg-[color-mix(in_oklch,var(--hui-color-background-neutral-emphasis)_86%,var(--hui-color-background-base-primary))] forced-colors:[&>button]:bg-[Highlight] forced-colors:[&>button]:text-[HighlightText]"

// Ranges read as one flat band: square middle cells on a neutral tint and
// ink endpoints rounded only on their outer edge. A one-day range carries
// both endpoint keys, and the opposite-side resets leave a square ink cell.
const RANGE_START_CLASS =
  "[&>button]:rounded-s-[var(--hui-radius-1)]! [&>button]:rounded-e-none!"
const RANGE_END_CLASS =
  "[&>button]:rounded-e-[var(--hui-radius-1)]! [&>button]:rounded-s-none!"
const RANGE_MIDDLE_CLASS =
  "[&>button]:rounded-none! [&>button]:bg-[color-mix(in_oklch,var(--hui-color-foreground-base-primary)_8%,transparent)]! [&>button]:text-[var(--hui-color-foreground-base-primary)]! [&>button]:[font-weight:var(--hui-font-weight-regular)]! [&>button:hover]:bg-[color-mix(in_oklch,var(--hui-color-foreground-base-primary)_14%,transparent)]!"

function CalendarChevron({ className, orientation, size }: ChevronProps) {
  const iconClassName = cn("size-4", className)
  void size

  if (orientation === "left") {
    return <ChevronLeftIcon aria-hidden="true" className={cn(iconClassName, "rtl:rotate-180")} />
  }
  if (orientation === "right") {
    return <ChevronRightIcon aria-hidden="true" className={cn(iconClassName, "rtl:rotate-180")} />
  }
  if (orientation === "up") {
    return <ChevronDownIcon aria-hidden="true" className={cn(iconClassName, "rotate-180")} />
  }
  return <ChevronDownIcon aria-hidden="true" className={iconClassName} />
}

/**
 * Month and year pickers use Honest UI Select instead of the browser's
 * <select>, so the open list matches every other menu. DayPicker only reads
 * `event.target.value` from its change handler, so a minimal event is enough.
 */
function CalendarDropdown({
  options = [],
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const items = React.useMemo(
    () => options.map((option) => ({ label: option.label, value: String(option.value) })),
    [options]
  )

  return (
    <Select
      items={items}
      value={value == null ? null : String(value)}
      disabled={disabled}
      onValueChange={(next) => {
        if (next == null) return
        onChange?.({
          target: { value: next },
          currentTarget: { value: next },
        } as unknown as React.ChangeEvent<HTMLSelectElement>)
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className="gap-(--hui-space-1) [font-weight:var(--hui-font-weight-medium)]"
      >
        <SelectValue />
      </SelectTrigger>
      {/* The year list is long, so it scrolls. The scrollbar is hidden like the
          Carousel's (!important beats unlayered global scrollbar rules). The
          list padding scrolls with the items, so sticky 8px gradients in the
          popup's own fill sit on both edges, with matching scroll padding: a
          half-scrolled year fades out instead of being cut flush at the
          border, the popup's border stays crisp, and the selected year opens
          inset. */}
      <SelectPopup className="max-h-[min(280px,var(--available-height))] [scroll-padding-block:var(--hui-space-3)] [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden! before:pointer-events-none before:sticky before:top-0 before:z-1 before:-mb-(--hui-space-3) before:block before:h-(--hui-space-3) before:bg-linear-to-b before:from-[var(--hui-color-background-overlay)] before:to-transparent before:content-[''] after:pointer-events-none after:sticky after:bottom-0 after:z-1 after:-mt-(--hui-space-3) after:block after:h-(--hui-space-3) after:bg-linear-to-t after:from-[var(--hui-color-background-overlay)] after:to-transparent after:content-['']">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
            // A trailing check reserves space on every row but fills only one,
            // so short labels sat off-center. Rows are centered instead, and
            // the selected one takes the same ink fill as a selected day.
            // aria-selected, because this project's data-selected variant
            // expects data-selected="true" and Base UI sets it empty.
            className="justify-center tabular-nums [&>svg]:hidden aria-selected:bg-[var(--hui-color-background-neutral-emphasis)]! aria-selected:text-[var(--hui-color-foreground-base-emphasis)]! aria-selected:[font-weight:var(--hui-font-weight-medium)] aria-selected:data-[highlighted]:bg-[color-mix(in_oklch,var(--hui-color-background-neutral-emphasis)_86%,var(--hui-color-background-base-primary))]! forced-colors:aria-selected:bg-[Highlight]! forced-colors:aria-selected:text-[HighlightText]!"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  fixedWeeks = true,
  captionLayout = "label",
  hideNavigation,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames()
  const navButton = cn(
    buttonVariants({ variant: "link", size: "icon-sm" }),
    "pointer-events-auto size-7 rounded-[var(--hui-radius-1)] text-[var(--hui-color-foreground-base-secondary)] hover:text-[var(--hui-color-foreground-base-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-40"
  )
  // DayPicker marks an unavailable previous or next month with aria-disabled
  // (and removes it from the tab order) rather than the disabled attribute.

  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      // Every month renders six weeks, so the calendar keeps one height
      // while paging between months that span five or six rows.
      fixedWeeks={fixedWeeks}
      captionLayout={captionLayout}
      hideNavigation={hideNavigation}
      className={cn("w-fit p-[var(--hui-space-3)]", className)}
      classNames={{
        root: cn(defaults.root, "relative"),
        months: "relative flex flex-col gap-y-(--hui-space-6) sm:flex-row sm:items-start sm:gap-x-(--hui-space-7)",
        month: "flex flex-col",
        // The nav overlays the first caption row, so previous and next sit on
        // either side of the month names however many months are shown.
        nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-(--hui-space-9) items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_caption: cn(
          "mb-(--hui-space-2) flex h-(--hui-space-9) items-center justify-center text-center text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-regular)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-regular)]",
          // Room for the overlaid arrows only when they are shown.
          !hideNavigation && "px-(--hui-space-9)"
        ),
        caption_label: "select-none",
        dropdowns: "flex items-center gap-(--hui-space-2)",
        weekdays: "",
        weekday:
          "h-(--hui-space-8) w-(--hui-space-9) text-center align-middle text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-small)]",
        month_grid: "border-collapse",
        weeks: "",
        week: "",
        week_number:
          "w-(--hui-space-9) text-center align-middle text-[var(--hui-color-foreground-base-tertiary)] [font-size:var(--hui-font-size-small)]",
        week_number_header: "w-(--hui-space-9)",
        day: DAY_CELL_CLASS,
        day_button: DAY_BUTTON_CLASS,
        selected: SELECTED_CLASS,
        range_start: RANGE_START_CLASS,
        range_end: RANGE_END_CLASS,
        range_middle: RANGE_MIDDLE_CLASS,
        today: "",
        outside: "",
        disabled: "",
        hidden: "invisible",
        footer:
          "pt-(--hui-space-3) text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]",
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
        Dropdown: CalendarDropdown,
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
export type { CalendarProps }
