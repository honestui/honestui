"use client"

import * as React from "react"
import {
  Archive as ArchiveIcon,
  Copy as CopyIcon,
  Folder as FolderIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon,
} from "honestui/icons"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/default/ui/context-menu"

export default function ContextMenuDemo() {
  const [lastAction, setLastAction] = React.useState("No action selected")

  return (
    <div className="w-full max-w-md space-y-3">
      <ContextMenu>
        <ContextMenuTrigger
          className="flex min-h-48 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground"
          tabIndex={0}
        >
          <span>
            Right-click or long-press this area.
            <span className="mt-1 block text-xs">
              With a keyboard, focus it and press Shift+F10.
            </span>
          </span>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>Document</ContextMenuLabel>
            <ContextMenuItem
              leadingIcon={<CopyIcon />}
              onClick={() => setLastAction("Copied document link")}
            >
              Copy link
            </ContextMenuItem>
            <ContextMenuItem
              leadingIcon={<PencilIcon />}
              onClick={() => setLastAction("Rename selected")}
            >
              Rename
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger leadingIcon={<FolderIcon />}>
              Move to
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onClick={() => setLastAction("Moved to Projects")}
              >
                Projects
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setLastAction("Moved to Research")}
              >
                Research
              </ContextMenuItem>
              <ContextMenuItem
                leadingIcon={<ArchiveIcon />}
                onClick={() => setLastAction("Moved to Archive")}
              >
                Archive
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem
            leadingIcon={<TrashIcon />}
            variant="destructive"
            onClick={() => setLastAction("Delete selected")}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {lastAction}
      </p>
    </div>
  )
}
