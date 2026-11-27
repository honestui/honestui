"use client";

import { Typewriter } from "@/registry/default/animated/typewriter";

export default function TypewriterDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Interfaces that feel{" "}
        <Typewriter
          text={["calm.", "precise.", "accessible.", "honest."]}
          className="text-muted-foreground"
        />
      </h3>
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-[13px] text-foreground">
        <span className="text-muted-foreground select-none">$ </span>
        <Typewriter text="npx honestui add typewriter" startDelay={600} typeSpeed={45} />
      </div>
    </div>
  );
}
