"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Calculator,
  ChartColumn,
  ClipboardList,
  FileText,
  GraduationCap,
  MapPin,
} from "honestui/icons";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/registry/default/ui/tabs";

/**
 * Example prompts grouped by what the reply shows, so a first-time visitor
 * can reach every kind of generated UI: charts and tables, explanations,
 * calculators, forms, documents and places. Each prompt is worded so a model
 * reaches for the matching component; none promises real data.
 */
const GROUPS = [
  {
    id: "data",
    label: "Data",
    icon: ChartColumn,
    prompts: [
      "Chart a sample monthly budget",
      "Show the planets' sizes and orbits in a sortable table",
      "Compare three phones on speed, battery, camera and price",
      "Plot store size against weekly sales with sample data",
    ],
  },
  {
    id: "learn",
    label: "Learn",
    icon: GraduationCap,
    prompts: [
      "Explain how DNS resolves a domain name",
      "Quiz me on C pointers",
      "Break down the parts of a URL",
      "Animate a TCP three-way handshake step by step",
    ],
  },
  {
    id: "calculate",
    label: "Calculate",
    icon: Calculator,
    prompts: [
      "How much will $300 a month grow to in 10 years?",
      "Split a $184.50 bill between 4 people with a tip",
      "Simulate 600 rolls of a fair die",
      "Simulate the Monty Hall problem",
    ],
  },
  {
    id: "build",
    label: "Forms",
    icon: ClipboardList,
    prompts: [
      "Build a sign-up form for a pottery class",
      "Make a form to plan a trip with dates and a budget",
      "Create a short feedback survey with checkboxes and switches",
      "Make an editable team roster",
    ],
  },
  {
    id: "write",
    label: "Write",
    icon: FileText,
    prompts: [
      "Write a four-week onboarding plan I can edit",
      "Write a Python script that renames photos by date",
      "Compare SQLite and Postgres",
      "Draft a product launch checklist",
    ],
  },
  {
    id: "explore",
    label: "Places",
    icon: MapPin,
    prompts: [
      "Plan a road trip from Denver to Moab via Arches",
      "Map a walking tour of Lisbon's viewpoints",
      "Recommend three classic science fiction novels",
      "Show this month's sample sales KPIs as cards",
    ],
  },
] as const;

export function PlaygroundStarters({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <Tabs size="medium" defaultValue={GROUPS[0].id} className="min-w-0 gap-3">
      {/* Scrolls sideways on a phone rather than wrapping into a second row. */}
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)]">
        <TabsList aria-label="Example prompts by topic" variant="standalone" className="mx-auto w-max">
          {GROUPS.map(({ id, label, icon: Icon }) => (
            <TabsTab key={id} value={id} className="flex-none [&_svg]:size-4">
              <Icon aria-hidden="true" />
              {label}
            </TabsTab>
          ))}
        </TabsList>
      </div>
      {GROUPS.map(({ id, label, prompts }) => (
        <TabsPanel key={id} value={id}>
          <ul
            aria-label={`${label} prompts`}
            className="m-0 grid list-none divide-y divide-[var(--hui-color-border-base-primary)] p-0"
          >
            {prompts.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => onPick(prompt)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-[var(--hui-radius-2)] bg-transparent px-3 py-2.5 text-start text-sm text-[var(--hui-color-foreground-base-secondary)] outline-none transition-colors duration-[var(--hui-duration-normal)] hover:bg-[var(--hui-color-background-neutral-secondary)] hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)]"
                >
                  <span className="min-w-0 flex-1">{prompt}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-0 transition-opacity duration-[var(--hui-duration-normal)] group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </button>
              </li>
            ))}
          </ul>
        </TabsPanel>
      ))}
    </Tabs>
  );
}
