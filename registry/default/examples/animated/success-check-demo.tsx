"use client";

import { useState } from "react";
import { SuccessCheck } from "@/registry/default/animated/success-check";

export default function SuccessCheckDemo() {
  const [play, setPlay] = useState(0);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 pb-6 pt-8 text-center">
      <SuccessCheck playKey={play} size={60} />
      <div className="flex flex-col gap-1" role="status">
        <p className="text-base font-semibold tracking-tight text-foreground">Payment sent</p>
        <p className="text-[13px] text-muted-foreground">
          <span className="tabular-nums">$1,240.00</span> to Northwind Studio
        </p>
      </div>
      <button
        type="button"
        onClick={() => setPlay((value) => value + 1)}
        className="mt-1 h-8 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/60"
      >
        Replay
      </button>
    </div>
  );
}
