import { ArrowUpRight } from "lucide-react";

import { Magnetic } from "@/registry/default/animated/magnetic";

export default function MagneticDemo() {
  return (
    <Magnetic strength={0.35}>
      <button className="flex size-28 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background shadow-lg">
        Open story <ArrowUpRight className="size-4" />
      </button>
    </Magnetic>
  );
}
