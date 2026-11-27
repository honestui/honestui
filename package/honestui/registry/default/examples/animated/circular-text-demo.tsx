"use client";

import { ArrowUpRight } from "honestui/icons";

import { CircularText } from "@/registry/default/animated/circular-text";

export default function CircularTextDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-12">
      <a
        href="#careers"
        className="group rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <CircularText text="Now hiring" repeat={3} size={168} fontSize={13}>
          <span className="grid size-14 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 ease-out group-hover:scale-110">
            <ArrowUpRight className="size-5" />
          </span>
        </CircularText>
      </a>

      <CircularText
        text="Open source · MIT licensed"
        separator=" · "
        size={116}
        fontSize={10}
        duration={24}
        direction="counterclockwise"
        onHover="pause"
        className="text-muted-foreground"
      >
        <span className="text-xs font-semibold tracking-tight text-foreground">v2.0</span>
      </CircularText>
    </div>
  );
}
