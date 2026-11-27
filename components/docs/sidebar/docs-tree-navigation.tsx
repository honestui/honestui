"use client";

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
import {
  flattenTree,
  type Root as PageTreeRoot,
} from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { isRecentlyReleased } from "./new-pages";

type PageItem = ReturnType<typeof flattenTree>[number];


function PageGroup({ label, pages }: { label: string; pages: PageItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (pages.length === 0) return null;

  return (
    <SidebarGroup className="py-1 group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-muted-foreground/70 h-7 text-[11px]">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-px">
        {pages.map((page) => {
          const isActive = pathname === page.url;
          const isNew = isRecentlyReleased(page.url);

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
                  "h-7 text-[13px]",
                  !isActive &&
                    "text-muted-foreground dark:text-foreground/80 hover:text-foreground dark:hover:text-foreground hover:bg-sidebar-accent/60 active:bg-sidebar-accent",
                )}
                isActive={isActive}
              >
                <span className="min-w-0 truncate">{page.name}</span>
                {isNew && (
                  <Badge className="ms-auto" size="sm" variant="secondary">
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
          page.url === "/docs/ai" ||
          page.url === "/docs/product" ||
          page.url === "/docs/shaders" ||
          page.url === "/docs/examples"
        )
          return false;
        if (page.url.startsWith("/docs/chart-")) return false;

        return (
          page.url.startsWith("/docs/") && page.url.split("/").length === 3
        );
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
          (page.url.startsWith("/docs/charts/") &&
            page.url.split("/").length === 4),
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

const AI_STARTED_PAGES = new Set(["/docs/ai", "/docs/ai/installation"]);

/** Sidebar groups for AI pages, matching the tables on /docs/ai. Pages sort A–Z within each. */
const AI_PAGE_GROUPS: readonly { label: string; pages: readonly string[] }[] = [
  { label: "Styles", pages: ["prose", "prose-syntax"] },
  {
    label: "Conversation",
    pages: [
      "chat-thread",
      "chat-welcome",
      "context-meter",
      "guardrail-notice",
      "markdown",
      "message-scroller",
      "message-usage",
      "prompt-bar",
      "prompt-suggestions",
      "prose-code-block",
      "search-list",
      "sidebar-nav",
      "streaming-text",
    ],
  },
  {
    label: "Agent activity",
    pages: [
      "agent-handoff",
      "agent-screen",
      "checkpoint",
      "flowchart",
      "loading-state",
      "memory-viewer",
      "plan",
      "queue",
      "task-rows",
      "thinking-state",
      "tool-chips",
      "trace-waterfall",
    ],
  },
  {
    label: "Decisions",
    pages: [
      "approval-card",
      "diff-table",
      "fine-tune-card",
      "input-request",
      "recommendation-card",
      "selection-actions",
    ],
  },
  {
    label: "Results",
    pages: [
      "artifact-panel",
      "code-view",
      "context-cards",
      "eval-compare",
      "filter-table",
      "insight-cards",
      "records-table",
    ],
  },
  {
    label: "Developer",
    pages: [
      "file-tree",
      "stack-trace",
      "terminal-output",
      "test-results",
      "web-preview",
    ],
  },
  {
    label: "Voice",
    pages: [
      "audio-player",
      "live-waveform",
      "transcript-viewer",
      "voice-input",
      "voice-orb",
    ],
  },
];

const AI_GROUP_BY_URL = new Map<string, string>(
  AI_PAGE_GROUPS.flatMap((group) =>
    group.pages.map((name): [string, string] => [
      `/docs/ai/${name}`,
      group.label,
    ]),
  ),
);

function byTitle(a: PageItem, b: PageItem) {
  return String(a.name).localeCompare(String(b.name));
}

export function AiTreeNavigation({ tree }: { tree: PageTreeRoot }) {
  const pages = useMemo(() => flattenTree(tree.children), [tree.children]);
  const groups = useMemo(() => {
    const aiPages = pages.filter((page) => page.url.startsWith("/docs/ai/"));
    const isGenerative = (page: PageItem) =>
      page.url === "/docs/ai/generative" ||
      page.url.startsWith("/docs/ai/generative/");

    const grouped = AI_PAGE_GROUPS.map((group) => ({
      label: group.label,
      pages: aiPages
        .filter((page) => AI_GROUP_BY_URL.get(page.url) === group.label)
        .sort(byTitle),
    }));
    // A new page not yet assigned to a group still shows up rather than vanishing.
    const ungrouped = aiPages
      .filter(
        (page) =>
          !AI_GROUP_BY_URL.has(page.url) &&
          !AI_STARTED_PAGES.has(page.url) &&
          !isGenerative(page),
      )
      .sort(byTitle);

    return {
      grouped,
      ungrouped,
      generative: aiPages.filter(isGenerative),
    };
  }, [pages]);

  return (
    <>
      {groups.grouped.map((group) => (
        <PageGroup key={group.label} label={group.label} pages={group.pages} />
      ))}
      <PageGroup label="More" pages={groups.ungrouped} />
      <PageGroup label="Generative UI" pages={groups.generative} />
    </>
  );
}
