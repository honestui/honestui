"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { BunIcon, NpmIcon, PnpmIcon, YarnIcon } from "@/assets/icons";
import { ShadcnIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  getComponentInstallCommand,
  installMethods,
  type InstallMethod,
} from "@/lib/install-commands";
import { useConfig } from "@/hooks/use-config";
import CopyButton from "./copy-button";
import { cn } from "@/lib/utils";

interface CliBlockProps {
  commands: string[];
}

function CliBlock({ commands }: CliBlockProps) {
  const { componentInstaller, setConfig } = useConfig();
  const installCommand = getComponentInstallCommand(componentInstaller, commands);

  return (
    <Tabs
      defaultValue="npm"
      value={componentInstaller}
      onValueChange={(value) => {
        const nextInstaller = value as InstallMethod;
        setConfig({
          componentInstaller: nextInstaller,
          ...(nextInstaller !== "shadcn" && { packageManager: nextInstaller }),
        });
      }}
    >
      <div
        className="group mt-2 flex flex-col rounded-[8px] bg-[var(--hui-color-background-neutral-primary)] p-1"
        data-install-command
      >
        <div className="flex flex-row items-center justify-between pr-1 pl-2">
          <TabsList
            aria-label="Install command"
            variant="underline"
            className="no-scrollbar min-w-0 justify-start! gap-3! overflow-x-auto"
            indicatorClassName={cn(
              componentInstaller === "npm" && "bg-[#C3292F]!",
              componentInstaller === "yarn" && "bg-[#3592BD]!",
              componentInstaller === "bun" && "bg-primary!",
              componentInstaller === "pnpm" && "bg-[#FAAF18]!",
              componentInstaller === "shadcn" && "bg-foreground!",
            )}
          >
            <TabsTab
              className="h-5! gap-1 px-1.5 hover:bg-transparent! data-active:text-[#C3292F] sm:gap-2"
              value="npm"
            >
              <NpmIcon className="hidden size-3 sm:block" />
              npm
            </TabsTab>
            <TabsTab
              className="h-5! gap-1 px-1.5 hover:bg-transparent! data-active:text-[#3592BD] sm:gap-2"
              value="yarn"
            >
              <YarnIcon className="hidden size-3 sm:block" />
              yarn
            </TabsTab>
            <TabsTab
              className="data-active:text-primary h-5! gap-1 px-1.5 hover:bg-transparent! sm:gap-2"
              value="bun"
            >
              <BunIcon className="hidden size-3 sm:block" />
              bun
            </TabsTab>
            <TabsTab
              className="h-5! gap-1 px-1.5 hover:bg-transparent! data-active:text-[#FAAF18] sm:gap-2"
              value="pnpm"
            >
              <PnpmIcon className="hidden size-3 sm:block" />
              pnpm
            </TabsTab>
            <TabsTab
              className="data-active:text-foreground h-5! gap-2 px-1.5 hover:bg-transparent!"
              value="shadcn"
            >
              <HugeiconsIcon
                aria-hidden="true"
                className="hidden size-3 sm:block"
                icon={ShadcnIcon}
                strokeWidth={2}
              />
              shadcn
            </TabsTab>
          </TabsList>
          <CopyButton className="-mt-1" code={installCommand} />
        </div>
        <div className="no-scrollbar bg-background text-muted-foreground overflow-x-auto rounded-[5px] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-3 text-[13px]">
          {installMethods.map((manager) => (
            <TabsPanel className="font-mono whitespace-nowrap" key={manager} value={manager}>
              {getComponentInstallCommand(manager, commands)}
            </TabsPanel>
          ))}
        </div>
      </div>
    </Tabs>
  );
}

export { CliBlock };
