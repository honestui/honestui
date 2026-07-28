"use client";

import {
  AddMagicIcon,
  CheckIcon,
  GithubIcon,
  HouseIcon,
  ShapesIcon,
  SquareAddonIcon,
} from "@/assets/icons";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { getNavItemIcon } from "@/globals/functions/getNavItemIcon";
import { flattenTree, type Root as PageTreeRoot } from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import Link from "next/link";

type PageItem = ReturnType<typeof flattenTree>[number];

const OVERVIEW_ICONS: Record<string, ReactNode> = {
  "/docs": <HouseIcon />,
  "/docs/get-started": <SquareAddonIcon />,
  "/docs/component-guide": <ShapesIcon />,
  "/docs/styling": <AddMagicIcon />,
  "/docs/accessibility": <CheckIcon />,
  "/docs/contributing": <GithubIcon />,
};

function PageGroup({ label, pages }: { label: string; pages: PageItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (pages.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {pages.map((page) => {
          const isActive = pathname === page.url;
          const icon = page.icon ?? OVERVIEW_ICONS[page.url] ?? getNavItemIcon(page.url);

          return (
            <SidebarMenuItem key={page.url}>
              <SidebarMenuButton
                render={
                  <Link
                    href={page.url}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  />
                }
                className={cn(
                  !isActive &&
                    "text-muted-foreground/90 hover:text-primary dark:text-muted-foreground/80 dark:hover:text-primary",
                )}
                isActive={isActive}
              >
                {icon}
                <span>{page.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function DocsTreeNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);

  const overviewPages = useMemo(
    () =>
      pages.filter((page) => {
        if (page.url === "/docs") return true;
        if (
          page.url === "/docs/charts" ||
          page.url === "/docs/icons" ||
          page.url === "/docs/animated" ||
          page.url === "/docs/shaders"
        )
          return false;
        if (page.url.startsWith("/docs/chart-")) return false;

        return page.url.startsWith("/docs/") && page.url.split("/").length === 3;
      }),
    [pages],
  );

  const componentPages = useMemo(
    () => pages.filter((page) => page.url.startsWith("/docs/components/")),
    [pages],
  );

  return (
    <>
      <PageGroup label="Get Started" pages={overviewPages} />
      <PageGroup label="Components" pages={componentPages} />
    </>
  );
}

export function ChartsTreeNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);

  const overviewPages = useMemo(
    () =>
      pages.filter(
        (page) =>
          page.url.startsWith("/docs/chart-") ||
          (page.url.startsWith("/docs/charts/") && page.url.split("/").length === 4),
      ),
    [pages],
  );

  return <PageGroup label="Get Started" pages={overviewPages} />;
}

export function AnimatedTreeNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);
  const componentPages = useMemo(
    () =>
      pages.filter(
        (page) =>
          page.url.startsWith("/docs/animated/") &&
          page.url !== "/docs/animated/installation",
      ),
    [pages],
  );

  return <PageGroup label="Components" pages={componentPages} />;
}

export function ShaderTreeNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);
  const componentPages = useMemo(
    () =>
      pages.filter(
        (page) =>
          page.url.startsWith("/docs/shaders/") &&
          page.url !== "/docs/shaders/installation",
      ),
    [pages],
  );

  return <PageGroup label="Shaders" pages={componentPages} />;
}
