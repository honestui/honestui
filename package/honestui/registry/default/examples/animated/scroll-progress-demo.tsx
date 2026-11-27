"use client";

import { useRef } from "react";

import { ScrollProgress } from "@/registry/default/animated/scroll-progress";

const sections = [
  {
    heading: "Start with the question",
    body: "Every interface answers a question for the person using it. Write that question down before choosing a layout, a color, or a component, and check each screen against it.",
  },
  {
    heading: "Show the state, not the system",
    body: "People care about whether their work is saved, sent, or stuck. Describe the state in their words and keep the internal steps out of the way unless something needs their attention.",
  },
  {
    heading: "Make the next step obvious",
    body: "One primary action per view keeps decisions light. Secondary actions can wait in a menu, and destructive ones should ask before they act.",
  },
  {
    heading: "Let motion explain change",
    body: "A short, consistent transition shows where something came from and where it went. Motion that only decorates is the first thing to cut.",
  },
];

export default function ScrollProgressDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card">
      <div
        ref={containerRef}
        className="relative h-72 overflow-y-auto [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden!"
      >
        <ScrollProgress container={containerRef} />
        <article className="px-5 py-5">
          <p className="text-xs font-medium text-muted-foreground">Field notes · 4 min read</p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">Designing calm software</h3>
          {sections.map((section) => (
            <section key={section.heading} className="mt-5">
              <h4 className="text-[13px] font-medium text-foreground">{section.heading}</h4>
              <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
