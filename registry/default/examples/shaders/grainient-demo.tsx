"use client";

import { Grainient } from "honestui/shaders";

export default function GrainientDemo() {
  return (
    <div className="size-full bg-[#12100e]">
      <Grainient
        className="size-full"
        color1="#ffb257"
        color2="#d8d3c5"
        color3="#335c67"
        grainAmount={0.08}
        rotationAmount={280}
        warpStrength={0.72}
      />
    </div>
  );
}
