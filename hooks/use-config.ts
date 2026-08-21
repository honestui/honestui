import { persist } from "zustand/middleware";
import { create } from "zustand";

import type { InstallMethod } from "@/lib/install-commands";

type Config = {
  componentInstaller: InstallMethod;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  installationType: "cli" | "manual";
};

type ConfigStore = Config & {
  setConfig: (config: Partial<Config>) => void;
};

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      componentInstaller: "npm",
      installationType: "cli",
      packageManager: "npm",
      setConfig: (config) => set(config),
    }),
    {
      name: "config",
    },
  ),
);
