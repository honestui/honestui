"use client";

import { useRef } from "react";

import { StickyScrollReveal, type StickyScrollSection } from "@/registry/default/animated/sticky-scroll-reveal";

function FilterVisual() {
  return (
    <div className="grid place-items-center p-5">
      <div className="w-full max-w-64 rounded-xl border border-border bg-background p-3 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="size-3 rounded-full border border-muted-foreground/60" />
          Status is active
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Active", "Admin", "Last 30 days"].map((chip) => (
            <span key={chip} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartVisual() {
  const bars = [42, 58, 51, 66, 0, 0, 74, 69];
  return (
    <div className="flex items-end justify-center gap-1.5 p-6 pb-8">
      {bars.map((value, i) =>
        value === 0 ? (
          <span key={i} className="h-24 w-4 rounded-md border border-dashed border-muted-foreground/40" />
        ) : (
          <span
            key={i}
            className="w-4 rounded-md bg-foreground/80"
            style={{ height: `${Math.round(value * 1.6)}px`, opacity: i === bars.length - 1 ? 0.45 : 1 }}
          />
        ),
      )}
    </div>
  );
}

function KeyboardVisual() {
  return (
    <div className="grid place-items-center gap-3 p-6">
      <div className="flex gap-2">
        {["⌘", "K"].map((key) => (
          <kbd
            key={key}
            className="grid size-14 place-items-center rounded-xl border border-border bg-background font-sans text-xl text-foreground shadow-[0_2px_0_var(--border)]"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">Every action has a shortcut</span>
    </div>
  );
}

function ChecklistVisual() {
  return (
    <div className="grid place-items-center p-6">
      <ul className="w-full max-w-60 space-y-2.5">
        {["Labels and roles", "Visible focus", "Reduced motion", "Screen reader status"].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
            <span className="grid size-5 place-items-center rounded-full bg-foreground text-[11px] text-background">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const SECTIONS: StickyScrollSection[] = [
  {
    title: "Filters people can read",
    body: "Every filter reads as a sentence, so anyone can see what the table is showing and why.",
    visual: <FilterVisual />,
  },
  {
    title: "Charts that admit gaps",
    body: "Missing days stay missing and an open month is marked as in progress, instead of a fake drop.",
    visual: <ChartVisual />,
  },
  {
    title: "Keyboard first",
    body: "Command menus, shortcuts, and focus that always lands somewhere sensible.",
    visual: <KeyboardVisual />,
  },
  {
    title: "Accessible by default",
    body: "Roles, labels, and live status ship with each component, not as a ticket for later.",
    visual: <ChecklistVisual />,
  },
];

export default function StickyScrollRevealDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      role="region"
      tabIndex={0}
      aria-label="Product features"
      className="h-[440px] w-full max-w-3xl overflow-y-auto rounded-xl px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <StickyScrollReveal sections={SECTIONS} scrollContainer={scrollRef} headingAs="h2" className="pb-24" />
    </div>
  );
}
