"use client";

import { DottedGlobe } from "honestui/shaders";

const regions = [
  { lat: 37.77, lng: -122.42 }, // San Francisco
  { lat: 40.71, lng: -74.0 }, // New York
  { lat: 51.51, lng: -0.13 }, // London
  { lat: 50.11, lng: 8.68 }, // Frankfurt
  { lat: -23.55, lng: -46.63 }, // São Paulo
  { lat: 1.35, lng: 103.82 }, // Singapore
];

const routes = [
  { from: regions[0], to: regions[1] },
  { from: regions[1], to: regions[2] },
  { from: regions[2], to: regions[3] },
  { from: regions[1], to: regions[4] },
  { from: regions[3], to: regions[5] },
];

export default function DottedGlobeMarkers() {
  return (
    <div className="bg-background text-foreground grid size-full min-h-[420px] grid-cols-1 items-center gap-6 p-6 sm:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2">
        <p className="text-foreground text-xl font-medium tracking-tight">Six regions, one network</p>
        <p className="text-muted-foreground text-sm">
          San Francisco, New York, London, Frankfurt, São Paulo, and Singapore.
        </p>
      </div>
      <DottedGlobe
        className="aspect-square w-full max-w-[420px] justify-self-center"
        markers={regions}
        arcs={routes}
        rotation={-30}
        tilt={22}
        speed={0.6}
      />
    </div>
  );
}
