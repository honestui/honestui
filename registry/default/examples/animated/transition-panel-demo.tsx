"use client";

import { useState } from "react";

import { TransitionPanel } from "@/registry/default/animated/transition-panel";
import { cn } from "@/lib/utils";

const steps = [
  {
    label: "Account",
    title: "Create your workspace",
    body: "Pick a name your team will recognize. You can change it later in settings.",
  },
  {
    label: "Invite",
    title: "Invite your team",
    body: "Add teammates by email. They get access as soon as they accept, and you can set their role from the members page at any time.",
  },
  {
    label: "Connect",
    title: "Connect a repository",
    body: "Link a Git provider so deploys run on every push to main.",
  },
];

export default function TransitionPanelDemo() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div role="group" aria-label="Setup step" className="flex gap-1 rounded-lg bg-muted p-1">
        {steps.map((step, index) => (
          <button
            key={step.label}
            type="button"
            aria-pressed={active === index}
            onClick={() => setActive(index)}
            className={cn(
              "h-8 flex-1 cursor-pointer rounded-md text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              active === index && "bg-background text-foreground shadow-sm ring-1 ring-border/60 dark:bg-foreground/10 dark:ring-0",
            )}
          >
            {step.label}
          </button>
        ))}
      </div>
      <TransitionPanel activeIndex={active} className="rounded-xl border border-border bg-card">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col gap-1.5 p-5">
            <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </TransitionPanel>
    </div>
  );
}
