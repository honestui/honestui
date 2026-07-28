"use client";

import { RotateCw } from "lucide-react";
import * as React from "react";

import { ComponentPreviewSourceProvider } from "@/components/docs/component/component-preview-source-context";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { getIconForLanguageExtension } from "@/assets/language/icons";
import { LazyMount } from "@/components/docs/component/lazy-mount";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

export function ComponentPreviewTabs({
  className,
  containerClassName,
  previewClassName,
  codeClassName,
  align = "center",
  hideCode = false,
  playground = false,
  component,
  source,
  title,
  titleAction,
  ...props
}: React.ComponentProps<"div"> & {
  containerClassName?: string;
  previewClassName?: string;
  codeClassName?: string;
  align?: "center" | "start" | "end";
  hideCode?: boolean;
  playground?: boolean;
  component: React.ReactNode;
  source: React.ReactNode;
  title?: string;
  titleAction?: React.ReactNode;
}) {
  const isMobile = useBreakpoint(768);
  const displayTitle = title?.includes("=") && isMobile ? title.split("=")[0] : title;
  const [reloadKey, setReloadKey] = React.useState(0);
  const [dynamicSource, setDynamicSource] = React.useState<string | null>(null);
  const [playgroundPortal, setPlaygroundPortal] = React.useState<HTMLDivElement | null>(null);

  return (
    <ComponentPreviewSourceProvider
      onSourceChange={setDynamicSource}
      playgroundPortal={playgroundPortal}
    >
      <div className={cn("group relative mt-4 mb-12", className)} {...props}>
        <Tabs defaultValue="preview" className="relative w-full">
          <div
            className={cn(
              "dark:bg-primary-foreground flex flex-col rounded-[8px] bg-[#F5F5F5] p-1",
              containerClassName,
            )}
          >
            <div className="flex flex-row items-center justify-between px-2">
              <div className="text-muted-foreground dark:text-muted-foreground/80 flex min-w-0 items-center gap-1.5 font-mono text-xs [&_svg]:size-3.5">
                {getIconForLanguageExtension("component")}{" "}
                <span className="line-clamp-1">{displayTitle}</span>
                {titleAction}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  aria-label="Reload preview"
                  className="text-muted-foreground hover:text-foreground flex size-3 shrink-0 translate-x-1 cursor-pointer items-center justify-center opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                >
                  <RotateCw
                    className="size-4! transition-transform duration-500 ease-out"
                    style={{ transform: `rotate(${reloadKey * 360}deg)` }}
                  />
                </button>
                {!hideCode && (
                  <TabsList variant="underline">
                    <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="code">
                      Code
                    </TabsTab>
                    <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="preview">
                      Preview
                    </TabsTab>
                  </TabsList>
                )}
              </div>
            </div>

            <div className="bg-background overflow-hidden rounded-[5px] border">
              <TabsPanel keepMounted={playground} value="preview">
                <div
                  className={cn(
                    playground
                      ? "w-full"
                      : "flex h-64 w-full justify-center overflow-y-auto data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start sm:h-90",
                    previewClassName,
                  )}
                  data-align={align}
                >
                  <div
                    className={cn(
                      "preview no-scrollbar flex w-full justify-center [&>svg]:select-none",
                      !playground && "h-full",
                      !playground && align === "center" && "items-center",
                      !playground && align === "start" && "items-start",
                      !playground && align === "end" && "items-end",
                    )}
                    data-slot="preview"
                  >
                    <LazyMount
                      className={cn(
                        "flex w-full justify-center",
                        !playground && "h-full",
                        !playground && align === "center" && "items-center",
                        !playground && align === "start" && "items-start",
                        !playground && align === "end" && "items-end",
                      )}
                      fallback={
                        <div
                          className={cn(
                            "flex w-full items-center justify-center",
                            playground ? "h-64 sm:h-90" : "h-full",
                          )}
                        />
                      }
                    >
                      <React.Fragment key={reloadKey}>{component}</React.Fragment>
                    </LazyMount>
                  </div>
                </div>
              </TabsPanel>

              <TabsPanel value="code">
                <div
                  className={cn(
                    "flex h-64 w-full flex-col overflow-hidden sm:h-90",
                    codeClassName,
                  )}
                >
                  <div className="no-scrollbar relative size-full overflow-y-auto">
                    {dynamicSource ? (
                      <pre className="min-h-full min-w-max bg-background p-4 font-mono text-[.8125rem] leading-6 text-foreground">
                        <code>{dynamicSource}</code>
                      </pre>
                    ) : (
                      source
                    )}
                  </div>
                </div>
              </TabsPanel>
            </div>
          </div>
        </Tabs>
        {playground && <div className="mt-6" ref={setPlaygroundPortal} />}
      </div>
    </ComponentPreviewSourceProvider>
  );
}
