"use client";

import { GridPattern } from "@/registry/default/animated/grid-pattern";

export default function GridPatternDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
        <GridPattern numSquares={18} fade="radial" />
        <span className="relative text-sm font-medium text-foreground">Animated cells</span>
      </div>
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
        <GridPattern variant="dots" width={18} height={18} fade="edges" className="text-foreground/25" />
        <span className="relative text-sm font-medium text-foreground">Dot grid</span>
      </div>
    </div>
  );
}
