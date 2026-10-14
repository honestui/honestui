"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "honestui/icons";
import { Button } from "../../../components/ui/button.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover.js";
import { cn } from "../../../lib/utils.js";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "honestui/icons";

export type SingleDatePickerProps = Omit<React.ComponentProps<typeof Button>, "value" | "defaultValue" | "onChange" | "children"> & {
  /** Calendar date in YYYY-MM-DD form; an empty string means no selection. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

/** Uses the Honest UI calendar styling with single-day selection. */
export function SingleDatePicker({
  value,
  onValueChange,
  placeholder = "Select date",
  required = false,
  disabled,
  className,
  ...props
}: SingleDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            {...props}
            type="button"
            variant="secondary"
            aria-required={required || undefined}
            aria-label={selected ? `${props["aria-label"] ?? "Date"}, ${format(selected, "MMM d, yyyy")}` : props["aria-label"]}
            disabled={disabled}
            className={cn("w-full justify-between text-left", !selected && "text-muted-foreground", className)}
          />
        }
      >
        <span>{selected ? format(selected, "MMM d, yyyy") : placeholder}</span>
        <CalendarIcon aria-hidden="true" className="size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent aria-label={`${props["aria-label"] ?? "Date"} calendar`} align="start" className="w-fit max-w-[calc(100vw-2rem)] overflow-y-auto p-3">
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={selected}
          numberOfMonths={1}
          autoFocus
          showOutsideDays
          onSelect={(day) => {
            if (!day) return;
            // Keep date-only values local; UTC conversion can shift the day.
            onValueChange(format(day, "yyyy-MM-dd"));
            setOpen(false);
          }}
          components={{ Chevron: ({ orientation }) => orientation === "left" ? <ChevronLeft aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" /> }}
          classNames={{
            months: "relative flex",
            month: "flex flex-col",
            month_caption: "flex h-9 items-center justify-center text-sm font-medium",
            caption_label: "",
            nav: "absolute inset-x-0 top-0 flex justify-between",
            button_previous: "inline-flex size-8 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
            button_next: "inline-flex size-8 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
            month_grid: "border-collapse",
            weeks: "border-collapse",
            weekday: "w-10 pb-2 text-center text-xs font-normal text-muted-foreground",
            day: "size-10 p-0 text-center [&[data-disabled]>button]:text-muted-foreground [&[data-disabled]>button]:opacity-50",
            day_button: "inline-flex size-10 items-center justify-center rounded-sm text-sm outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2",
            selected: "[&>button]:bg-[var(--hui-color-background-accent-emphasis)]! [&>button]:text-[var(--hui-color-foreground-accent-emphasis)]!",
            today: "[&:not([data-selected])>button]:ring-1 [&:not([data-selected])>button]:ring-inset [&:not([data-selected])>button]:ring-ring",
            outside: "[&:not([data-selected])>button]:text-muted-foreground",
          }}
        />
        {!required && selected && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              onValueChange("");
              setOpen(false);
            }}
          >
            Clear date
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
