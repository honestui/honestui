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
          <Info className="size-4" /> Learn more
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <p className="font-medium">Motion you can shape</p>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          Add the source to your app, then adjust each transition to fit.
        </p>
      </PopoverContent>
    </Popover>
  );
}
