"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { dateRangeOptions, defaultDateRangeKey } from "@/lib/dashboard/data";
import type { DateRangeKey, DateRangeOption } from "@/lib/dashboard/types";

interface DateRangeContextValue {
  rangeKey: DateRangeKey;
  setRangeKey: (key: DateRangeKey) => void;
  range: DateRangeOption;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

/** Shares the selected date range across the dashboard sections. */
export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [rangeKey, setRangeKey] = useState<DateRangeKey>(defaultDateRangeKey);

  const value = useMemo<DateRangeContextValue>(
    () => ({
      rangeKey,
      setRangeKey,
      range:
        dateRangeOptions.find((option) => option.key === rangeKey) ??
        dateRangeOptions[1],
    }),
    [rangeKey],
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return context;
}
