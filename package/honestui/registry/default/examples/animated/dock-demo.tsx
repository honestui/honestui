"use client";

import { Bell, House as Home, Search, Settings } from "honestui/icons";
import { useState } from "react";

import { Dock, DockItem, DockSeparator } from "@/registry/default/animated/dock";

const items = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "browse", label: "Browse", icon: Search },
  { id: "updates", label: "Updates", icon: Bell },
];

export default function DockDemo() {
  const [active, setActive] = useState("dashboard");

  return (
    <Dock>
      {items.map(({ id, label, icon: Icon }) => (
        <DockItem key={id} active={active === id} onClick={() => setActive(id)} aria-label={label}>
          <Icon className="size-5" />
        </DockItem>
      ))}
      <DockSeparator />
      <DockItem onClick={() => setActive("preferences")} active={active === "preferences"} aria-label="Preferences">
        <Settings className="size-5" />
      </DockItem>
    </Dock>
  );
}
