import DecorativeBorder from "@/components/docs/layout/decorative-border-svg";
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
        <SidebarProvider>
          <a
            href="#docs-main-content"
            className="sr-only z-[100] rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-md outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skip to documentation content
          </a>
          <DocsSidebar />
          <div className={cn("bg-sidebar w-full", "p-0 pl-0 sm:py-2 sm:pr-2")}>
            <DecorativeBorder />
            <div
              className={cn(
                "no-scrollbar bg-background overflow-scroll sm:h-[calc(100vh-1rem)] sm:overscroll-none",
                "sm:rounded-tl-md sm:rounded-br-xl sm:rounded-bl-md", // bottom-right is XL to match mac-os browser radius (fk winodws :p)
              )}
            >
              <SidebarInset id="docs-main-content" tabIndex={-1}>
                <DocsHeader />
                <>{children}</>
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
