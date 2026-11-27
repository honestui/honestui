"use client"

import * as React from "react"
import { Trash2 as TrashIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  UndoBar,
  useUndoableAction,
} from "@/registry/default/product/undoable-action/undoable-action"

type File = { id: string; name: string; size: string }

// Sample files.
const sampleFiles: File[] = [
  { id: "f1", name: "brand-guidelines-v3.pdf", size: "4.2 MB" },
  { id: "f2", name: "q3-board-deck.key", size: "18.6 MB" },
  { id: "f3", name: "headshots.zip", size: "212 MB" },
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * The first delete to reach the "server" is rejected. The file comes back and
 * the bar offers Retry, which sends it again straight away.
 */
export default function UndoableActionFailure() {
  const [files, setFiles] = React.useState(sampleFiles)
  const attempts = React.useRef(0)
  const undoable = useUndoableAction({ duration: 4000 })

  const remove = (file: File) =>
    undoable.run({
      message: `Deleted ${file.name}`,
      apply: () => {
        setFiles((current) => current.filter((item) => item.id !== file.id))
        return () =>
          setFiles((current) =>
            sampleFiles.filter((item) => item.id === file.id || current.some((kept) => kept.id === item.id))
          )
      },
      commit: async () => {
        await wait(600)
        attempts.current += 1
        if (attempts.current === 1) throw new Error("The storage service is unavailable.")
      },
    })

  return (
    <div className="flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)] pb-[var(--hui-space-2)]">
      <ul
        aria-label="Shared files"
        className="m-0 list-none overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0 shadow-[var(--hui-shadow-feather)] [&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"
      >
        {files.map((file) => (
          <li
            key={file.id}
            className="flex min-h-12 min-w-0 items-center justify-between gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-2)]"
          >
            <span className="flex min-w-0 items-baseline gap-[var(--hui-space-3)]">
              <span className="min-w-0 truncate font-mono text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:20px]">
                {file.name}
              </span>
              <span className={`shrink-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums ${metaText}`}>
                {file.size}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${file.name}`}
              className="size-7 min-h-7 shrink-0 text-[var(--hui-color-foreground-base-secondary)] shadow-none [&_svg]:size-3.5"
              onClick={() => remove(file)}
            >
              <TrashIcon aria-hidden="true" />
            </Button>
          </li>
        ))}
        {files.length === 0 && (
          <li className={`flex min-h-12 items-center justify-center px-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] ${metaText}`}>
            No shared files.
          </li>
        )}
      </ul>
      <UndoBar
        action={undoable}
        labels={{
          region: "Recent file actions",
          failed: (message, error) =>
            `${message.replace(/^Deleted/, "Could not delete")}. ${error instanceof Error ? error.message : ""} It is back in the list.`,
        }}
      />
    </div>
  )
}
