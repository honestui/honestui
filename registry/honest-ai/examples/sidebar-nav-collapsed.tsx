"use client"

import { FileText as FileTextIcon, Globe as GlobeIcon } from "honestui/icons"

import { SidebarNav } from "@/registry/honest-ai/ai/sidebar-nav"

export default function SidebarNavCollapsedExample() {
  return (
    <div className="flex h-64 w-full max-w-lg min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]">
      <SidebarNav
        defaultCollapsed
        labels={{ navigation: "Workspace, collapsed example" }}
        items={[
          { id: "home", label: "Home", icon: <GlobeIcon /> },
          { id: "files", label: "Files", icon: <FileTextIcon /> },
        ]}
        activeItemId="home"
        onNavigate={() => undefined}
        threads={[]}
        onThreadSelect={() => undefined}
      />
      <div className="flex min-w-0 flex-1 items-center justify-center p-[var(--hui-space-5)]">
        <p className="m-0 max-w-64 text-center text-[var(--hui-color-foreground-base-secondary)]">
          Collapsed, each destination keeps its name for screen readers. Expand it to see the empty
          chat list.
        </p>
      </div>
    </div>
  )
}
