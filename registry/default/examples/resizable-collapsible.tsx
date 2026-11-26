"use client"

import * as React from "react"
import { PanelLeft as PanelLeftIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type ResizablePanelHandle,
} from "@/registry/default/ui/resizable"

const channels = ["general", "design-review", "releases", "support"]

export default function ResizableCollapsible() {
  const sidebar = React.useRef<ResizablePanelHandle>(null)
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      autoSaveId="resizable-collapsible-example"
      className="h-72 w-full max-w-2xl rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
    >
      <ResizablePanel
        id="channels-sidebar"
        panelRef={sidebar}
        defaultSize={28}
        minSize={20}
        maxSize={40}
        collapsible
        collapsedSize={0}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}
      >
        <nav aria-label="Channels" className="flex h-full flex-col gap-[var(--hui-space-1)] p-[var(--hui-space-3)]">
          {channels.map((channel) => (
            <span
              key={channel}
              className="truncate text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-control,13px)]"
            >
              # {channel}
            </span>
          ))}
        </nav>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize channel list" />
      <ResizablePanel defaultSize={72} minSize={40}>
        <div className="flex h-full flex-col gap-[var(--hui-space-3)] p-[var(--hui-space-3)]">
          <Button
            variant="ghost"
            size="sm"
            aria-controls="channels-sidebar"
            aria-expanded={!collapsed}
            onClick={() => (collapsed ? sidebar.current?.expand() : sidebar.current?.collapse())}
          >
            <PanelLeftIcon aria-hidden="true" />
            {collapsed ? "Show channels" : "Hide channels"}
          </Button>
          <p className="m-0 text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-control,13px)] [line-height:var(--hui-line-height-regular)]">
            Drag the divider past the minimum width, press Enter on it, or use the button to collapse the channel list.
          </p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
