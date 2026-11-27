"use client";

import { RotateCcw } from "honestui/icons";
import { useState } from "react";

import { TextScramble } from "@/registry/default/animated/text-scramble";

const LINKS = ["Overview", "Deployments", "Analytics", "Settings"];

export default function TextScrambleDemo() {
  const [run, setRun] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <TextScramble replayKey={run} duration={0.6}>
              Build 2026.11.26
            </TextScramble>
          </span>
          <TextScramble
            as="h3"
            replayKey={run}
            duration={1.1}
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Deployment complete
          </TextScramble>
        </div>
        <button
          type="button"
          onClick={() => setRun((count) => count + 1)}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
      </div>
      <nav aria-label="Project" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">
        {LINKS.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="font-mono text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            <TextScramble trigger="hover" duration={0.45} characters="01#/<>_=">
              {link}
            </TextScramble>
          </a>
        ))}
      </nav>
    </div>
  );
}
