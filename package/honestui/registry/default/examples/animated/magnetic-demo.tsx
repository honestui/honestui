import { ArrowUpRight } from "honestui/icons";

import { Magnetic } from "@/registry/default/animated/magnetic";

export default function MagneticDemo() {
  return (
    <Magnetic strength={0.35}>
      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground pe-4 ps-5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Open story
        <ArrowUpRight className="size-4 opacity-70" />
      </button>
    </Magnetic>
  );
}
