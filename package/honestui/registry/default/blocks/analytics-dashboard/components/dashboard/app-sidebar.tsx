"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "honestui/icons";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";
const COLLAPSED_CHANGE_EVENT = "sidebar-collapsed-change";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStoredCollapsed(next: boolean) {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
  } catch {
    // Storage can be unavailable; the toggle still works for this visit
    // through the change event below.
  }
  window.dispatchEvent(new Event(COLLAPSED_CHANGE_EVENT));
}

function subscribeToCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSED_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSED_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The collapsed preference lives in localStorage so it survives visits.
 * useSyncExternalStore keeps server and client first paint consistent
 * (server snapshot: expanded) without setState-in-effect churn.
 */
function useCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    readStoredCollapsed,
    () => false,
  );
  const setCollapsed = useCallback(
    (next: boolean) => writeStoredCollapsed(next),
    [],
  );
  return [collapsed, setCollapsed] as const;
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Brand />
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden className="size-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-2.5 pb-4">
        <SidebarNav />
      </div>
      <div className="px-2.5 pb-3">
        <Separator variant="secondary" className="mb-3" />
        <AccountMenu />
      </div>
    </>
  );
}

/**
 * Desktop sidebar — hidden below lg, where MobileHeader takes over.
 *
 * It can be collapsed out of the layout. While collapsed, moving the cursor
 * to the left edge of the screen (or tabbing into the sidebar) peeks it in
 * as an overlay; moving away hides it again. Expanding pins it back into
 * the layout. The choice persists across visits.
 */
export function AppSidebar() {
  const [collapsed, setCollapsed] = useCollapsed();
  const [peeking, setPeeking] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function persistCollapsed(next: boolean) {
    setCollapsed(next);
    setPeeking(false);
  }

  function showPeek() {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setPeeking(true);
  }

  // A short delay keeps the overlay from flickering when the cursor briefly
  // crosses its edge.
  function hidePeek() {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setPeeking(false), 150);
  }

  if (!collapsed) {
    return (
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent
          collapsed={false}
          onToggleCollapsed={() => persistCollapsed(true)}
        />
      </aside>
    );
  }

  return (
    <div className="hidden lg:block">
      {/* Hover target along the left edge of the screen. */}
      <div
        aria-hidden
        className="fixed inset-y-0 left-0 z-40 w-2"
        onMouseEnter={showPeek}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-out motion-reduce:transition-none",
          peeking && "translate-x-0 shadow-lg",
        )}
        onMouseEnter={showPeek}
        onMouseLeave={hidePeek}
        onFocusCapture={showPeek}
        onBlurCapture={hidePeek}
      >
        <SidebarContent
          collapsed
          onToggleCollapsed={() => persistCollapsed(false)}
        />
      </aside>
    </div>
  );
}
