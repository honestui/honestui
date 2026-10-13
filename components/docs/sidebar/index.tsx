import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarSections } from "./sidebar-sections";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Badge } from "@/components/ui/badge";
import { HONEST_AI_TAGLINE, HONEST_AI_URL } from "@/globals/constants/site";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "honestui/icons";
import Link from "next/link";
import * as React from "react";

// DocsSidebar must stay a server component, `source` transitively imports
// fs/promises; referencing it from a "use client" module breaks the browser
// bundle. The page tree crosses into SidebarSections as a serializable prop.
export function DocsSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className={cn("group-data-[side=left]:border-r-0!", className)}
      {...props}
    >
      <nav aria-label="Documentation" className="flex h-full min-h-0 flex-col">
        <SidebarHeader className="px-4 pt-6 pb-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/docs"
            aria-label="Honest UI docs home"
            className="w-fit rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <BrandWordmark
              className="text-xl group-data-[collapsible=icon]:hidden"
              markClassName="size-5"
            />
            <BrandWordmark
              className="hidden group-data-[collapsible=icon]:inline-flex"
              markClassName="size-6"
              showWordmark={false}
            />
          </Link>
        </SidebarHeader>
        <SidebarContent className={cn("scroll-fade select-none", "pt-2 pb-14")}>
          <SidebarSections tree={source.pageTree} />
        </SidebarContent>
        <SidebarFooter className="gap-1 px-4 py-3 group-data-[collapsible=icon]:hidden">
          <a
            className="group/honest-ai border-border/60 hover:bg-sidebar-accent mb-3 flex flex-col gap-1 rounded-lg border p-3 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={HONEST_AI_URL}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              Honest AI
              <Badge size="sm" variant="accent">
                New
              </Badge>
              <ArrowUpRight
                aria-hidden="true"
                className="text-muted-foreground group-hover/honest-ai:text-foreground ml-auto size-3.5 transition-colors"
              />
            </span>
            <span className="text-muted-foreground text-xs leading-snug">
              {HONEST_AI_TAGLINE}
            </span>
          </a>
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">Resources</p>
          <Link
            className="text-muted-foreground w-fit rounded-sm text-xs outline-none hover:text-foreground hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href="/compare"
          >
            Comparisons
          </Link>
          <Link
            className="text-muted-foreground w-fit rounded-sm text-xs outline-none hover:text-foreground hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href="/privacy"
          >
            Privacy and analytics
          </Link>
        </SidebarFooter>
      </nav>
    </Sidebar>
  );
}
