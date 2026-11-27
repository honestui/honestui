"use client"

import * as React from "react"
import { FileText as FileTextIcon, Globe as GlobeIcon, Wrench as WrenchIcon } from "honestui/icons"

import { SidebarNav } from "@/registry/honest-ai/ai/sidebar-nav"

// Sample destinations and threads.
const sampleThreads = [
  { id: "t1", title: "Billing export rounding" },
  { id: "t2", title: "Staging migration plan" },
  { id: "t3", title: "Focus ring contrast" },
  { id: "t4", title: "Supplier email drafts" },
]

// The opening exchange of each sample thread, so the pane reads like a chat.
const sampleExchanges: Record<string, { ask: string; reply: string }> = {
  t1: {
    ask: "Why are the March export totals off by a cent?",
    reply: "Each line is rounded before it is summed. Rounding the total once fixes all 14 invoices.",
  },
  t2: {
    ask: "Plan the staging migration for Thursday.",
    reply: "Three steps: snapshot the database, run the schema change, then replay the last hour of writes.",
  },
  t3: {
    ask: "Is the focus ring visible on the dark theme?",
    reply: "Not on the gray buttons. Raising the ring to the emphasis border clears 3:1 everywhere.",
  },
  t4: {
    ask: "Draft follow-ups for the two late suppliers.",
    reply: "Both drafts are ready. Each cites the invoice number and the original due date.",
  },
}

const pageNotes: Record<string, string> = {
  home: "Pick up a recent chat, or start a new one.",
  files: "12 files shared with this workspace.",
  tools: "Connected tools the agent can call.",
}

export default function SidebarNavDemo() {
  const [activeItem, setActiveItem] = React.useState("home")
  const [activeThread, setActiveThread] = React.useState<string | undefined>("t1")
  const thread = sampleThreads.find((candidate) => candidate.id === activeThread)

  return (
    <div className="flex h-96 w-full max-w-lg min-w-0 overflow-hidden rounded-[var(--hui-radius-4)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-feather)]">
      <SidebarNav
        className="[&_ul]:no-scrollbar"
        header={<span className="[font-weight:var(--hui-font-weight-medium)]">Sample workspace</span>}
        items={[
          { id: "home", label: "Home", icon: <GlobeIcon /> },
          { id: "files", label: "Files", icon: <FileTextIcon />, badge: "12" },
          { id: "tools", label: "Tools", icon: <WrenchIcon /> },
        ]}
        // An open chat is the current location, so no destination is marked current with it.
        activeItemId={activeThread ? undefined : activeItem}
        onNavigate={(itemId) => {
          setActiveItem(itemId)
          setActiveThread(undefined)
        }}
        threads={sampleThreads}
        activeThreadId={activeThread}
        onThreadSelect={setActiveThread}
        onNewChat={() => {
          setActiveItem("home")
          setActiveThread(undefined)
        }}
      />
      <ThreadPane
        title={thread?.title ?? labelFor(activeItem)}
        exchange={thread ? sampleExchanges[thread.id] : undefined}
        note={thread ? undefined : pageNotes[activeItem]}
      />
    </div>
  )
}

function labelFor(itemId: string) {
  return itemId.charAt(0).toUpperCase() + itemId.slice(1)
}

/** A stand-in for the app's main pane: the open chat, or the page's empty state. */
function ThreadPane({
  title,
  exchange,
  note,
}: {
  title: string
  exchange?: { ask: string; reply: string }
  note?: string
}) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center border-b-[0.5px] border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-5)]">
        <p className="m-0 truncate [font-weight:var(--hui-font-weight-medium)]">{title}</p>
      </div>
      {exchange ? (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--hui-space-5)] overflow-hidden p-[var(--hui-space-5)]">
          <p className="m-0 max-w-[85%] self-end rounded-[var(--hui-radius-4)] bg-[var(--hui-color-background-neutral-primary)] px-[var(--hui-space-4)] py-[var(--hui-space-3)]">
            {exchange.ask}
          </p>
          <p className="m-0 text-[var(--hui-color-foreground-base-primary)]">{exchange.reply}</p>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-[var(--hui-space-5)]">
          <p className="m-0 text-center text-[var(--hui-color-foreground-base-secondary)]">{note}</p>
        </div>
      )}
    </section>
  )
}
