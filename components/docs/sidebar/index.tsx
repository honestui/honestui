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
import Image from "next/image";
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
            {/* Crop the source SVG's presentation padding so the artwork has a 20px visual height. */}
            <span className="relative block h-5 w-[124px] overflow-hidden group-data-[collapsible=icon]:hidden">
              <Image
                src="/logo-wordmark.svg"
                alt=""
                aria-hidden="true"
                width={700}
                height={240}
                className="absolute top-[-13.7px] left-0 h-auto w-[137px] max-w-none dark:invert"
              />
            </span>
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
      </nav>
    </Sidebar>
  );
}
