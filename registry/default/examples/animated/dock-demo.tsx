"use client";

import { Bell, Home, Search, Settings } from "lucide-react";
import { useState } from "react";

import { Dock, DockItem, DockSeparator } from "@/registry/default/animated/dock";

const items = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "alerts", label: "Alerts", icon: Bell },
];

export default function DockDemo() {
  const [active, setActive] = useState("home");

  return (
    <Dock>
      {items.map(({ id, label, icon: Icon }) => (
        <DockItem key={id} active={active === id} onClick={() => setActive(id)} aria-label={label}>
          <Icon className="size-5" />
        </DockItem>
      ))}
      <DockSeparator />
      <DockItem onClick={() => setActive("settings")} active={active === "settings"} aria-label="Settings">
        <Settings className="size-5" />
      </DockItem>
    </Dock>
  );
}
