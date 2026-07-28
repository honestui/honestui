"use client";

import { useState } from "react";

import { WheelPicker } from "@/registry/default/animated/wheel-picker";

const times = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

export default function WheelPickerDemo() {
  const [value, setValue] = useState("14:00");

  return (
    <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
      <p className="mb-3 text-sm font-medium">Focus session</p>
      <WheelPicker options={times} value={value} onValueChange={setValue} aria-label="Focus session" />
      <p className="text-muted-foreground mt-3 text-xs">Starts at {value}</p>
    </div>
  );
}
