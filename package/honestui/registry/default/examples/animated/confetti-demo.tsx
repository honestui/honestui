"use client";

import { PartyPopper } from "honestui/icons";

import { confetti, ConfettiButton } from "@/registry/default/animated/confetti";

function fireFromSides() {
  const y = window.innerHeight * 0.7;
  const shared = { particleCount: 60, spread: 55, startVelocity: 16 };
  void confetti({ ...shared, origin: { x: 0, y }, angle: 60 });
  void confetti({ ...shared, origin: { x: window.innerWidth, y }, angle: 120 });
}

export default function ConfettiDemo() {
  return (
    <div className="w-80 rounded-xl border border-border bg-card p-5">
      <span className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground">
        <PartyPopper className="size-4" />
      </span>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">Project shipped</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        All 24 tasks are done. Mark the milestone and let the team know.
      </p>
      <div className="mt-5 flex gap-2">
        <ConfettiButton className="bg-foreground text-background hover:bg-foreground/90">Celebrate</ConfettiButton>
        <button
          type="button"
          onClick={fireFromSides}
          className="inline-flex h-9 items-center rounded-md border border-border px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          From the sides
        </button>
      </div>
    </div>
  );
}
