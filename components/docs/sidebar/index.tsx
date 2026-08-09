import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarSections } from "./sidebar-sections";
import { BrandWordmark } from "@/components/brand-wordmark";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";
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
      <SidebarHeader className="px-4 pt-6 pb-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/docs"
          aria-label="Honest UI docs home"
          className="w-fit rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <BrandWordmark className="text-lg group-data-[collapsible=icon]:hidden" />
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
    </Sidebar>
  );
}
