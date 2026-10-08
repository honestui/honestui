"use client"

import * as React from "react"
import {
  Copy as CopyIcon,
  Download as DownloadIcon,
  MessageSquare as CommentsIcon,
  Printer as PrinterIcon,
  Redo as RedoIcon,
  Undo as UndoIcon,
} from "honestui/icons"

import {
  OverflowToolbar,
  OverflowToolbarGroup,
  OverflowToolbarItem,
  OverflowToolbarMore,
} from "@/registry/default/product/overflow-toolbar/overflow-toolbar"

const bodyText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * There is no document behind this preview. Each action only reports its
 * name, except the comments action, which opens a panel beside the toolbar.
 * The window stays the same size; the panel is what takes the toolbar's space.
 */
export default function OverflowToolbarDemo() {
  const [areCommentsOpen, setAreCommentsOpen] = React.useState(false)
  const [undoneSteps, setUndoneSteps] = React.useState(0)
  const [lastAction, setLastAction] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-[var(--hui-space-3)]">
      <div className="flex min-w-0 items-stretch gap-[var(--hui-space-3)]">
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--hui-space-3)]">
          <OverflowToolbar aria-label="Document">
            <OverflowToolbarGroup label="History">
              <OverflowToolbarItem
                priority="always"
                iconOnly
                label="Undo"
                icon={<UndoIcon aria-hidden="true" />}
                onSelect={() => {
                  setUndoneSteps((steps) => steps + 1)
                  setLastAction("Undo")
                }}
              />
              <OverflowToolbarItem
                priority={3}
                iconOnly
                label="Redo"
                icon={<RedoIcon aria-hidden="true" />}
                disabled={undoneSteps === 0}
                onSelect={() => {
                  setUndoneSteps((steps) => steps - 1)
                  setLastAction("Redo")
                }}
              />
            </OverflowToolbarGroup>
            <OverflowToolbarGroup label="Export">
              <OverflowToolbarItem
                priority={2}
                label="Copy link"
                icon={<CopyIcon aria-hidden="true" />}
                onSelect={() => setLastAction("Copy link")}
              />
              <OverflowToolbarItem
                priority={1}
                label="Download"
                icon={<DownloadIcon aria-hidden="true" />}
                onSelect={() => setLastAction("Download")}
              />
              <OverflowToolbarItem
                priority={1}
                label="Print"
                icon={<PrinterIcon aria-hidden="true" />}
                onSelect={() => setLastAction("Print")}
              />
            </OverflowToolbarGroup>
            <OverflowToolbarGroup label="Review">
              <OverflowToolbarItem
                label={areCommentsOpen ? "Hide comments" : "Show comments"}
                icon={<CommentsIcon aria-hidden="true" />}
                onSelect={() => {
                  setLastAction(areCommentsOpen ? "Hide comments" : "Show comments")
                  setAreCommentsOpen(!areCommentsOpen)
                }}
              />
            </OverflowToolbarGroup>
            <OverflowToolbarMore />
          </OverflowToolbar>
          <p
            className={`m-0 text-[var(--hui-color-foreground-base-secondary)] ${bodyText}`}
          >
            Sample document. Open the comments to take space from the toolbar.
          </p>
        </div>
        {areCommentsOpen && (
          <section
            aria-label="Comments"
            className={`w-2/5 max-w-56 shrink-0 rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-4)] text-[var(--hui-color-foreground-base-secondary)] ${bodyText}`}
          >
            No comments in this sample.
          </section>
        )}
      </div>
      <p
        role="status"
        className={`m-0 min-h-[var(--hui-line-height-small)] text-[var(--hui-color-foreground-base-primary)] ${bodyText}`}
      >
        {lastAction !== null && `Last action: ${lastAction}`}
      </p>
    </div>
  )
}
