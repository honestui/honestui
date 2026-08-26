"use client";

import type { Root as PageTreeRoot } from "fumadocs-core/page-tree";
import {
  ChartComponentOptions,
  ChartStartedOptions,
  DocumentationOptions,
  ExampleOptions,
  IconStartedOptions,
  AnimatedStartedOptions,
  ProductStartedOptions,
  ShaderStartedOptions,
} from "@/globals/constants/docs-sidebar";
import { RenderDefaultOptions } from "./render-default-options";
import {
  AnimatedTreeNavigation,
  DocsTreeNavigation,
  ProductTreeNavigation,
  ShaderTreeNavigation,
} from "./docs-tree-navigation";
import { areaFromPathname, ProviderSwitcher } from "./provider-switcher";
import { usePathname } from "next/navigation";
import { NavMain } from "./nav-main";
import {
  assetCollectionFromPathname,
  IconCategoryNavigation,
  IconCollectionNavigation,
} from "./icon-category-navigation";
import { ASSET_CATEGORIES } from "@/globals/constants/icon-categories";

export function SidebarSections({ tree }: { tree: PageTreeRoot }) {
  const pathname = usePathname();
  const activeArea = areaFromPathname(pathname);
  const assetCollection = assetCollectionFromPathname(pathname);
  const displayedAssetCollection = assetCollection ?? "icons";

  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden">
        <ProviderSwitcher />
      </div>

      {activeArea === "components" ? (
        <DocsTreeNavigation tree={tree} />
      ) : activeArea === "product" ? (
        <>
          <RenderDefaultOptions label="Get Started" options={ProductStartedOptions} />
          <ProductTreeNavigation tree={tree} />
        </>
      ) : activeArea === "charts" ? (
        <>
          <RenderDefaultOptions label="Get Started" options={ChartStartedOptions} />
          <NavMain tree={tree} rootFolder="charts" label="Components" />
          <RenderDefaultOptions label="Chart Components" options={ChartComponentOptions} />
          <RenderDefaultOptions label="Documentation" options={DocumentationOptions} />
        </>
      ) : activeArea === "icons" ? (
        <>
          <RenderDefaultOptions label="Get Started" options={IconStartedOptions} />
          <IconCollectionNavigation collection={assetCollection} />
          <IconCategoryNavigation
            categories={ASSET_CATEGORIES[displayedAssetCollection]}
            collection={displayedAssetCollection}
          />
        </>
      ) : activeArea === "shaders" ? (
        <>
          <RenderDefaultOptions label="Get Started" options={ShaderStartedOptions} />
          <ShaderTreeNavigation tree={tree} />
        </>
      ) : activeArea === "examples" ? (
        <RenderDefaultOptions label="Examples" options={ExampleOptions} />
      ) : (
        <>
          <RenderDefaultOptions label="Get Started" options={AnimatedStartedOptions} />
          <AnimatedTreeNavigation tree={tree} />
        </>
      )}
    </>
  );
}
