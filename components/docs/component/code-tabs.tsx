"use client";

import * as React from "react";
import posthog from "posthog-js";

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
        posthog.capture("documentation_installation_method_selected", {
          installation_method: installationType,
        });
      }}
      value={installationType}
    >
      {children}
    </Tabs>
  );
}
