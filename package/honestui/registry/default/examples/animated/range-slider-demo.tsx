"use client";

import { useState } from "react";

import { RangeSlider } from "@/registry/default/animated/range-slider";

export default function RangeSliderDemo() {
  const [value, setValue] = useState(60);

  return (
    <div className="w-full max-w-md p-6">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium">Volume</span>
        <span className="text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <RangeSlider value={value} onValueChange={setValue} step={10} aria-label="Volume" />
    </div>
  );
}
