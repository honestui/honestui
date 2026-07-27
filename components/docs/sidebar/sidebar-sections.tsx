"use client";

import type { Root as PageTreeRoot } from "fumadocs-core/page-tree";
import {
  ChartComponentOptions,
  ChartStartedOptions,
  DocumentationOptions,
  IconStartedOptions,
} from "@/globals/constants/docs-sidebar";
import { RenderDefaultOptions } from "./render-default-options";
import { DocsTreeNavigation } from "./docs-tree-navigation";
import { areaFromPathname, ProviderSwitcher } from "./provider-switcher";
import { usePathname } from "next/navigation";
import { NavMain } from "./nav-main";
import { IconCategoryNavigation } from "./icon-category-navigation";
import { ICON_CATEGORIES } from "@/globals/constants/icon-categories";

export function SidebarSections({ tree }: { tree: PageTreeRoot }) {
  const pathname = usePathname();
  const activeArea = areaFromPathname(pathname);

  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden">
        <ProviderSwitcher />
      </div>

      {activeArea === "components" ? (
        <DocsTreeNavigation tree={tree} />
      ) : activeArea === "charts" ? (
        <>
          <RenderDefaultOptions label="Get Started" options={ChartStartedOptions} />
          <NavMain tree={tree} rootFolder="charts" label="Components" />
          <RenderDefaultOptions label="Chart Components" options={ChartComponentOptions} />
          <RenderDefaultOptions label="Documentation" options={DocumentationOptions} />
        </>
      ) : (
        <>
          <RenderDefaultOptions label="Get Started" options={IconStartedOptions} />
          <IconCategoryNavigation categories={ICON_CATEGORIES} />
        </>
      )}
    </>
  );
}
