"use client";

import { Bell, BellOff, Check, Copy, Star, Volume2 } from "honestui/icons";

import { ActionSwapButton } from "@/registry/default/animated/action-swap";

const alerts = [
  { id: "every-update", label: "Every update", icon: <Bell className="size-4" /> },
  { id: "priority-only", label: "Priority only", icon: <Volume2 className="size-4" /> },
  { id: "paused", label: "Alerts paused", icon: <BellOff className="size-4" /> },
];

const copy = [
  { id: "copy", label: "Copy link", icon: <Copy className="size-4" /> },
  { id: "copied", label: "Copied", icon: <Check className="size-4" /> },
];

const follow = [
  { id: "follow", label: "Follow", icon: <Star className="size-4" /> },
  { id: "following", label: "Following", icon: <Check className="size-4" /> },
];

const examples = [
  { name: "Blur", node: <ActionSwapButton items={alerts} animation="blur" variant="outline" /> },
  { name: "Roll", node: <ActionSwapButton items={copy} animation="roll" variant="outline" /> },
  { name: "Cascade", node: <ActionSwapButton items={follow} animation="cascade" variant="primary" /> },
];

export default function ActionSwapDemo() {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-3 p-6 sm:grid-cols-3">
      {examples.map(({ name, node }) => (
        <div
          key={name}
          className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-4 pb-4 pt-8"
        >
          {node}
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  );
}
