"use client";

import { CreditCard, GitPullRequest, MessageSquare, RotateCcw, Rocket, UserPlus } from "honestui/icons";
import { useState, type ComponentType } from "react";

import { AnimatedList, type AnimatedListLayout } from "@/registry/default/animated/animated-list";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  time: string;
};

const notifications: Notification[] = [
  { id: "payment", icon: CreditCard, title: "Payment received", detail: "$1,240.00 from Northwind", time: "2m" },
  { id: "signup", icon: UserPlus, title: "New sign-up", detail: "maria@lumen.studio joined Pro", time: "5m" },
  { id: "deploy", icon: Rocket, title: "Deploy succeeded", detail: "web · main · 41s", time: "9m" },
  { id: "review", icon: GitPullRequest, title: "Review requested", detail: "Fix invoice rounding #482", time: "14m" },
  { id: "comment", icon: MessageSquare, title: "New comment", detail: "“Looks good, ship it.”", time: "20m" },
];

function NotificationCard({ icon: Icon, title, detail, time }: Notification) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        <span className="block truncate text-[13px] text-muted-foreground">{detail}</span>
      </div>
    </div>
  );
}

export default function AnimatedListDemo() {
  const [layout, setLayout] = useState<AnimatedListLayout>("list");
  const [run, setRun] = useState(0);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label="Layout" className="flex gap-1 rounded-lg bg-muted p-1">
          {(["list", "stack"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={layout === value}
              onClick={() => {
                setLayout(value);
                setRun((count) => count + 1);
              }}
              className={cn(
                "h-7 cursor-pointer rounded-md px-3 text-xs font-medium text-muted-foreground capitalize transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                layout === value && "bg-background text-foreground shadow-sm ring-1 ring-border/60 dark:bg-foreground/10 dark:ring-0",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRun((count) => count + 1)}
          className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
      </div>
      <div className="h-[340px]">
        <AnimatedList key={run} layout={layout} delay={1100} maxVisible={4} live>
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} {...notification} />
          ))}
        </AnimatedList>
      </div>
    </div>
  );
}
