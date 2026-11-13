import { DocsThemeCustomizationProvider } from "@/components/docs/layout/docs-theme-customizer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ToastProvider } from "@/registry/default/ui/toast";
import DocsHeader from "@/components/docs/sidebar/header";
import { DocsSidebar } from "@/components/docs/sidebar";
import { cn } from "@/lib/utils";
import React from "react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsThemeCustomizationProvider>
      <ToastProvider>
        {/* Dark mode: the chrome around the page is near-black and the content
            panel sits on it as the lighter surface, so the frame does not read
            as a second gray. The panel restores the token for component previews. */}
        <SidebarProvider className="dark:[--sidebar:color-mix(in_oklab,var(--hui-color-background-base-primary)_50%,black)]">
          <a
            href="#docs-main-content"
            className="sr-only z-[100] rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-md outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skip to documentation content
          </a>
          <DocsSidebar />
          <div
            className={cn(
              "bg-sidebar w-full min-w-0",
              "sm:flex sm:h-svh sm:flex-col sm:pr-2 sm:pb-2",
            )}
          >
            {/* The header sits in the frame above the panel, so page content never scrolls under it. */}
            <DocsHeader />
            <div
              className={cn(
                "no-scrollbar bg-background overflow-scroll sm:min-h-0 sm:flex-1 sm:overscroll-none",
                "dark:[--sidebar:var(--hui-color-background-base-secondary)]",
                "sm:rounded-xl sm:shadow-[0_0_0_0.5px_var(--hui-color-border-base-primary),0_1px_2px_oklch(0_0_0/0.06)]",
              )}
            >
              <SidebarInset id="docs-main-content" tabIndex={-1}>
                {children}
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </ToastProvider>
    </DocsThemeCustomizationProvider>
  );
}

export const dynamic = "force-static";
export const revalidate = 86400; // 1 day – we need to rebuild the page so that it refreshes the GitHub stars daily
