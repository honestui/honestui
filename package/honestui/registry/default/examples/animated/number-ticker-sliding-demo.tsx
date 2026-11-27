"use client";

import { Minus, Plus } from "honestui/icons";
import { useState } from "react";

import { NumberTicker } from "@/registry/default/animated/number-ticker";

const STEPS = [2.4, 3.15, 1.8, 4.05, 0.6, 2.95];

export default function NumberTickerSlidingDemo() {
  const [step, setStep] = useState(0);
  const [value, setValue] = useState(1.25);

  const move = (direction: 1 | -1) => {
    const delta = STEPS[step % STEPS.length] * direction;
    setStep((current) => current + 1);
    setValue((current) => Math.round((current + delta) * 100) / 100);
  };

  return (
    <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Today&apos;s P&amp;L</span>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Decrease"
              onClick={() => move(-1)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Increase"
              onClick={() => move(1)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
        <NumberTicker
          value={value}
          decimals={2}
          suffix="%"
          className="mt-3 block text-4xl font-semibold tracking-tight text-foreground"
        />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <span className="text-[13px] text-muted-foreground">Monthly visitors</span>
        <NumberTicker
          value={1284000 + step * 36500}
          locales="en-US"
          formatOptions={{ notation: "compact", maximumFractionDigits: 1, minimumFractionDigits: 1 }}
          className="mt-3 block text-4xl font-semibold tracking-tight text-foreground"
        />
      </div>
    </div>
  );
}
