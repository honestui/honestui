"use client";

import {
  AddMagicIcon,
  BookIcon,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { History as HistoryIcon } from "honestui/icons";
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
  "/docs/changelog": <HistoryIcon aria-hidden="true" />,
  "/docs/developers": <BookIcon aria-hidden="true" data-icon="book" />,
};

/**
 * Pages currently carrying the "New" badge. Keep this list ADDITIVE ONLY:
 * each entry carries the date the page launched, and the badge disappears
 * by itself once the entry is older than two weeks. Expired rows can stay;
 * nothing ever needs manual pruning.
 */
const NEW_PAGES: readonly { url: string; releasedOn: string }[] = [
  { url: "/docs/components/command", releasedOn: "2026-08-18" },
  { url: "/docs/components/context-menu", releasedOn: "2026-08-18" },
  { url: "/docs/product/data-grid", releasedOn: "2026-08-26" },
  { url: "/docs/product/data-table", releasedOn: "2026-08-25" },
  { url: "/docs/product/date-range-picker", releasedOn: "2026-08-26" },
  { url: "/docs/product/filter-bar", releasedOn: "2026-08-26" },
  { url: "/docs/shaders/chromatic-image", releasedOn: "2026-08-18" },
  { url: "/docs/shaders/dither", releasedOn: "2026-08-18" },
];

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const NEW_PAGE_DATES = new Map(NEW_PAGES.map((page) => [page.url, page.releasedOn]));

function isRecentlyReleased(url: string): boolean {
  const releasedOn = NEW_PAGE_DATES.get(url);
  if (!releasedOn) {
    return false;
  }
  return Date.now() - Date.parse(releasedOn) < NEW_WINDOW_MS;
}

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
          const isNew = isRecentlyReleased(page.url);
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
                <span className="min-w-0 truncate">{page.name}</span>
                {isNew && (
                  <Badge className="ms-auto" size="micro" variant="neutral">
                    New
                  </Badge>
                )}
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
          page.url === "/docs/product" ||
          page.url === "/docs/shaders" ||
          page.url === "/docs/examples"
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

  const themePages = useMemo(
    () => pages.filter((page) => page.url.startsWith("/docs/theme/")),
    [pages],
  );

  return (
    <>
      <PageGroup label="Get Started" pages={overviewPages} />
      <PageGroup label="Theme" pages={themePages} />
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

export function ProductTreeNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);
  const componentPages = useMemo(
    () => pages.filter((page) => page.url.startsWith("/docs/product/")),
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
