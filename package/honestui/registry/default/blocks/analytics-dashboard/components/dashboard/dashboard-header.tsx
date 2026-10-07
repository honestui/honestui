"use client";

import { Calendar, Download } from "honestui/icons";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dateRangeOptions,
  getRevenueSeries,
  revenueMetricOptions,
} from "@/lib/dashboard/data";
import type { DateRangeKey } from "@/lib/dashboard/types";
import { useDateRange } from "./date-range-context";

/** Builds a CSV of every revenue series for the selected range. */
function buildRevenueCsv(rangeKey: DateRangeKey): string {
  const header = [
    "date",
    ...revenueMetricOptions.flatMap((option) => [
      `${option.key}_current`,
      `${option.key}_previous`,
    ]),
  ];
  const series = revenueMetricOptions.map((option) =>
    getRevenueSeries(rangeKey, option.key),
  );
  const rows = series[0].map((point, index) => [
    point.date,
    ...series.flatMap((s) => [s[index].current, s[index].previous]),
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

export function DashboardHeader() {
  const { rangeKey, setRangeKey } = useDateRange();

  function exportCsv() {
    const blob = new Blob([buildRevenueCsv(rangeKey)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `northstar-revenue-${rangeKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor revenue, customers, and product activity.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={rangeKey}
          items={Object.fromEntries(
            dateRangeOptions.map((option) => [option.key, option.label]),
          )}
          onValueChange={(value) => {
            if (value) setRangeKey(value as DateRangeKey);
          }}
        >
          <SelectTrigger size="small" aria-label="Date range">
            <Calendar aria-hidden className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent align="end">
            {dateRangeOptions.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download aria-hidden className="size-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
