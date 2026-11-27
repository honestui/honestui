"use client";

import { useEffect, useRef, useState } from "react";
import { StatusPill } from "@/registry/default/animated/status-pill";

type Phase = "idle" | "recording" | "saving" | "saved";

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function StatusPillDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const stop = () => {
    setPhase("saving");
    saveTimer.current = window.setTimeout(() => setPhase("saved"), 1400);
  };

  const pill = {
    idle: <StatusPill status="idle" label="Ready to record" />,
    recording: <StatusPill status="recording" tone="recording" appearance="solid" label="Recording" detail={formatTime(seconds)} />,
    saving: <StatusPill status="saving" busy appearance="solid" label="Saving clip…" />,
    saved: <StatusPill status="saved" tone="success" label="Saved to library" />,
  }[phase];

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-10 items-center">{pill}</div>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-8 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            disabled={phase === "recording" || phase === "saving"}
            onClick={() => {
              setSeconds(0);
              setPhase("recording");
            }}
          >
            {phase === "saved" ? "Record again" : "Record"}
          </button>
          <button
            type="button"
            className="h-8 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
            disabled={phase !== "recording"}
            onClick={stop}
          >
            Stop
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-6">
        <StatusPill size="sm" tone="info" live label="Syncing" announce={false} />
        <StatusPill size="sm" tone="success" label="Deployed" announce={false} />
        <StatusPill size="sm" tone="warning" label="2 checks pending" announce={false} />
        <StatusPill size="sm" tone="danger" label="Build failed" announce={false} />
      </div>
    </div>
  );
}
