import type { ReactNode } from "react";
import { Cloud, Code, Database, Globe, Lock, Server, Terminal, Zap } from "honestui/icons";

import { OrbitingCircles } from "@/registry/default/animated/orbiting-circles";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-full items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm [&_svg]:size-4">
      {children}
    </span>
  );
}

export default function OrbitingCirclesDemo() {
  return (
    <div className="relative flex h-80 w-full max-w-md items-center justify-center overflow-hidden">
      <span className="z-10 text-sm font-medium text-foreground">Integrations</span>
      <OrbitingCircles radius={64} duration={18} iconSize={30}>
        <Chip><Code /></Chip>
        <Chip><Terminal /></Chip>
        <Chip><Zap /></Chip>
      </OrbitingCircles>
      <OrbitingCircles radius={128} duration={30} iconSize={36} reverse>
        <Chip><Cloud /></Chip>
        <Chip><Database /></Chip>
        <Chip><Globe /></Chip>
        <Chip><Lock /></Chip>
        <Chip><Server /></Chip>
      </OrbitingCircles>
    </div>
  );
}
