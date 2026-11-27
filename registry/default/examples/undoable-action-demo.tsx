"use client"

import * as React from "react"
import { Archive as ArchiveIcon } from "honestui/icons"

import { Button } from "@/registry/default/ui/button"
import {
  UndoBar,
  useUndoableAction,
} from "@/registry/default/product/undoable-action/undoable-action"

type Conversation = { id: string; from: string; subject: string; read: boolean }

// Sample conversations.
const sampleInbox: Conversation[] = [
  { id: "c1", from: "Maya Chen", subject: "Q4 roadmap review notes", read: false },
  { id: "c2", from: "Billing", subject: "Invoice #1042 is paid", read: true },
  { id: "c3", from: "Jonas Weber", subject: "Re: Staging deploy freeze", read: true },
  { id: "c4", from: "GitHub", subject: "3 new review requests", read: true },
  { id: "c5", from: "Priya Natarajan", subject: "Offsite agenda, first draft", read: false },
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

const rowText =
  "[font-size:var(--hui-font-size-regular)] [letter-spacing:var(--hui-letter-spacing-regular)] [line-height:20px]"
const metaText =
  "[font-size:var(--hui-font-size-small)] [letter-spacing:var(--hui-letter-spacing-small)] [line-height:var(--hui-line-height-small)]"

/**
 * Nothing is sent until a countdown ends; the request is a timer here. Each
 * archive leaves the list at once, and Undo puts it back in its place.
 */
export default function UndoableActionDemo() {
  const [inbox, setInbox] = React.useState(sampleInbox)
  const undoable = useUndoableAction({ duration: 6000 })

  // Put conversations back in their original order, whatever else changed meanwhile.
  const restore = (ids: string[]) => () =>
    setInbox((current) =>
      sampleInbox.filter((item) => ids.includes(item.id) || current.some((kept) => kept.id === item.id))
    )

  const archive = (items: Conversation[]) => {
    const ids = items.map((item) => item.id)
    undoable.run({
      message:
        items.length === 1 ? `Archived “${items[0].subject}”` : `Archived ${items.length} conversations`,
      apply: () => {
        setInbox((current) => current.filter((item) => !ids.includes(item.id)))
        return restore(ids)
      },
      commit: () => wait(500),
    })
  }

  const read = inbox.filter((item) => item.read)

  return (
    <div className="relative flex w-full max-w-lg min-w-0 flex-col gap-[var(--hui-space-4)] pb-[var(--hui-space-2)]">
      <div className="flex min-w-0 items-center justify-between gap-[var(--hui-space-4)]">
        <p className={`m-0 text-[var(--hui-color-foreground-base-secondary)] tabular-nums ${metaText}`}>
          {inbox.length} in inbox
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={read.length === 0}
          className="shadow-none px-[var(--hui-space-4)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]"
          onClick={() => archive(read)}
        >
          {read.length === 0 ? "Archive read" : `Archive ${read.length} read`}
        </Button>
      </div>

      {inbox.length === 0 ? (
        <p className={`m-0 flex min-h-14 items-center justify-center rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-secondary)] ${metaText}`}>
          Inbox zero.
        </p>
      ) : (
        <ul
          aria-label="Inbox"
          className="m-0 list-none overflow-hidden rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] p-0 shadow-[var(--hui-shadow-feather)] [&>*+*]:border-t-[0.5px] [&>*+*]:border-t-[var(--hui-color-border-base-primary)]"
        >
          {inbox.map((item) => (
            <li
              key={item.id}
              className="flex min-h-14 min-w-0 items-center gap-[var(--hui-space-4)] px-[var(--hui-space-5)] py-[var(--hui-space-3)]"
            >
              <span
                aria-hidden="true"
                className={`size-1.5 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-[var(--hui-color-foreground-base-primary)]"}`}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`min-w-0 truncate text-[var(--hui-color-foreground-base-primary)] ${rowText} ${item.read ? "" : "[font-weight:var(--hui-font-weight-medium)]"}`}>
                  {item.subject}
                </span>
                <span className={`min-w-0 truncate text-[var(--hui-color-foreground-base-secondary)] ${metaText}`}>
                  {item.from}
                  {item.read ? "" : " · Unread"}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Archive “${item.subject}”`}
                className="size-7 min-h-7 shrink-0 text-[var(--hui-color-foreground-base-secondary)] shadow-none [&_svg]:size-3.5"
                onClick={() => archive([item])}
              >
                <ArchiveIcon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <UndoBar action={undoable} />
    </div>
  )
}
