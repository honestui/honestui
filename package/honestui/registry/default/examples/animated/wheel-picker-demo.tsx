"use client";

import { useState } from "react";

import { WheelPicker } from "@/registry/default/animated/wheel-picker";

const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"];

export default function WheelPickerDemo() {
  const [value, setValue] = useState("10:00");

  return (
    <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
      <p className="mb-3 text-sm font-medium">Meeting time</p>
      <WheelPicker options={times} value={value} onValueChange={setValue} aria-label="Meeting time" />
      <p className="text-muted-foreground mt-3 text-xs">Selected {value}</p>
    </div>
  );
}
