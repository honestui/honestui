"use client";

import { Dither } from "honestui/shaders";

export default function DitheringDemo() {
  return (
    <div className="size-full bg-[#080b12]">
      <Dither
        colorNum={5}
        mouseRadius={0.8}
        pixelSize={3}
        waveAmplitude={0.36}
        waveColor={[0.22, 0.48, 0.95]}
        waveFrequency={2.4}
        waveSpeed={0.04}
      />
    </div>
  );
}
