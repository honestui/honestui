"use client";

import * as React from "react";

import { useConfig } from "@/hooks/use-config";
import { Tabs } from "@/components/ui/tabs";

export function CodeTabs({ children }: React.ComponentProps<typeof Tabs>) {
  const { installationType, setConfig } = useConfig();

  return (
    <Tabs
      className="relative mt-4 w-full"
      onValueChange={(value) => {
        const installationType = value as "cli" | "manual";
        setConfig({ installationType });
      }}
      value={installationType}
    >
      {children}
    </Tabs>
  );
}
