import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarSections } from "./sidebar-sections";
import { BrandWordmark } from "@/components/brand-wordmark";
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
        <SidebarFooter className="gap-3 px-3 pt-2 pb-4 group-data-[collapsible=icon]:hidden">
          <a
            className="group/honest-ai flex flex-col gap-2 rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-3 py-2.5 outline-none transition-colors hover:border-[var(--hui-color-border-base-secondary)] hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={HONEST_AI_URL}
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] leading-4 font-medium text-[var(--hui-color-foreground-base-tertiary)]">
                <span aria-hidden="true" className="bg-foreground size-1.5 rounded-full" />
                New
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 text-[var(--hui-color-foreground-base-tertiary)] transition-[color,transform] duration-150 ease-out group-hover/honest-ai:translate-x-px group-hover/honest-ai:-translate-y-px group-hover/honest-ai:text-foreground motion-reduce:transition-none"
              />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] leading-4 font-medium tracking-[-0.01em]">Honest AI</span>
              <span className="text-[12px] leading-[1.45] text-pretty text-[var(--hui-color-foreground-base-secondary)]">
                {HONEST_AI_TAGLINE}
              </span>
            </span>
          </a>
          <div className="flex items-center gap-2 px-1 text-[12px] text-[var(--hui-color-foreground-base-tertiary)]">
            <Link
              className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href="/compare"
            >
              Comparisons
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href="/privacy"
            >
              Privacy
            </Link>
          </div>
        </SidebarFooter>
      </nav>
    </Sidebar>
  );
}
