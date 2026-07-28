"use client";

import { SideRays } from "honestui/shaders";

export default function SideRaysDemo() {
  return (
    <div className="size-full bg-[#090b10]">
      <SideRays
        blend={0.68}
        className="size-full"
        intensity={1.7}
        origin="top-right"
        rayColor1="#ffbf69"
        rayColor2="#7fb3ff"
        saturation={1.2}
        spread={1.65}
        tilt={0.08}
      />
    </div>
  );
}
