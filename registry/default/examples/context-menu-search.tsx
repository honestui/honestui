"use client"

import * as React from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuEmptyState,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/registry/default/ui/context-menu"

export default function ContextMenuSearch() {
  const [lastAction, setLastAction] = React.useState("No command selected")

  return (
    <div className="w-full max-w-md space-y-3">
      <ContextMenu autocomplete>
        <ContextMenuTrigger
          className="flex min-h-48 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground"
          tabIndex={0}
        >
          <span>
            Open the context menu to search commands.
            <span className="mt-1 block text-xs">
              Right-click, long-press, or press Shift+F10.
            </span>
          </span>
        </ContextMenuTrigger>
        <ContextMenuContent
          searchLabel="Search document commands"
          searchPlaceholder="Search commands..."
        >
          <ContextMenuItem
            value="copy document link"
            onClick={() => setLastAction("Copied document link")}
          >
            Copy link
          </ContextMenuItem>
          <ContextMenuItem
            value="rename document"
            onClick={() => setLastAction("Rename selected")}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            value="duplicate document"
            onClick={() => setLastAction("Duplicated document")}
          >
            Duplicate
          </ContextMenuItem>
          <ContextMenuItem
            value="download export"
            onClick={() => setLastAction("Download selected")}
          >
            Download
          </ContextMenuItem>
          <ContextMenuItem
            value="archive document"
            onClick={() => setLastAction("Archive selected")}
          >
            Archive
          </ContextMenuItem>
          <ContextMenuEmptyState>No matching commands.</ContextMenuEmptyState>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {lastAction}
      </p>
    </div>
  )
}
