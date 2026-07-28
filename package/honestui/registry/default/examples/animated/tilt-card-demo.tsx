import { ArrowUpRight } from "lucide-react";

import { TiltCard } from "@/registry/default/animated/tilt-card";

export default function TiltCardDemo() {
  return (
    <TiltCard className="w-72 border bg-card p-6 shadow-lg" max={10}>
      <div className="text-muted-foreground text-xs font-medium uppercase">Spotlight</div>
      <h3 className="mt-8 text-xl font-semibold">Motion systems</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">A gentle layer of depth that responds as you explore the card.</p>
      <ArrowUpRight className="mt-8 size-5" />
    </TiltCard>
  );
}
