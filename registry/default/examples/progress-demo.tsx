"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/registry/default/ui/progress";

export default function ProgressDemo() {
  const [value, setValue] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setValue((current) => {
        const next = Math.min(100, current + 10);
        if (next === 100) setRunning(false);
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="grid w-full max-w-64 gap-[var(--hui-space-4)]">
      <Progress value={value}>
        <div className="flex items-center justify-between gap-[var(--hui-space-3)]">
          <ProgressLabel>Import contacts</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      <Button
        variant="secondary"
        onClick={() => {
          if (value === 100) setValue(0);
          setRunning(true);
        }}
        disabled={running}
      >
        {running ? "Importing…" : value === 100 ? "Run again" : "Start import"}
      </Button>
    </div>
  );
}
