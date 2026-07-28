import { Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/animated/popover";

export default function AnimatedPopoverDemo() {
  return (
    <Popover side="bottom" align="center">
      <PopoverTrigger>
        <button className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background">
          <Info className="size-4" /> Details
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <p className="font-medium">Source-owned motion</p>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          Copy the component into your app and tune every transition.
        </p>
      </PopoverContent>
    </Popover>
  );
}
