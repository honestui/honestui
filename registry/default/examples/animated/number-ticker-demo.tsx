"use client";

import { useState } from "react";

import { NumberTicker } from "@/registry/default/animated/number-ticker";

export default function NumberTickerDemo() {
  const [value, setValue] = useState(8360);

  return (
    <button
      type="button"
      onClick={() => setValue((current) => current + 185)}
      className="rounded-2xl border bg-card px-8 py-6 text-left shadow-sm"
    >
      <span className="text-muted-foreground block text-xs font-medium uppercase">Weekly sales</span>
      <NumberTicker value={value} prefix="$" locale blur className="mt-2 block text-4xl font-semibold tabular-nums" />
      <span className="text-muted-foreground mt-3 block text-xs">Click to add $185</span>
    </button>
  );
}
