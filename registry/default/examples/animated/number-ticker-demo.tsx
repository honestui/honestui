"use client";

import { Plus } from "honestui/icons";
import { useState } from "react";

import { NumberTicker } from "@/registry/default/animated/number-ticker";

const BASE = 8360;

export default function NumberTickerDemo() {
  const [value, setValue] = useState(BASE);
  const change = ((value - 7440) / 7440) * 100;

  return (
    <div className="w-72 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">Weekly sales</span>
        <button
          type="button"
          onClick={() => setValue((current) => current + 185)}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-3.5" />
          $185
        </button>
      </div>
      <NumberTicker
        value={value}
        prefix="$"
        locale
        blur
        className="mt-3 block text-4xl font-semibold tracking-tight text-foreground tabular-nums"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">+{change.toFixed(1)}%</span> vs last week
      </p>
    </div>
  );
}
