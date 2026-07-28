"use client";

import { GradientBlinds } from "honestui/shaders";

export default function BlindsDemo() {
  return (
    <div className="size-full bg-[#090b10]">
      <GradientBlinds
        className="size-full"
        gradientColors={["#ffb86b", "#f9f4e8", "#4f7cff"]}
        angle={18}
        blindCount={12}
        distortAmount={0.18}
        mixBlendMode="normal"
        noise={0.12}
        spotlightOpacity={0.72}
      />
    </div>
  );
}
