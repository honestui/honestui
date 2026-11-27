"use client";

import {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsPanel,
  AnimatedTabsTab,
} from "@/registry/default/animated/animated-tabs";

const tabs = [
  { value: "overview", label: "Overview", body: "Traffic is up 12% this week, led by returning visitors from search." },
  { value: "analytics", label: "Analytics", body: "Median session length is 4m 12s. Most sessions start on the pricing page." },
  { value: "reports", label: "Reports", body: "Three scheduled reports run every Monday at 9:00 AM." },
  { value: "settings", label: "Settings", body: "Data is retained for 13 months. Exports are available as CSV." },
];

export default function AnimatedTabsDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-10">
      <AnimatedTabs defaultValue="overview">
        <AnimatedTabsList aria-label="Dashboard sections">
          {tabs.map((tab) => (
            <AnimatedTabsTab key={tab.value} value={tab.value}>
              {tab.label}
            </AnimatedTabsTab>
          ))}
        </AnimatedTabsList>
        {tabs.map((tab) => (
          <AnimatedTabsPanel key={tab.value} value={tab.value}>
            <p className="text-sm leading-relaxed text-muted-foreground">{tab.body}</p>
          </AnimatedTabsPanel>
        ))}
      </AnimatedTabs>
      <AnimatedTabs defaultValue="analytics">
        <AnimatedTabsList variant="underline" aria-label="Dashboard sections, underline style">
          {tabs.map((tab) => (
            <AnimatedTabsTab key={tab.value} value={tab.value}>
              {tab.label}
            </AnimatedTabsTab>
          ))}
        </AnimatedTabsList>
      </AnimatedTabs>
    </div>
  );
}
