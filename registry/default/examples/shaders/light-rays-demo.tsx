"use client";

import { LightRays } from "honestui/shaders";

export default function LightRaysDemo() {
  return (
    <div className="size-full bg-[#07090d]">
      <LightRays
        className="size-full"
        distortion={0.08}
        lightSpread={0.72}
        mouseInfluence={0.16}
        noiseAmount={0.06}
        rayLength={2.2}
        raysColor="#b8d6ff"
        raysOrigin="top-left"
        raysSpeed={0.7}
      />
    </div>
  );
}
