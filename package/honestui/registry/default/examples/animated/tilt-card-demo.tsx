import { ArrowUpRight, Sparkles } from "honestui/icons";

import { TiltCard } from "@/registry/default/animated/tilt-card";

export default function TiltCardDemo() {
  return (
    <TiltCard className="w-72 border border-border bg-card p-5" max={8}>
      <span className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground">
        <Sparkles className="size-4" />
      </span>
      <h3 className="mt-6 text-base font-semibold tracking-tight text-foreground">Motion systems</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        A gentle layer of depth that responds as you explore the card.
      </p>
      <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-foreground">
        Read the guide
        <ArrowUpRight className="size-3.5 text-muted-foreground" />
      </span>
    </TiltCard>
  );
}
