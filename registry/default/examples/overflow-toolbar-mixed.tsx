"use client"

import * as React from "react"
import {
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  Ellipsis as EllipsisIcon,
  Star as StarIcon,
  Trash as TrashIcon,
} from "honestui/icons"

import {
  OverflowToolbar,
  OverflowToolbarGroup,
  OverflowToolbarItem,
  OverflowToolbarMore,
} from "@/registry/default/product/overflow-toolbar/overflow-toolbar"
import { Switch } from "@/registry/default/ui/switch"
import { ToolbarInput } from "@/registry/default/ui/toolbar"

const smallText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * A filter field next to icon-only actions. The field is an ordinary toolbar
 * part: it never collapses, and its fixed width is taken from the actions'
 * space. The actions do nothing here and the field filters nothing.
 */
export default function OverflowToolbarMixed() {
  const [isNarrow, setIsNarrow] = React.useState(false)
  const labelId = React.useId()

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col gap-[var(--hui-space-4)]">
      <div
        className={`inline-flex min-h-6 items-center gap-[var(--hui-space-2)] text-[var(--hui-color-foreground-base-primary)] ${smallText}`}
      >
        <Switch
          aria-labelledby={labelId}
          checked={isNarrow}
          onCheckedChange={setIsNarrow}
          // Forced colors removes the track and thumb fills, so draw both with system colors.
          className="forced-colors:box-content forced-colors:border forced-colors:border-[ButtonText] forced-colors:[&>span]:bg-[ButtonText]"
        />
        <span id={labelId}>Narrow container</span>
      </div>
      <div className={isNarrow ? "w-60 max-w-full" : "w-full"}>
        <OverflowToolbar aria-label="Files">
          <ToolbarInput
            aria-label="Filter files"
            placeholder="Filter"
            type="search"
            className={`h-8 w-32 shrink-0 rounded-[var(--hui-radius-2)] border-[0.5px]! border-[var(--hui-color-border-base-primary)]! bg-transparent px-[var(--hui-space-3)] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:[outline:var(--hui-focus-ring)] ${smallText}`}
          />
          <OverflowToolbarGroup label="Selected files">
            <OverflowToolbarItem
              priority={3}
              iconOnly
              label="Download"
              icon={<DownloadIcon aria-hidden="true" />}
            />
            <OverflowToolbarItem
              priority={2}
              iconOnly
              label="Add to favorites"
              icon={<StarIcon aria-hidden="true" />}
            />
            <OverflowToolbarItem
              priority={1}
              iconOnly
              label="Archive"
              icon={<ArchiveIcon aria-hidden="true" />}
            />
            <OverflowToolbarItem
              priority={0}
              iconOnly
              label="Move to trash"
              icon={<TrashIcon aria-hidden="true" />}
            />
          </OverflowToolbarGroup>
          <OverflowToolbarMore label="More file actions">
            <EllipsisIcon aria-hidden="true" />
          </OverflowToolbarMore>
        </OverflowToolbar>
      </div>
    </div>
  )
}
