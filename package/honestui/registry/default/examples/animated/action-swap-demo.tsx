"use client";

import { Bell, BellOff, Volume2 } from "lucide-react";

import { ActionSwapButton } from "@/registry/default/animated/action-swap";

const items = [
  { id: "all", label: "All alerts", icon: <Bell className="size-4" /> },
  { id: "mentions", label: "Mentions", icon: <Volume2 className="size-4" /> },
  { id: "muted", label: "Muted", icon: <BellOff className="size-4" /> },
];

export default function ActionSwapDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-6">
      <ActionSwapButton items={items} animation="blur" />
      <ActionSwapButton items={items} animation="roll" variant="outline" />
      <ActionSwapButton items={items} animation="cascade" variant="primary" />
    </div>
  );
}
